import type {
  CompetitorAnalysis,
  Money,
  PriceAnalysisViewFields,
  StatDescriptor,
} from "./priceTypes";

/**
 * Price business logic — ported 1:1 from SnapSell Mobile
 * (`src/services/result/resultService.ts` + `priceAnalysisCache.ts`).
 * UI-free so the desktop UI consumes identical values.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
};

/** Currency-aware price string. Identical to mobile `formatMoney`. */
export const formatMoney = ({ amount, currency }: Money): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Real-data only: surface the average price from the API. Do not invent
 * competition / demand / difficulty levels. Identical to mobile `buildStats`.
 */
export const buildStats = (analysis: CompetitorAnalysis): StatDescriptor[] => {
  if (!(analysis.averagePrice.amount > 0)) {
    return [];
  }
  return [
    {
      key: "averagePrice",
      label: "Average Price",
      value: formatMoney(analysis.averagePrice),
      tone: "neutral",
    },
  ];
};

/** True when a mapped analysis carries a real average / suggestion / narrative. */
export const hasUsablePersistedPrice = (
  fields: PriceAnalysisViewFields,
): boolean =>
  fields.competitor.averagePrice.amount > 0 ||
  fields.suggestedPrice.amount > 0 ||
  Boolean((fields.priceText || "").trim());
