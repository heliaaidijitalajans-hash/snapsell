import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Upload, Sparkles, ImageIcon, Check, Store } from "lucide-react";
import { Link } from "react-router";
import { getApiBase } from "../config";
import { saveGeneratedImageToLibrary } from "../lib/libraryImages";

const MARKETPLACES = [
  { id: "trendyol", name: "Trendyol" },
  { id: "hepsiburada", name: "Hepsiburada" },
  { id: "n11", name: "n11" },
  { id: "amazon", name: "Amazon" },
  { id: "etsy", name: "Etsy" },
  { id: "temu", name: "Temu" },
  { id: "ciceksepeti", name: "Çiçek Sepeti" },
  { id: "tiktokshop", name: "TikTok Shop" },
] as const;

const QUALITY_OPTIONS = [
  { id: "studio" as const, nameKey: "editor.qualityStudio" },
  { id: "professional" as const, nameKey: "editor.qualityPro" },
  { id: "luxury" as const, nameKey: "editor.qualityLuxury" },
] as const;

export function EditorReplicatePage() {
  const { user, getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [hasEditor, setHasEditor] = useState<boolean | null>(null);
  const [freeEditorUsesRemaining, setFreeEditorUsesRemaining] = useState<number | null>(null);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [seoDescription, setSeoDescription] = useState<string | null>(null);
  const [priceSummary, setPriceSummary] = useState<string | null>(null);
  const [priceAnalysisPlatforms, setPriceAnalysisPlatforms] = useState<Array<{ name: string; currency: string; minPrice?: number; avgPrice?: number; maxPrice?: number }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorBillingUrl, setErrorBillingUrl] = useState<string | null>(null);
  const [errorUpgradeUrl, setErrorUpgradeUrl] = useState<string | null>(null);
  const [errorPhotoRoomDashboard, setErrorPhotoRoomDashboard] = useState(false);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [photoQuality, setPhotoQuality] = useState<"studio" | "professional" | "luxury">("studio");
  const [priceAnalysisProductDescription, setPriceAnalysisProductDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const toggleMarketplace = useCallback((id: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAuthHeaders()
      .then((headers) => fetch(`${getApiBase()}/api/replicate/status`, { headers }))
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const available = !!(data.photoRoomAvailable ?? data.available);
          setHasEditor(available);
          if (available) setFreeLimitReached(false);
          const remaining = data.freeEditorUsesRemaining;
          setFreeEditorUsesRemaining(typeof remaining === "number" ? remaining : null);
        }
      })
      .catch(() => {
        if (!cancelled) setHasEditor(false);
      });
    return () => { cancelled = true; };
  }, [getAuthHeaders]);

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

  const runPipeline = useCallback(async () => {
    if (!selectedFile || !hasEditor) return;
    setError(null);
    setOutputUrl(null);
    setSeoDescription(null);
    setPriceSummary(null);
    setPriceAnalysisPlatforms(null);
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(selectedFile);
      });
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 100000);
      const res = await fetch(`${getApiBase()}/api/photoroom/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          image: base64,
          prompt: prompt.trim() || (photoQuality === "luxury" ? "luxury product photography, premium lighting, elegant background" : photoQuality === "professional" ? "commercial product shot, clean neutral background, professional" : "professional product photography, studio lighting, soft daylight"),
          photoQuality,
          productDescriptionForPriceAnalysis: priceAnalysisProductDescription.trim() || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402 && (data as any).limitReached) {
          setFreeLimitReached(true);
          setHasEditor(false);
          setLoading(false);
          return;
        }
        const normalize = (v: unknown) => {
          if (!v) return "";
          if (typeof v === "string") return v;
          try { return JSON.stringify(v); } catch { return String(v); }
        };
        const errMsg = [normalize((data as any).error), normalize((data as any).detail)]
          .filter((s) => s && s.trim().length > 0)
          .join(" — ") || t("editor.failed");
        const err = new Error(errMsg) as Error & { billingUrl?: string; photoroomDashboard?: boolean; upgradeUrl?: string };
        if ((data as any).billingUrl) err.billingUrl = (data as any).billingUrl;
        if ((data as any).photoroomDashboardUrl) err.photoroomDashboard = true;
        if ((data as any).upgradeUrl) err.upgradeUrl = (data as any).upgradeUrl;
        throw err;
      }
      let imageUrl = (data.image ?? data.outputUrl ?? data.output?.[0] ?? (Array.isArray(data.output) ? data.output[0] : data.output)) as string | undefined;
      if (imageUrl && typeof imageUrl === "string") {
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:image")) {
          imageUrl = `data:image/png;base64,${imageUrl}`;
        }
        if (imageUrl.startsWith("/")) {
          const apiBase = getApiBase();
          imageUrl = `${apiBase}${imageUrl}`;
        }
        const finalUrl = imageUrl.startsWith("data:") ? imageUrl : imageUrl + (imageUrl.includes("?") ? "&" : "?") + "_t=" + Date.now();
        console.log("Image URL type:", finalUrl.substring(0, 30));
        setOutputUrl(finalUrl);
        if (user?.uid && imageUrl.startsWith("data:")) {
          const userPrompt = prompt.trim() || (photoQuality === "luxury" ? "luxury product photography" : photoQuality === "professional" ? "commercial product shot" : "professional product photography");
          saveGeneratedImageToLibrary(user.uid, imageUrl, userPrompt).catch((err) => console.warn("Library save failed:", err));
        }
      }
      if (data.seo && typeof data.seo === "string") setSeoDescription(data.seo);
      if (data.priceSummary && typeof data.priceSummary === "string") setPriceSummary(data.priceSummary);
      if (Array.isArray(data.priceAnalysis) && data.priceAnalysis.length > 0) setPriceAnalysisPlatforms(data.priceAnalysis);
      if (freeEditorUsesRemaining !== null) {
        setFreeEditorUsesRemaining(Math.max(0, freeEditorUsesRemaining - 1));
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? t("editor.timeout")
          : e instanceof Error ? e.message : t("editor.failed");
      const errWithExtras = e instanceof Error && ("billingUrl" in e || "upgradeUrl" in e) ? (e as Error & { billingUrl?: string; upgradeUrl?: string; photoroomDashboard?: boolean }) : null;
      setError(msg);
      setErrorBillingUrl(errWithExtras?.billingUrl || null);
      setErrorUpgradeUrl(errWithExtras?.upgradeUrl || null);
      setErrorPhotoRoomDashboard(!!errWithExtras?.photoroomDashboard);
    } finally {
      setLoading(false);
    }
  }, [selectedFile, prompt, photoQuality, priceAnalysisProductDescription, hasEditor, getAuthHeaders, t, freeEditorUsesRemaining, user?.uid]);

  const clearSelection = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setPrompt("");
    setOutputUrl(null);
    setSeoDescription(null);
    setPriceSummary(null);
    setPriceAnalysisPlatforms(null);
    setError(null);
    setErrorBillingUrl(null);
    setErrorUpgradeUrl(null);
    setSelectedMarketplaces([]);
    setPhotoQuality("studio");
    setPriceAnalysisProductDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  if (hasEditor === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF5A5F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasEditor) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("editor.title")}</h1>
        {freeEditorUsesRemaining !== null && (
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            {t("editor.freeUsesRemaining").replace("{{count}}", String(freeEditorUsesRemaining))}
          </span>
        )}
      </div>

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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF5A5F]" />
                {t("editor.uploadedImage")}
              </h3>
              <img src={previewUrl || ""} alt={t("editor.uploadedAlt")} className="max-h-64 w-auto max-w-full object-contain rounded-lg border border-gray-200 bg-gray-50" />
            </div>
            <button type="button" onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700 shrink-0">{t("editor.selectDifferent")}</button>
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-base font-semibold text-gray-900">{t("editor.whereList")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("editor.multiStore")}</p>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(MARKETPLACES || []).map((m) => {
                const isSelected = selectedMarketplaces.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMarketplace(m.id)}
                    className={`relative flex items-center gap-3 rounded-xl p-3 sm:p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-[#FF5A5F]/10 ring-2 ring-[#FF5A5F] ring-inset shadow-sm"
                        : "bg-gray-50/80 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    <span
                      className={`flex shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#FF5A5F] text-white" : "bg-white border border-gray-200 text-gray-500"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                      ) : (
                        <Store className="w-5 h-5" />
                      )}
                    </span>
                    <span className={`text-sm font-medium truncate ${isSelected ? "text-[#FF5A5F]" : "text-gray-700"}`}>
                      {m.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5A5F]" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-base font-semibold text-gray-900">{t("editor.photoQuality")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("editor.selectStyle")}</p>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-3">
              {(QUALITY_OPTIONS || []).map((q) => {
                const isSelected = photoQuality === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setPhotoQuality(q.id)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl py-4 transition-all duration-200 ${
                      isSelected
                        ? "bg-[#FF5A5F]/10 ring-2 ring-[#FF5A5F] ring-inset shadow-sm"
                        : "bg-gray-50/80 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    <span
                      className={`flex shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#FF5A5F] text-white" : "bg-white border border-gray-200 text-gray-500"
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <span className={`text-sm font-medium ${isSelected ? "text-[#FF5A5F]" : "text-gray-700"}`}>
                      {t(q.nameKey)}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5A5F]" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-base font-semibold text-gray-900">{t("editor.conversionText")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("editor.conversionHint")}</p>
          </div>
          <div className="p-4 sm:p-5">
            <input
              id="photoroom-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("editor.promptPlaceholder")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-base font-semibold text-gray-900">{t("editor.priceAnalysisTitle")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("editor.priceAnalysisHint")}</p>
          </div>
          <div className="p-4 sm:p-5">
            <textarea
              id="price-analysis-product-description"
              value={priceAnalysisProductDescription}
              onChange={(e) => setPriceAnalysisProductDescription(e.target.value)}
              placeholder={t("editor.pricePlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none resize-y min-h-[80px]"
            />
          </div>
        </div>
      </section>

      <div className="mt-6">
        <button
          type="button"
          onClick={runPipeline}
          disabled={loading || !selectedFile}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              {t("editor.processing")}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t("editor.convert")}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
          {errorBillingUrl && (
            <p className="mt-2">
              <a href={errorBillingUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                {errorPhotoRoomDashboard ? t("editor.renewPhotoRoom") : t("editor.paymentBalance")}
              </a>
            </p>
          )}
          {errorUpgradeUrl && (
            <p className="mt-2">
              <Link to={errorUpgradeUrl} className="underline font-medium text-[#FF5A5F]">
                {t("editor.goPricing")}
              </Link>
            </p>
          )}
        </div>
      )}

      {outputUrl && (() => {
        let displayUrl = outputUrl;
        if (!displayUrl.startsWith("http") && !displayUrl.startsWith("data:image")) {
          displayUrl = `data:image/png;base64,${displayUrl}`;
        }
        if (displayUrl.startsWith("/")) {
          const apiBase = getApiBase();
          displayUrl = `${apiBase}${displayUrl}`;
        }
        return (
        <div ref={resultRef} className="mt-8 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gray-400" />
              {t("editor.original")}
            </h3>
            <p className="text-sm text-gray-500 mb-3">{t("editor.originalHint")}</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex justify-center">
              <img src={previewUrl || ""} alt={t("editor.original")} className="max-w-full max-h-72 object-contain rounded-lg" />
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-[#FF5A5F]/30 border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#FF5A5F]" />
              {t("editor.result")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{t("editor.resultHint")}</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col items-center">
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
              <p className="mt-2 text-sm text-amber-700 hidden">
                {t("editor.imageLoadFailed")}{" "}
                <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF5A5F] underline">
                  {t("editor.openInNewTab")}
                </a>
              </p>
            </div>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-[#FF5A5F] hover:underline"
            >
              {t("editor.downloadOrOpen")}
            </a>
          </div>

          {seoDescription && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-blue-500" />
                {t("editor.seoDescription")}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{seoDescription}</p>
            </div>
          )}

          {(priceSummary || (priceAnalysisPlatforms && priceAnalysisPlatforms.length > 0)) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-emerald-500" />
                {t("editor.priceAnalysis")}
              </h3>
              {priceSummary && <p className="text-gray-700 text-sm leading-relaxed mb-4">{priceSummary}</p>}
              {priceAnalysisPlatforms && priceAnalysisPlatforms.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600">
                        <th className="py-2 pr-4">{t("editor.priceSource")}</th>
                        <th className="py-2 pr-4">{t("editor.priceMin")}</th>
                        <th className="py-2 pr-4">{t("editor.priceAvg")}</th>
                        <th className="py-2">{t("editor.priceMax")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceAnalysisPlatforms.map((p: { name: string; currency: string; minPrice?: number; avgPrice?: number; maxPrice?: number }, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium text-gray-800">{p.name}</td>
                          <td className="py-2 pr-4">{p.minPrice != null ? (p.currency === "TRY" ? p.minPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : p.minPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })) : "—"}</td>
                          <td className="py-2 pr-4">{p.avgPrice != null ? (p.currency === "TRY" ? p.avgPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : p.avgPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })) : "—"}</td>
                          <td className="py-2">{p.maxPrice != null ? (p.currency === "TRY" ? p.maxPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : p.maxPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })) : "—"} {p.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500 italic">
                {t("editor.priceDisclaimer")}
              </p>
            </div>
          )}
        </div>
      );
      })()}
    </div>
  );
}
