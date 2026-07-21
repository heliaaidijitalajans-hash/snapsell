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
}: UsePriceAnalysisInput): UsePriceAnalysisResult => {
  const [priceOverlay, setPriceOverlay] =
    useState<PriceAnalysisViewFields | null>(null);
  const [priceStatus, setPriceStatus] =
    useState<PriceAnalysisUiStatus>("loading");
  const [retryToken, setRetryToken] = useState(0);
  const priceOverlayRef = useRef<PriceAnalysisViewFields | null>(null);
  priceOverlayRef.current = priceOverlay;

  const canRetryPriceAnalysis = true;

  const retryPriceAnalysis = useCallback(() => {
    setRetryToken((token) => token + 1);
  }, []);

  const trimmedProductName = productName.trim();
  const trimmedDescription = description.trim();

  useEffect(() => {
    let cancelled = false;

    const markUnavailable = () => {
      if (cancelled) return;
      setPriceStatus(priceOverlayRef.current ? "ready" : "unavailable");
    };

    void (async () => {
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
