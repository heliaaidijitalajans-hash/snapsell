import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Upload, Sparkles, ImageIcon } from "lucide-react";
import { Link } from "react-router";
import { PriceAnalysisSection } from "../components/price/PriceAnalysisSection";
import { OptionGroup } from "../components/aiConfig/OptionGroup";
import { ProcessingView } from "../components/processing/ProcessingView";
import { useAiConfiguration } from "../hooks/useAiConfiguration";
import {
  BACKGROUND_IDS,
  BRAND_STYLE_IDS,
  CATEGORY_IDS,
  MARKETPLACE_IDS,
  QUALITY_IDS,
  RATIOS,
  type GenerationConfig,
} from "../services/aiConfig/aiConfigContent";
import {
  buildPipelinePrompt,
  toPhotoQuality,
} from "../services/aiConfig/buildPipelinePrompt";
import type { StoredGenerationConfig } from "../lib/libraryImages";
import type { PriceAnalysisViewFields } from "../services/price/priceTypes";

/** Boş = aynı origin (Vercel). Farklı backend için `VITE_API_BASE_URL`. */
const EDITOR_API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "").toString().trim().replace(/\/$/, "");
const APP_BASE_URL = (import.meta.env.VITE_APP_URL || "https://www.snapsell.website").toString().trim().replace(/\/$/, "");

/** /api/replicate/temp/ görselleri için API origin ile path birleştir (aynı origin veya ayrı backend). */
function ensureReplicateImageFromRailway(url: string): string {
  if (!url || !url.includes("/api/replicate/temp/")) return url;
  const rail = EDITOR_API_BASE.replace(/\/$/, "");
  if (rail && url.startsWith(rail)) return url;
  try {
    const path = new URL(url).pathname + new URL(url).search;
    return path.startsWith("/") ? rail + path : url;
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, rail);
  }
}

type Phase = "config" | "processing" | "result";

type PipelineError = Error & {
  billingUrl?: string;
  photoroomDashboard?: boolean;
  upgradeUrl?: string;
};

