import type { PriceAnalysisResponse, PriceAnalysisViewFields } from "./priceTypes";

/**
 * Maps POST /api/price-analysis into Result view fields.
 * Ported 1:1 from SnapSell Mobile (`src/services/result/mapPriceAnalysis.ts`).
 * Never invents a suggested price (no avg×0.95). Only real aggregates + summary.
 */
export const mapPriceAnalysisToResultFields = (
  response: PriceAnalysisResponse,
): PriceAnalysisViewFields => {
  const currency = (response.currency || "TRY").toUpperCase();
  const avg =
    typeof response.avgPrice === "number" && Number.isFinite(response.avgPrice)
      ? response.avgPrice
      : 0;

  const summary = (response.summary || "").trim();
  const platformLines = Array.isArray(response.platforms)
    ? response.platforms
        .filter(
          (p) =>
            p &&
            (typeof p.avgPrice === "number" ||
              typeof p.minPrice === "number" ||
              typeof p.maxPrice === "number"),
        )
        .map((p) => {
          const fmt = (v: number | null | undefined) =>
            typeof v === "number" ? String(v) : "—";
          return `${p.name}: ${fmt(p.minPrice)}–${fmt(p.maxPrice)} (avg ${fmt(p.avgPrice)}) ${p.currency || currency}`;
        })
    : [];

  const priceText = [summary, ...platformLines].filter(Boolean).join("\n");

  return {
    competitor: {
      averagePrice: { amount: avg, currency },
      // Unused in UI today (buildStats shows average only). Keep typed defaults
      // without inventing marketplace competition signals.
      competition: "low",
      demand: "low",
      difficulty: "low",
    },
    // No client-side suggestion — show average via stats / narrative only.
    suggestedPrice: { amount: 0, currency },
    priceText,
  };
};
