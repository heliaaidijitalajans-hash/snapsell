/**
 * Price Analysis wire + view types — ported 1:1 from SnapSell Mobile
 * (`src/api/types.ts` + `src/screens/Result/result.types.ts`).
 * Field names match `snapsell-app/server.js` (`shapePriceAnalysisV1`) exactly.
 */

/** POST /api/price-analysis request body (identical to mobile). */
export type PriceAnalysisRequest = {
  productName: string;
  description: string;
  language: string;
};

export type PriceAnalysisPlatform = {
  name: string;
  currency?: string;
  minPrice?: number | null;
  avgPrice?: number | null;
  maxPrice?: number | null;
  sellerCount?: number | null;
  sampleCount?: number | null;
};

export type PriceAnalysisResponse = {
  productName: string;
  currency: string;
  minPrice: number | null;
  avgPrice: number | null;
  maxPrice: number | null;
  platforms: PriceAnalysisPlatform[];
  summary: string;
};

/** A currency-aware monetary amount. `currency` is an ISO 4217 code. */
export type Money = {
  amount: number;
  currency: string;
};

export type MetricLevel = "low" | "medium" | "high";

export type CompetitorAnalysis = {
  averagePrice: Money;
  competition: MetricLevel;
  demand: MetricLevel;
  difficulty: MetricLevel;
};

export type StatTone = "positive" | "neutral" | "caution" | "critical";

/** A presentation-ready statistic derived from the competitor analysis. */
export type StatDescriptor = {
  key: string;
  label: string;
  value: string;
  tone: StatTone;
};

/** Result-screen fields produced from a price-analysis response. */
export type PriceAnalysisViewFields = {
  competitor: CompetitorAnalysis;
  suggestedPrice: Money;
  priceText: string;
};

/** Price section UX — never show fake ₺0 / Low while pending or failed. */
export type PriceAnalysisUiStatus = "loading" | "ready" | "unavailable";