export function EditorReplicatePage({
  adminTestMode = false,
  adminToken = null,
}: {
  /** Admin Test Dönüşümü only — bypasses plan/credit UI gates; sends X-Admin-Token when provided. */
  adminTestMode?: boolean;
  /** Admin Panel token from /api/admin/login (same as Admin Dashboard). */
  adminToken?: string | null;
} = {}) {
  const { user, getAuthHeaders } = useAuth();
  const { t, locale } = useLanguage();
  const [hasEditor, setHasEditor] = useState<boolean | null>(adminTestMode ? true : null);
  const [freeEditorUsesRemaining, setFreeEditorUsesRemaining] = useState<number | null>(null);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("config");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [seoDescription, setSeoDescription] = useState<string | null>(null);
  const [libraryImageId, setLibraryImageId] = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState<GenerationConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorBillingUrl, setErrorBillingUrl] = useState<string | null>(null);
  const [errorUpgradeUrl, setErrorUpgradeUrl] = useState<string | null>(null);
  const [errorPhotoRoomDashboard, setErrorPhotoRoomDashboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { values, select, setCustomPrompt, reset, isCustomBackground, canGenerate, buildConfig } =
    useAiConfiguration();

  // Localized option groups (ids stable; labels react to language) — mirrors mobile useAiConfigOptions.
  const marketplaces = MARKETPLACE_IDS.map((id) => ({ id, label: t(`aiConfig.marketplaces.${id}`) }));
  const categories = CATEGORY_IDS.map((id) => ({ id, label: t(`aiConfig.categories.${id}`) }));
  const backgrounds = BACKGROUND_IDS.map((id) => ({ id, label: t(`aiConfig.backgrounds.${id}`) }));
  const qualities = QUALITY_IDS.map((id) => ({ id, label: t(`aiConfig.qualities.${id}`) }));
  const brandStyles = BRAND_STYLE_IDS.map((id) => ({ id, label: t(`aiConfig.brandStyles.${id}`) }));

  // Giriş yapmış kullanıcı için her zaman Bearer (user) kullan; sayfa yenilenince session ile 3 hak dönmesin
  useEffect(() => {
    let cancelled = false;
    if (adminTestMode) {
      setHasEditor(true);
      setFreeLimitReached(false);
      setFreeEditorUsesRemaining(null);
    }
    const fetchStatus = async () => {
      const headers: Record<string, string> = { ...(await getAuthHeaders()) };
      if (adminTestMode && adminToken) headers["X-Admin-Token"] = adminToken;
      const r = await fetch(`${EDITOR_API_BASE}/api/replicate/status`, { headers });
      const data = await r.json().catch(() => ({}));
      if (cancelled) return;
      if (adminTestMode) {
        setHasEditor(true);
        setFreeEditorUsesRemaining(null);
        setFreeLimitReached(false);
        return;
      }
      if (!r.ok) {
        setHasEditor(false);
        if (r.status === 401) setFreeEditorUsesRemaining(null);
        return;
      }
      const available = !!(data.photoRoomAvailable ?? data.available);
      setHasEditor(available);
      if (available) setFreeLimitReached(false);
      const remaining = data.freeEditorUsesRemaining;
      setFreeEditorUsesRemaining(typeof remaining === "number" ? remaining : null);
    };
    fetchStatus().catch(() => {
      if (cancelled) return;
      if (adminTestMode) {
        setHasEditor(true);
        return;
      }
      setHasEditor(false);
    });
    return () => { cancelled = true; };
  }, [user, getAuthHeaders, adminTestMode, adminToken]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("editor.pleaseSelectImage"));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError(null);
    setOutputUrl(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl, t]);

  /**
   * Runs the same AI conversion as before (`POST /api/photoroom/pipeline`) but
   * with the prompt/quality composed from the full AI Configuration (mirrors
   * mobile `runProcessJob`). Rejects on failure so ProcessingView can react.
   */
  const executePipeline = useCallback(
    async (signal: AbortSignal): Promise<void> => {
      if (!selectedFile || (!hasEditor && !adminTestMode)) {
        throw new Error(t("editor.failed"));
      }
      const config: GenerationConfig | null = buildConfig(previewUrl || selectedFile.name);
      if (!config) {
        throw new Error(t("editor.failed"));
      }
      setSessionConfig(config);
      setLibraryImageId(null);

      const headers: Record<string, string> = { ...(await getAuthHeaders()) };
      if (adminTestMode && adminToken) headers["X-Admin-Token"] = adminToken;
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(selectedFile);
      });

      // Link the processing (cancel) signal with a 100s request timeout.
      const requestController = new AbortController();
      let timedOut = false;
      const onOuterAbort = () => requestController.abort();
      if (signal.aborted) requestController.abort();
      else signal.addEventListener("abort", onOuterAbort);
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        requestController.abort();
      }, 100000);

      let res: Response;
      try {
        res = await fetch(`${EDITOR_API_BASE}/api/photoroom/pipeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            image: base64,
            prompt: buildPipelinePrompt(config),
            photoQuality: toPhotoQuality(config.quality),
            language: locale,
            generationConfig: {
              marketplace: config.marketplace,
              category: config.category,
              background: config.background,
              ratio: config.ratio,
              quality: config.quality,
              brandStyle: config.brandStyle,
              customPrompt: config.customPrompt,
            },
          }),
          signal: requestController.signal,
        });
      } catch (e) {
        if (timedOut) {
          const err = new Error(t("editor.timeout"));
          err.name = "AbortError";
          throw err;
        }
        throw e;
      } finally {
        window.clearTimeout(timeoutId);
        signal.removeEventListener("abort", onOuterAbort);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!adminTestMode && res.status === 402 && (data as any).limitReached) {
          setFreeLimitReached(true);
          setHasEditor(false);
          const limitErr = new Error(t("editor.freeLimitReached")) as PipelineError;
          throw limitErr;
        }
        const normalize = (v: unknown) => {
          if (!v) return "";
          if (typeof v === "string") return v;
          try { return JSON.stringify(v); } catch { return String(v); }
        };
        const errMsg = [normalize((data as any).error), normalize((data as any).detail)]
          .filter((s) => s && s.trim().length > 0)
          .join(" — ") || t("editor.failed");
        const err = new Error(errMsg) as PipelineError;
        if ((data as any).billingUrl) err.billingUrl = (data as any).billingUrl;
        if ((data as any).photoroomDashboardUrl) err.photoroomDashboard = true;
        if ((data as any).upgradeUrl) err.upgradeUrl = (data as any).upgradeUrl;
        throw err;
      }

      const libErr = (data as { libraryError?: string | null }).libraryError;
      if (libErr) console.warn("[SnapSell] Kütüphane kaydı (sunucu):", libErr);
      const libId = (data as { libraryId?: string | null }).libraryId;
      if (libId) setLibraryImageId(String(libId));
      const libOriginal = (data as { libraryOriginalImageUrl?: string | null }).libraryOriginalImageUrl;
      if (libOriginal && typeof libOriginal === "string" && libOriginal.startsWith("http")) {
        setPreviewUrl(libOriginal);
      }
      let imageUrl = (data.image ?? data.outputUrl ?? data.output?.[0] ?? (Array.isArray(data.output) ? data.output[0] : data.output)) as string | undefined;
      if (imageUrl && typeof imageUrl === "string") {
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:image")) {
          imageUrl = `data:image/png;base64,${imageUrl}`;
        }
        const apiOrigin = (EDITOR_API_BASE || APP_BASE_URL).replace(/\/$/, "");
        if (imageUrl.includes("yourdomain.com")) {
          imageUrl = imageUrl.replace(/https?:\/\/[^/]*yourdomain\.com/gi, apiOrigin);
        }
        if (imageUrl.startsWith("/")) {
          imageUrl = apiOrigin ? `${apiOrigin}${imageUrl}` : `${APP_BASE_URL}${imageUrl}`;
        }
        imageUrl = ensureReplicateImageFromRailway(imageUrl);
        const finalUrl = imageUrl.startsWith("data:") ? imageUrl : imageUrl + (imageUrl.includes("?") ? "&" : "?") + "_t=" + Date.now();
        setOutputUrl(finalUrl);
      } else {
        throw new Error(t("editor.failed"));
      }
      const d = data as Record<string, unknown>;
      const rawSeo =
        typeof d.seo === "string" ? d.seo
          : typeof (d as any).SEO === "string" ? (d as any).SEO
          : d.data && typeof d.data === "object" && typeof (d.data as Record<string, unknown>).seo === "string"
            ? (d.data as Record<string, unknown>).seo as string
            : "";
      const seoStr = (typeof rawSeo === "string" ? rawSeo : String(rawSeo || "")).trim();
      const seoFromApi =
        seoStr
          ? seoStr
          : typeof d.seoTitle === "string" && typeof d.seoDescription === "string"
            ? `Başlık: ${String(d.seoTitle).trim()}\nAçıklama: ${String(d.seoDescription).trim()}`
            : "";
      if (seoFromApi) setSeoDescription(seoFromApi);
      if (!adminTestMode && freeEditorUsesRemaining !== null) {
        setFreeEditorUsesRemaining(Math.max(0, freeEditorUsesRemaining - 1));
      }
    },
    [selectedFile, hasEditor, buildConfig, previewUrl, getAuthHeaders, locale, freeEditorUsesRemaining, t, adminTestMode, adminToken],
  );

  const handleTransform = useCallback(() => {
    if (!selectedFile || !canGenerate) return;
    setError(null);
    setErrorBillingUrl(null);
    setErrorUpgradeUrl(null);
    setErrorPhotoRoomDashboard(false);
    setOutputUrl(null);
    setSeoDescription(null);
    setLibraryImageId(null);
    setSessionConfig(null);
    setPhase("processing");
  }, [selectedFile, canGenerate]);

  const handleProcessingError = useCallback((e: unknown) => {
    const msg =
      e instanceof Error && e.name === "AbortError"
        ? t("editor.timeout")
        : e instanceof Error ? e.message : t("editor.failed");
    const extras =
      e instanceof Error && ("billingUrl" in e || "upgradeUrl" in e)
        ? (e as PipelineError)
        : null;
    setError(msg);
    setErrorBillingUrl(extras?.billingUrl || null);
    setErrorUpgradeUrl(extras?.upgradeUrl || null);
    setErrorPhotoRoomDashboard(!!extras?.photoroomDashboard);
    setPhase("config");
  }, [t]);

  const clearSelection = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    reset();
    setOutputUrl(null);
    setSeoDescription(null);
    setLibraryImageId(null);
    setSessionConfig(null);
    setError(null);
    setErrorBillingUrl(null);
    setErrorUpgradeUrl(null);
    setPhase("config");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl, reset]);

  if (hasEditor === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF5A5F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasEditor && !adminTestMode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FF5A5F]/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#FF5A5F]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {freeLimitReached ? t("editor.freeLimitReached") : t("editor.proPlanRequired")}
          </h2>
          <p className="text-gray-600 mb-6">
            {freeLimitReached ? t("editor.freeLimitReached") : t("editor.proPlanDesc")}
          </p>
          <Link
            to="/fiyatlandirma"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90"
          >
            {t("editor.goPricing")}
          </Link>
        </div>
      </div>
    );
  }

  // Processing phase — full SnapSell app processing experience.
  if (phase === "processing") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProcessingView
          runJob={executePipeline}
          onComplete={() => setPhase("result")}
          onError={handleProcessingError}
          onCancel={() => setPhase("config")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("aiConfig.title")}</h1>
        {adminTestMode ? null : freeEditorUsesRemaining !== null && (
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            {t("editor.freeUsesRemaining").replace("{{count}}", String(freeEditorUsesRemaining))}
          </span>
        )}
      </div>

      {phase === "result" && outputUrl ? (
        <ResultView
          previewUrl={previewUrl}
          outputUrl={outputUrl}
          seoDescription={seoDescription}
          sessionConfig={sessionConfig}
          libraryImageId={libraryImageId}
          onNew={clearSelection}
          t={t}
        />
      ) : (
        <>
          {!selectedFile ? (
            <div
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleFileSelect(f); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#FF5A5F] hover:bg-gray-50 transition"
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#FF5A5F]/10 text-[#FF5A5F]">
                  <Upload className="w-8 h-8" />
                </div>
              </div>
              <p className="text-gray-800 font-semibold mb-1">{t("editor.dragOrClick")}</p>
              <p className="text-sm text-gray-500">{t("editor.formats")}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {/* Hero — product photo + caption + subtitle (mirrors mobile AiConfiguration) */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-full max-w-sm aspect-square rounded-[24px] overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={previewUrl || ""} alt={t("aiConfig.productCaption")} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mt-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#FF5A5F]" />
                  {t("aiConfig.productCaption")}
                </p>
                <p className="text-base text-gray-500 text-center leading-relaxed">{t("aiConfig.subtitle")}</p>
                <button type="button" onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700 mt-1">
                  {t("editor.selectDifferent")}
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-8">
                <OptionGroup
                  title={t("aiConfig.marketplace")}
                  options={marketplaces}
                  value={values.marketplace}
                  onSelect={(id) => select("marketplace", id)}
                  variant="grid"
                />
                <OptionGroup
                  title={t("aiConfig.category")}
                  options={categories}
                  value={values.category}
                  onSelect={(id) => select("category", id)}
                  variant="grid"
                />
                <div className="flex flex-col gap-4">
                  <OptionGroup
                    title={t("aiConfig.background")}
                    options={backgrounds}
                    value={values.background}
                    onSelect={(id) => select("background", id)}
                    variant="grid"
                  />
                  {isCustomBackground ? (
                    <div className="flex flex-col gap-2">
                      <label htmlFor="ai-custom-prompt" className="text-sm font-semibold text-gray-700">
                        {t("aiConfig.customPromptLabel")}
                      </label>
                      <input
                        id="ai-custom-prompt"
                        type="text"
                        value={values.customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={t("aiConfig.customPromptPlaceholder")}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
                      />
                    </div>
                  ) : null}
                </div>
                <OptionGroup
                  title={t("aiConfig.ratio")}
                  options={RATIOS}
                  value={values.ratio}
                  onSelect={(id) => select("ratio", id)}
                  variant="chips"
                />
                <OptionGroup
                  title={t("aiConfig.quality")}
                  options={qualities}
                  value={values.quality}
                  onSelect={(id) => select("quality", id)}
                  variant="chips"
                />
                <OptionGroup
                  title={t("aiConfig.brandStyle")}
                  options={brandStyles}
                  value={values.brandStyle}
                  onSelect={(id) => select("brandStyle", id)}
                  variant="chips"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
              {!adminTestMode && errorBillingUrl && (
                <p className="mt-2">
                  <a href={errorBillingUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    {errorPhotoRoomDashboard ? t("editor.renewPhotoRoom") : t("editor.paymentBalance")}
                  </a>
                </p>
              )}
              {!adminTestMode && errorUpgradeUrl && (
                <p className="mt-2">
                  <Link to={errorUpgradeUrl} className="underline font-medium text-[#FF5A5F]">
                    {t("editor.goPricing")}
                  </Link>
                </p>
              )}
            </div>
          )}

          {selectedFile ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleTransform}
                disabled={!canGenerate}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_10px_18px_-6px_rgba(255,90,95,0.5)]"
              >
                <Sparkles className="w-5 h-5" />
                {t("aiConfig.generate")}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Result view — generated image + SEO + Price Analysis (SnapSell app parity). */
export function ResultView({
  previewUrl,
  outputUrl,
  seoDescription,
  onNew,
  t,
  sessionConfig = null,
  libraryImageId = null,
  cachedPriceAnalysis = null,
  disablePriceFetch = false,
  autoScroll = true,
  createdAt = null,
}: {
  previewUrl: string | null;
  outputUrl: string;
  seoDescription: string | null;
  onNew: () => void;
  t: (key: string) => string;
  sessionConfig?: GenerationConfig | StoredGenerationConfig | null;
  libraryImageId?: string | null;
  cachedPriceAnalysis?: PriceAnalysisViewFields | null;
  disablePriceFetch?: boolean;
  autoScroll?: boolean;
  createdAt?: string | null;
}) {
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const apiOrigin = (EDITOR_API_BASE || APP_BASE_URL).replace(/\/$/, "");
  let displayUrl = outputUrl;
  if (displayUrl.includes("yourdomain.com")) {
    displayUrl = displayUrl.replace(/https?:\/\/[^/]*yourdomain\.com/gi, apiOrigin);
  }
  displayUrl = ensureReplicateImageFromRailway(displayUrl);
  if (!displayUrl.startsWith("http") && !displayUrl.startsWith("data:image")) {
    displayUrl = `data:image/png;base64,${displayUrl}`;
  }
  if (displayUrl.startsWith("/")) {
    displayUrl = apiOrigin ? `${apiOrigin}${displayUrl}` : `${APP_BASE_URL}${displayUrl}`;
  }

  // Scroll only after the newest result section is mounted/rendered (not when the request starts).
  useEffect(() => {
    if (!autoScroll) return;
    const el = resultSectionRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [outputUrl, autoScroll]);

  const settingChips: { label: string; value: string }[] = [];
  if (sessionConfig) {
    const cfg = sessionConfig;
    if (cfg.marketplace) settingChips.push({ label: t("aiConfig.marketplace"), value: t(`aiConfig.marketplaces.${cfg.marketplace}`) });
    if (cfg.category) settingChips.push({ label: t("aiConfig.category"), value: t(`aiConfig.categories.${cfg.category}`) });
    if (cfg.background) settingChips.push({ label: t("aiConfig.background"), value: t(`aiConfig.backgrounds.${cfg.background}`) });
    if (cfg.ratio) settingChips.push({ label: t("aiConfig.ratio"), value: String(cfg.ratio) });
    if (cfg.quality) settingChips.push({ label: t("aiConfig.quality"), value: t(`aiConfig.qualities.${cfg.quality}`) });
    if (cfg.brandStyle) settingChips.push({ label: t("aiConfig.brandStyle"), value: t(`aiConfig.brandStyles.${cfg.brandStyle}`) });
    if (cfg.customPrompt) settingChips.push({ label: t("aiConfig.customPromptLabel"), value: String(cfg.customPrompt) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {createdAt ? (
          <p className="text-sm text-gray-500">
            {t("library.sessionSavedAt")}{" "}
            <time dateTime={createdAt}>{new Date(createdAt).toLocaleString()}</time>
          </p>
        ) : <span />}
        <button type="button" onClick={onNew} className="text-sm font-medium text-[#FF5A5F] hover:underline">
          {t("editor.selectDifferent")}
        </button>
      </div>

      {settingChips.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">{t("library.sessionSettings")}</h3>
          <div className="flex flex-wrap gap-2">
            {settingChips.map((chip) => (
              <div
                key={chip.label + chip.value}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-500">{chip.label}: </span>
                <span className="font-medium text-gray-900">{chip.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-gray-400" />
          {t("editor.original")}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{t("editor.originalHint")}</p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex justify-center">
          {previewUrl ? (
            <button type="button" className="cursor-zoom-in" onClick={() => setZoomSrc(previewUrl)}>
              <img src={previewUrl} alt={t("editor.original")} className="max-w-full max-h-72 object-contain rounded-lg" />
            </button>
          ) : (
            <p className="text-sm text-gray-500 py-8">{t("library.originalUnavailable")}</p>
          )}
        </div>
      </div>

      <div
        ref={resultSectionRef}
        className="bg-white rounded-xl border-2 border-[#FF5A5F]/30 p-6 shadow-sm scroll-mt-24"
      >
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#FF5A5F]" />
          {t("editor.result")}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{t("editor.resultHint")}</p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col items-center">
          <button type="button" className="cursor-zoom-in" onClick={() => setZoomSrc(displayUrl)}>
            <img
              src={displayUrl}
              alt="Generated result"
              className="max-w-full max-h-96 object-contain rounded-lg"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = "none";
                const next = img.nextElementSibling as HTMLElement | null;
                if (next) next.classList.remove("hidden");
              }}
            />
          </button>
          <p className="mt-2 text-sm text-amber-700 hidden">
            {t("editor.imageLoadFailed")}{" "}
            <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF5A5F] underline">
              {t("editor.openInNewTab")}
            </a>
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <a
            href={displayUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-[#FF5A5F] hover:underline"
          >
            {t("editor.downloadOrOpen")}
          </a>
          <button
            type="button"
            onClick={() => setZoomSrc(displayUrl)}
            className="inline-flex text-sm font-medium text-gray-700 hover:underline"
          >
            {t("library.zoom")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-blue-500" />
          {t("editor.seoDescription")}
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {seoDescription || t("editor.seoLoadingOrUnavailable")}
        </p>
      </div>

      <PriceAnalysisSection
        id={libraryImageId || outputUrl}
        productName=""
        description={(seoDescription || "").trim()}
        enabled={Boolean(outputUrl)}
        cachedPriceAnalysis={cachedPriceAnalysis}
        libraryImageId={libraryImageId}
        disableFetch={disablePriceFetch || Boolean(cachedPriceAnalysis)}
      />

      {zoomSrc ? (
        <div
          className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/90 text-sm font-medium underline"
            onClick={() => setZoomSrc(null)}
          >
            {t("library.closeZoom")}
          </button>
          <img
            src={zoomSrc}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}

