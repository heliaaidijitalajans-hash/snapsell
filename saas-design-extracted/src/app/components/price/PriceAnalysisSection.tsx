import { useLanguage } from "../../contexts/LanguageContext";
import { usePriceAnalysis } from "../../hooks/usePriceAnalysis";
import { StatCard } from "./StatCard";
import { PriceHighlight } from "./PriceHighlight";
import type { PriceAnalysisViewFields } from "../../services/price/priceTypes";

type PriceAnalysisSectionProps = {
  /** Stable id for this result (dedupes duplicate requests). */
  id: string;
  productName: string;
  description: string;
  /** Only fetch once a result exists (mirrors mobile Result screen). */
  enabled: boolean;
  /** Restored library cache — never refetch when present. */
  cachedPriceAnalysis?: PriceAnalysisViewFields | null;
  /** Persist first analysis onto this library row. */
  libraryImageId?: string | null;
  /** History restore: block all price-analysis API calls. */
  disableFetch?: boolean;
};

/**
 * Website port of the SnapSell Mobile Result "Competitor Analysis" section.
 * Same loading / ready / unavailable states, same Average Price stat + price
 * highlight, same Retry behavior — adapted to the website's desktop layout.
 */
export function PriceAnalysisSection({
  id,
  productName,
  description,
  enabled,
  cachedPriceAnalysis = null,
  libraryImageId = null,
  disableFetch = false,
}: PriceAnalysisSectionProps) {
  const { t, locale } = useLanguage();
  const averageLabel = t("editor.priceAverageLabel");

  const {
    priceStatus,
    stats,
    formattedPrice,
    canRetryPriceAnalysis,
    retryPriceAnalysis,
  } = usePriceAnalysis({
    id,
    productName,
    description,
    language: locale,
    enabled,
    averageLabel,
    cachedPriceAnalysis,
    libraryImageId,
    disableFetch,
  });

  const showPriceSection =
    priceStatus === "loading" ||
    priceStatus === "unavailable" ||
    stats.length > 0 ||
    Boolean(formattedPrice);

  if (!showPriceSection) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-[#FF5A5F]" />
        {t("editor.competitorAnalysis")}
      </h3>

      {priceStatus === "loading" && stats.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="animate-spin w-4 h-4 border-2 border-[#FF5A5F] border-t-transparent rounded-full" />
          {t("editor.priceAnalyzing")}
        </div>
      ) : null}

      {priceStatus === "unavailable" && stats.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-gray-600">{t("editor.priceUnavailable")}</p>
          {canRetryPriceAnalysis ? (
            <button
              type="button"
              onClick={retryPriceAnalysis}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
            >
              {t("editor.priceRetry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {stats.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
            />
          ))}
        </div>
      ) : null}

      {formattedPrice ? (
        <PriceHighlight
          label={averageLabel}
          formattedPrice={formattedPrice}
          caption={t("editor.priceCaption")}
        />
      ) : null}
    </div>
  );
}
