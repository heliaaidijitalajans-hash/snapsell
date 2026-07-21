import { priceApi } from "./priceApi";
import type { PriceAnalysisResponse, PriceAnalysisViewFields } from "./priceTypes";
import { mapPriceAnalysisToResultFields } from "./mapPriceAnalysis";
import { hasUsablePersistedPrice } from "./resultService";

/**
 * Single-flight price analyzer — ported 1:1 from SnapSell Mobile
 * (`src/services/result/priceAnalysisRequest.ts`).
 *
 * In-flight / completed guards so React Strict Mode remounts and i18n
 * hydration cannot fire duplicate POST /api/price-analysis for the same item.
 */
const inflight = new Map<string, Promise<PriceAnalysisViewFields | null>>();
const completed = new Map<string, PriceAnalysisViewFields>();

export const priceAnalysisRequestKey = (input: {
  id: string;
  productName: string;
  description: string;
  language: string;
}): string =>
  [
    input.id.trim(),
    input.productName.trim().toLowerCase(),
    input.description.trim().slice(0, 240).toLowerCase(),
    (input.language || "tr").trim().toLowerCase(),
  ].join("|");

export const clearPriceAnalysisRequestState = (): void => {
  inflight.clear();
  completed.clear();
};

/**
 * Concurrent callers with the same key share one HTTP request; successful
 * results are remembered so remounts skip the network.
 */
export const analyzePriceOnce = (
  key: string,
  payload: {
    productName: string;
    description: string;
    language: string;
  },
  options?: { forceRefresh?: boolean },
): Promise<PriceAnalysisViewFields | null> => {
  if (options?.forceRefresh) {
    completed.delete(key);
  } else {
    const remembered = completed.get(key);
    if (remembered) {
      return Promise.resolve(remembered);
    }
    const existing = inflight.get(key);
    if (existing) {
      return existing;
    }
  }

  const request = (async (): Promise<PriceAnalysisViewFields | null> => {
    try {
      const response: PriceAnalysisResponse = await priceApi.analyze({
        productName: payload.productName,
        description: payload.description,
        language: payload.language || "tr",
      });
      const mapped = mapPriceAnalysisToResultFields(response);
      if (!hasUsablePersistedPrice(mapped)) {
        return null;
      }
      completed.set(key, mapped);
      return mapped;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
};
