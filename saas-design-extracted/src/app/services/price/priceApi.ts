import { getApiBase } from "../../config";
import type { PriceAnalysisRequest, PriceAnalysisResponse } from "./priceTypes";

/**
 * Independent price analysis — not part of PhotoRoom / process pipeline.
 * Method: POST /api/price-analysis (identical endpoint + payload to SnapSell Mobile).
 */

/** Same relative path registered in the live Express server (`server.js`). */
const PRICE_ANALYSIS_PATH = "/api/price-analysis";

/** Longer timeout for AI pipelines — mirrors mobile `AI_TIMEOUT_MS`. */
export const AI_TIMEOUT_MS = 120_000;

export const priceApi = {
  analyze: async (
    payload: PriceAnalysisRequest,
  ): Promise<PriceAnalysisResponse> => {
    const base = getApiBase().replace(/\/$/, "");
    const url = base ? `${base}${PRICE_ANALYSIS_PATH}` : PRICE_ANALYSIS_PATH;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      AI_TIMEOUT_MS,
    );
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as
        | PriceAnalysisResponse
        | { error?: string; code?: string }
        | null;
      if (!res.ok || !data) {
        const message =
          (data && "error" in data && data.error) ||
          `Request failed with status ${res.status}`;
        throw new Error(String(message));
      }
      return data as PriceAnalysisResponse;
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
};
