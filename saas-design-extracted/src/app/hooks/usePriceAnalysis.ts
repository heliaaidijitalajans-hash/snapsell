import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  analyzePriceOnce,
  priceAnalysisRequestKey,
} from "../services/price/priceAnalysisRequest";
import { buildStats, formatMoney } from "../services/price/resultService";
import type {
  PriceAnalysisUiStatus,
  PriceAnalysisViewFields,
  StatDescriptor,
} from "../services/price/priceTypes";
import { savePriceAnalysisToLibrary } from "../lib/libraryImages";

type UsePriceAnalysisInput = {
  /** Stable id for this generation/result (dedupes duplicate requests). */
  id: string;
  productName: string;
  description: string;
  language: string;
  /** Only fetch once a result exists (mirrors mobile Result screen). */
  enabled: boolean;
  /** Localized stat label for the average price row. */
  averageLabel: string;
  /**
   * When set (e.g. restored library session), use this and never call the API.
   */
  cachedPriceAnalysis?: PriceAnalysisViewFields | null;
  /**
   * Library row id — after the first successful analysis, persist so history reopen skips API.
   */
  libraryImageId?: string | null;
  /** When true, never call /api/price-analysis (history restore). */
  disableFetch?: boolean;
};

type UsePriceAnalysisResult = {
  priceStatus: PriceAnalysisUiStatus;
  stats: StatDescriptor[];
  formattedPrice: string;
  canRetryPriceAnalysis: boolean;
  retryPriceAnalysis: () => void;
};

/**
 * Website port of the SnapSell Mobile price section of `useResult`.
 * Loads price analysis independently, never showing fake ₺0 while pending or
 * failed, and exposes the same loading / ready / unavailable states + retry.
 */
export const usePriceAnalysis = ({
  id,
  productName,
  description,
  language,
  enabled,
  averageLabel,
  cachedPriceAnalysis = null,
  libraryImageId = null,
  disableFetch = false,
}: UsePriceAnalysisInput): UsePriceAnalysisResult => {
  const [priceOverlay, setPriceOverlay] =
    useState<PriceAnalysisViewFields | null>(cachedPriceAnalysis ?? null);
  const [priceStatus, setPriceStatus] =
    useState<PriceAnalysisUiStatus>(cachedPriceAnalysis ? "ready" : "loading");
  const [retryToken, setRetryToken] = useState(0);
  const priceOverlayRef = useRef<PriceAnalysisViewFields | null>(null);
  priceOverlayRef.current = priceOverlay;
  const persistedRef = useRef(false);

  useEffect(() => {
    if (cachedPriceAnalysis) {
      setPriceOverlay(cachedPriceAnalysis);
      setPriceStatus("ready");
      persistedRef.current = true;
    }
  }, [cachedPriceAnalysis]);

  const canRetryPriceAnalysis = !disableFetch && !cachedPriceAnalysis;

  const retryPriceAnalysis = useCallback(() => {
    if (disableFetch || cachedPriceAnalysis) return;
    setRetryToken((token) => token + 1);
  }, [disableFetch, cachedPriceAnalysis]);

  const trimmedProductName = productName.trim();
  const trimmedDescription = description.trim();

  useEffect(() => {
    let cancelled = false;

    const markUnavailable = () => {
      if (cancelled) return;
      setPriceStatus(priceOverlayRef.current ? "ready" : "unavailable");
    };

    void (async () => {
      if (cachedPriceAnalysis || disableFetch) {
        if (cachedPriceAnalysis) {
          setPriceOverlay(cachedPriceAnalysis);
          setPriceStatus("ready");
        } else if (!priceOverlayRef.current) {
          setPriceStatus("unavailable");
        }
        return;
      }

      if (!enabled) {
        return;
      }

      const productName = trimmedProductName;
      const description = trimmedDescription;
      if (!productName && !description) {
        markUnavailable();
        return;
      }

      const forceRefresh = retryToken > 0;
      const requestLanguage = language || "tr";
      const requestKey = priceAnalysisRequestKey({
        id,
        productName: productName || description.slice(0, 120),
        description,
        language: requestLanguage,
      });

      setPriceStatus("loading");

      const mapped = await analyzePriceOnce(
        requestKey,
        {
          productName: productName || description.slice(0, 120),
          description,
          language: requestLanguage,
        },
        { forceRefresh },
      );

      if (cancelled) return;

      if (!mapped) {
        markUnavailable();
        return;
      }

      setPriceOverlay(mapped);
      setPriceStatus("ready");

      if (libraryImageId && !persistedRef.current) {
        persistedRef.current = true;
        void savePriceAnalysisToLibrary(libraryImageId, mapped);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    trimmedProductName,
    trimmedDescription,
    language,
    enabled,
    retryToken,
    cachedPriceAnalysis,
    disableFetch,
    libraryImageId,
  ]);

  const showPriceMetrics =
    priceStatus === "ready" ||
    (priceStatus === "loading" && priceOverlay != null);

  const stats = useMemo<StatDescriptor[]>(() => {
    if (!showPriceMetrics || !priceOverlay) {
      return [];
    }
    return buildStats(priceOverlay.competitor).map((stat) =>
      stat.key === "averagePrice" ? { ...stat, label: averageLabel } : stat,
    );
  }, [showPriceMetrics, priceOverlay, averageLabel]);

  const formattedPrice = useMemo(() => {
    if (!showPriceMetrics || !priceOverlay) {
      return "";
    }
    // Prefer real average from API stats; never invent a "suggested" markup.
    if (priceOverlay.competitor.averagePrice.amount > 0) {
      return formatMoney(priceOverlay.competitor.averagePrice);
    }
    if (priceOverlay.suggestedPrice.amount > 0) {
      return formatMoney(priceOverlay.suggestedPrice);
    }
    const narrative = priceOverlay.priceText?.trim();
    if (narrative) {
      const firstLine = narrative.split(/\n+/)[0]?.trim() ?? narrative;
      return firstLine.length > 120
        ? `${firstLine.slice(0, 117)}…`
        : firstLine;
    }
    return "";
  }, [showPriceMetrics, priceOverlay]);

  return {
    priceStatus,
    stats,
    formattedPrice,
    canRetryPriceAnalysis,
    retryPriceAnalysis,
  };
};
