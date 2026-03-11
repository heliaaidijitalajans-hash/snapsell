/**
 * Data cleaning: deduplicate, remove outliers (±50% of median), filter by product match.
 * @module price-pipeline/cleaning
 */

import { OUTLIER_MEDIAN_TOLERANCE } from "./types.js";

/**
 * Removes duplicate listings by (title + price + store). Keeps first occurrence.
 * @param {import("./types.js").ShoppingListing[]} listings
 * @returns {import("./types.js").ShoppingListing[]}
 */
export function removeDuplicates(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const item of listings) {
    const key = `${(item.title || "").toLowerCase()}|${item.price ?? ""}|${(item.store || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Filters out prices outside ±tolerance of the median (e.g. ±50%).
 * @param {import("./types.js").ShoppingListing[]} listings
 * @param {number} [tolerance=0.5] - Fraction of median (0.5 = 50%)
 * @returns {import("./types.js").ShoppingListing[]}
 */
export function removePriceOutliers(listings, tolerance = OUTLIER_MEDIAN_TOLERANCE) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const withPrice = listings.filter((l) => l.price != null && l.price > 0);
  if (withPrice.length === 0) return [];

  const prices = withPrice.map((l) => l.price);
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  const low = median * (1 - tolerance);
  const high = median * (1 + tolerance);

  return withPrice.filter((l) => l.price >= low && l.price <= high);
}

/**
 * Filters listings that don't match the product (title doesn't contain key terms).
 * If identification has no product_type, returns all listings.
 * @param {import("./types.js").ShoppingListing[]} listings
 * @param {import("./types.js").ProductIdentification} [identification]
 * @returns {import("./types.js").ShoppingListing[]}
 */
export function filterByProductMatch(listings, identification) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  if (!identification) return listings;

  const terms = [
    identification.product_type,
    identification.brand,
    identification.model
  ]
    .filter((t) => t && String(t).trim())
    .map((t) => String(t).trim().toLowerCase());

  if (terms.length === 0) return listings;

  const titleLower = (t) => (t && String(t).toLowerCase()) || "";
  return listings.filter((item) => {
    const title = titleLower(item.title);
    return terms.some((term) => term && title.includes(term));
  });
}

/**
 * Applies all cleaning steps: dedup → product match → outlier removal.
 * Order: dedup first, then product match (so we don't drop too many before outlier step).
 * @param {import("./types.js").ShoppingListing[]} listings
 * @param {import("./types.js").ProductIdentification} [identification]
 * @param {number} [outlierTolerance]
 * @returns {import("./types.js").ShoppingListing[]}
 */
export function cleanListings(listings, identification, outlierTolerance = OUTLIER_MEDIAN_TOLERANCE) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  let step = removeDuplicates(listings);
  step = filterByProductMatch(step, identification);
  if (step.length === 0) step = removeDuplicates(listings);
  step = removePriceOutliers(step, outlierTolerance);
  return step;
}
