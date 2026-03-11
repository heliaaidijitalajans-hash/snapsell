/**
 * Market price stats: median, average, min, max; recommended_sale_price = average * 0.95.
 * @module product-price-analysis/market-stats
 */

/**
 * Median of an array of numbers.
 * @param {number[]} values
 * @returns {number}
 */
export function median(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Average of an array of numbers.
 * @param {number[]} values
 * @returns {number}
 */
export function average(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Min and max of an array.
 * @param {number[]} values
 * @returns {{ min: number, max: number }}
 */
export function minMax(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: 0, max: 0 };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100
  };
}

/**
 * Recommended sale price = average_price * 0.95 (sell faster than competitors).
 * @param {number} averagePrice
 * @param {number} [factor=0.95]
 * @returns {number}
 */
export function recommendedSalePrice(averagePrice, factor = 0.95) {
  if (typeof averagePrice !== "number" || Number.isNaN(averagePrice)) return 0;
  return Math.round(averagePrice * factor * 100) / 100;
}

/**
 * Recommended sale price from median: median_price * 0.95 (for cluster-based pipeline).
 * @param {number} medianPrice
 * @param {number} [factor=0.95]
 * @returns {number}
 */
export function recommendedSalePriceFromMedian(medianPrice, factor = 0.95) {
  if (typeof medianPrice !== "number" || Number.isNaN(medianPrice)) return 0;
  return Math.round(medianPrice * factor * 100) / 100;
}

/**
 * Groups sorted prices by proximity; gap larger than gapFactor * median starts a new cluster.
 * Returns the cluster with LOWEST median (ana pazar = genelde en düşük tutarlı küme; pahalı sapmaları atar).
 * En az 2 elemanlı kümeler arasından seçer. Örnek: [199,210,249,279,2990] → [199,210,249,279].
 * @param {number[]} prices
 * @param {number} [gapFactor=0.5] - max allowed gap = gapFactor * median(all prices)
 * @returns {number[]}
 */
export function getLargestPriceCluster(prices, gapFactor = 0.5) {
  if (!Array.isArray(prices) || prices.length === 0) return [];
  const sorted = [...prices].filter((p) => typeof p === "number" && !Number.isNaN(p) && p > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const globalMedian = median(sorted);
  const maxGap = Math.max(globalMedian * gapFactor, 1);

  const clusters = [];
  let current = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > maxGap) {
      clusters.push(current);
      current = [sorted[i]];
    } else {
      current.push(sorted[i]);
    }
  }
  clusters.push(current);

  // En düşük medyanlı küme = ana pazar (pahalı sapma kümesini seçmemek için)
  const withEnough = clusters.filter((c) => c.length >= 2);
  const candidates = withEnough.length > 0 ? withEnough : clusters;
  let best = candidates[0];
  for (const c of candidates) {
    if (median(c) < median(best)) best = c;
  }
  return best;
}

/**
 * Builds market_analysis and recommended_sale_price from cleaned prices.
 * @param {number[]} cleanedPrices
 * @returns {{ market_analysis: import("./types.js").MarketAnalysis, recommended_sale_price: number }}
 */
export function computeMarketAnalysis(cleanedPrices) {
  const prices = Array.isArray(cleanedPrices) && cleanedPrices.length > 0
    ? cleanedPrices
    : [];

  const median_price = median(prices);
  const average_price = average(prices);
  const { min, max } = minMax(prices);

  const market_analysis = {
    average_price,
    median_price,
    price_range: { min, max }
  };

  const recommended_sale_price = recommendedSalePrice(average_price, 0.95);

  return { market_analysis, recommended_sale_price };
}

/**
 * Uses price clustering: keeps largest cluster only, then median/average/min/max and recommended = median * 0.95.
 * @param {number[]} prices
 * @param {number} [gapFactor=0.5]
 * @returns {{ market_analysis: import("./types.js").MarketAnalysis, recommended_sale_price: number, cluster: number[] }}
 */
export function computeMarketAnalysisWithClustering(prices, gapFactor = 0.5) {
  const cluster = getLargestPriceCluster(Array.isArray(prices) ? prices : [], gapFactor);
  if (cluster.length === 0) {
    return {
      market_analysis: {
        average_price: 0,
        median_price: 0,
        price_range: { min: 0, max: 0 }
      },
      recommended_sale_price: 0,
      cluster: []
    };
  }
  const median_price = median(cluster);
  const average_price = average(cluster);
  const { min, max } = minMax(cluster);
  const market_analysis = {
    average_price,
    median_price,
    price_range: { min, max }
  };
  const recommended_sale_price = recommendedSalePriceFromMedian(median_price, 0.95);
  return { market_analysis, recommended_sale_price, cluster };
}
