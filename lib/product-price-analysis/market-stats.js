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
