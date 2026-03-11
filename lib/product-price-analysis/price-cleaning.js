/**
 * Price cleaning: numeric array, remove duplicates, nulls, and outliers (±50% of median).
 * @module product-price-analysis/price-cleaning
 */

/**
 * Extracts numeric prices from listings. Drops null/undefined and non-positive.
 * @param {import("./types.js").Listing[]} listings
 * @returns {number[]}
 */
export function toNumericPrices(listings) {
  if (!Array.isArray(listings)) return [];
  return listings
    .map((l) => l?.price)
    .filter((p) => typeof p === "number" && !Number.isNaN(p) && p > 0);
}

/**
 * Removes duplicate numbers (keeps first occurrence).
 * @param {number[]} prices
 * @returns {number[]}
 */
export function removeDuplicatePrices(prices) {
  if (!Array.isArray(prices)) return [];
  return [...new Set(prices)];
}

/**
 * Removes duplicate listings by (title, price, platform). Keeps first occurrence.
 * @param {import("./types.js").Listing[]} listings
 * @returns {import("./types.js").Listing[]}
 */
export function removeDuplicateListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const seen = new Set();
  return listings.filter((l) => {
    const key = `${String(l?.title ?? "")}|${l?.price ?? ""}|${String(l?.platform ?? l?.source ?? "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Computes median of a sorted array.
 * @param {number[]} sorted
 * @returns {number}
 */
function medianSorted(sorted) {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Removes prices that are more than 50% above or below the median.
 * @param {number[]} prices
 * @param {number} [tolerance=0.5] - 0.5 = 50%
 * @returns {number[]}
 */
export function removePriceOutliers(prices, tolerance = 0.5) {
  if (!Array.isArray(prices) || prices.length === 0) return [];

  const sorted = [...prices].sort((a, b) => a - b);
  const median = medianSorted(sorted);
  const low = median * (1 - tolerance);
  const high = median * (1 + tolerance);

  return sorted.filter((p) => p >= low && p <= high);
}

/**
 * Full cleaning: numeric prices → dedup → remove outliers (±50% median).
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [tolerance=0.5]
 * @returns {number[]}
 */
export function cleanPrices(listings, tolerance = 0.5) {
  let prices = toNumericPrices(listings);
  prices = removeDuplicatePrices(prices);
  prices = removePriceOutliers(prices, tolerance);
  return prices;
}

/**
 * Filters listings to only those whose price is within the cleaned set (after outlier removal).
 * Keeps listing shape for output.
 * @param {import("./types.js").Listing[]} listings
 * @param {number[]} allowedPrices - Prices that passed cleaning (optional; if not provided, cleaning is applied)
 * @returns {import("./types.js").Listing[]}
 */
export function filterListingsByCleanedPrices(listings, allowedPrices) {
  if (!Array.isArray(listings)) return [];
  const set = new Set(allowedPrices);
  return listings.filter((l) => l?.price != null && set.has(l.price));
}

/**
 * Global median of listing prices (for robust filtering).
 * @param {import("./types.js").Listing[]} listings
 * @returns {number}
 */
function globalMedian(listings) {
  const prices = toNumericPrices(listings).sort((a, b) => a - b);
  if (prices.length === 0) return 0;
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 === 1 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
}

/**
 * Removes listings whose price is far from the global median (e.g. 200 TL product vs 3000 TL noise).
 * Keeps prices in [median * lowFactor, median * highFactor]. Default 0.25–2.5 so 200 TL → keep 50–500.
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [lowFactor=0.25] - min price = median * lowFactor
 * @param {number} [highFactor=2.5] - max price = median * highFactor
 * @returns {import("./types.js").Listing[]}
 */
export function filterListingsByGlobalMedian(listings, lowFactor = 0.25, highFactor = 2.5) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const median = globalMedian(listings);
  if (median <= 0) return listings;
  const low = median * lowFactor;
  const high = median * highFactor;
  return listings.filter((l) => {
    const p = l?.price;
    return typeof p === "number" && p >= low && p <= high;
  });
}

/**
 * Strong price outlier filter: keep only listings in [median * lowFactor, median * highFactor].
 * Default 0.5 and 1.8 so 200 TL median → keep 100–360 TL.
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [lowFactor=0.5]
 * @param {number} [highFactor=1.8]
 * @returns {import("./types.js").Listing[]}
 */
export function applyStrongOutlierFilter(listings, lowFactor = 0.5, highFactor = 1.8) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const median = globalMedian(listings);
  if (median <= 0) return listings;
  const low = median * lowFactor;
  const high = median * highFactor;
  return listings.filter((l) => {
    const p = l?.price;
    return typeof p === "number" && p >= low && p <= high;
  });
}
