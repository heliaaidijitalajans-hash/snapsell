/**
 * Price statistics: median, average (after outlier removal), min, max, formatted price_range.
 * @module price-pipeline/price-stats
 */

import { DEFAULT_CURRENCY } from "./types.js";

/**
 * Computes median of an array of numbers.
 * @param {number[]} values
 * @returns {number|null}
 */
export function median(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].filter((v) => typeof v === "number" && !Number.isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Computes average of an array of numbers.
 * @param {number[]} values
 * @returns {number|null}
 */
export function average(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

/**
 * Builds price analysis from cleaned listings: median, average, min, max, price_range string.
 * @param {import("./types.js").ShoppingListing[]} listings
 * @param {string} [currency]
 * @returns {import("./types.js").PriceAnalysis}
 */
export function computePriceStats(listings, currency = DEFAULT_CURRENCY) {
  const values = (listings || [])
    .map((l) => l.price)
    .filter((p) => p != null && typeof p === "number" && p > 0);

  const fmt = (n) => {
    if (n == null || Number.isNaN(n)) return "";
    const rounded = Math.round(n * 100) / 100;
    return currency === "TRY"
      ? rounded.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency + " ";

  if (values.length === 0) {
    return {
      median_price: "",
      average_price: "",
      price_range: "",
      median_value: undefined,
      average_value: undefined,
      min_value: undefined,
      max_value: undefined,
      currency
    };
  }

  const medianValue = median(values);
  const averageValue = average(values);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const medianStr = medianValue != null ? symbol + fmt(medianValue) : "";
  const averageStr = averageValue != null ? symbol + fmt(averageValue) : "";
  const priceRangeStr =
    minValue != null && maxValue != null
      ? `${symbol}${fmt(minValue)} – ${symbol}${fmt(maxValue)}`
      : "";

  return {
    median_price: medianStr,
    average_price: averageStr,
    price_range: priceRangeStr,
    median_value: medianValue ?? undefined,
    average_value: averageValue ?? undefined,
    min_value: minValue,
    max_value: maxValue,
    currency
  };
}
