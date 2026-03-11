/**
 * Builds the fixed 9-platform table with min, average, max per platform from listings.
 * Per-platform cleaning: filter each platform's prices by 0.5–2× median before merging.
 * @module product-price-analysis/platform-table
 */

import { TABLE_PLATFORMS } from "./types.js";
import { removeDuplicatePrices, removePriceOutliers } from "./price-cleaning.js";
import { applyStrongOutlierFilter } from "./price-cleaning.js";
import { average, median, minMax } from "./market-stats.js";

/**
 * @typedef {Object} PlatformRow
 * @property {string} name
 * @property {string} currency
 * @property {number|null} minPrice
 * @property {number|null} avgPrice
 * @property {number|null} maxPrice
 */

/**
 * Groups listings by platform and computes min/avg/max per platform (with outlier removal).
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [outlierTolerance=0.5]
 * @returns {Record<string, { minPrice: number, avgPrice: number, maxPrice: number }>}
 */
function statsByPlatform(listings, outlierTolerance = 0.5) {
  const byPlatform = /** @type {Record<string, number[]>} */ ({});

  for (const row of listings || []) {
    const platform = row?.platform && String(row.platform).trim();
    const price = row?.price;
    if (!platform || typeof price !== "number" || Number.isNaN(price) || price <= 0) continue;
    if (!byPlatform[platform]) byPlatform[platform] = [];
    byPlatform[platform].push(price);
  }

  const result = /** @type {Record<string, { minPrice: number, avgPrice: number, maxPrice: number }>} */ ({});

  for (const [platform, prices] of Object.entries(byPlatform)) {
    let cleaned = removeDuplicatePrices(prices);
    cleaned = removePriceOutliers(cleaned, outlierTolerance);
    if (cleaned.length === 0) continue;

    const min = Math.min(...cleaned);
    const max = Math.max(...cleaned);
    const avg = average(cleaned);

    result[platform] = {
      minPrice: Math.round(min * 100) / 100,
      avgPrice: Math.round(avg * 100) / 100,
      maxPrice: Math.round(max * 100) / 100
    };
  }

  return result;
}

/**
 * Builds the fixed platform table for UI: 9 rows (Amazon, Amazon Turkey, Etsy, ... TikTok Shop, Temu).
 * Platforms with no data get null min/avg/max.
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [outlierTolerance=0.5]
 * @returns {PlatformRow[]}
 */
export function buildPlatformTable(listings, outlierTolerance = 0.5) {
  const stats = statsByPlatform(listings, outlierTolerance);

  return TABLE_PLATFORMS.map(({ name, currency }) => {
    const s = stats[name];
    return {
      name,
      currency,
      minPrice: s ? s.minPrice : null,
      avgPrice: s ? s.avgPrice : null,
      maxPrice: s ? s.maxPrice : null
    };
  });
}

/**
 * Tek satır "Genel Arama" sonucu: tüm ilanlardan min/ortalama/max (mağaza isimleri yok).
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [outlierTolerance=0.5]
 * @param {string} [currency="TRY"]
 * @returns {PlatformRow[]}
 */
export function buildGeneralSearchTable(listings, outlierTolerance = 0.5, currency = "TRY") {
  const prices = (listings || [])
    .map((l) => l?.price)
    .filter((p) => typeof p === "number" && !Number.isNaN(p) && p > 0);
  if (prices.length === 0) {
    return [{ name: "Genel Arama", currency, minPrice: null, avgPrice: null, maxPrice: null }];
  }
  let cleaned = removeDuplicatePrices(prices);
  cleaned = removePriceOutliers(cleaned, outlierTolerance);
  if (cleaned.length === 0) cleaned = prices;
  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  const avg = average(cleaned);
  return [
    {
      name: "Genel Arama",
      currency,
      minPrice: Math.round(min * 100) / 100,
      avgPrice: Math.round(avg * 100) / 100,
      maxPrice: Math.round(max * 100) / 100
    }
  ];
}

/**
 * Per-platform cleaning then merge: for each platform, remove prices outside [0.5×median, 2×median],
 * compute platform min/avg/max, then merge all cleaned prices for global stats.
 * @param {import("./types.js").Listing[]} listings
 * @param {number} [lowFactor=0.5]
 * @param {number} [highFactor=2]
 * @returns {{ platforms: PlatformRow[], allCleanedPrices: number[], perPlatformCleanedListings: import("./types.js").Listing[] }}
 */
export function buildPlatformTableWithPerPlatformCleaning(listings, lowFactor = 0.5, highFactor = 2) {
  const byPlatform = /** @type {Record<string, import("./types.js").Listing[]>} */ ({});

  for (const row of listings || []) {
    const platform = row?.platform && String(row.platform).trim();
    const price = row?.price;
    if (!platform || typeof price !== "number" || Number.isNaN(price) || price <= 0) continue;
    if (!byPlatform[platform]) byPlatform[platform] = [];
    byPlatform[platform].push(row);
  }

  const platformStats = /** @type {Record<string, { minPrice: number, avgPrice: number, maxPrice: number, median: number }>} */ ({});
  const allCleanedPrices = [];
  const perPlatformCleanedListings = [];

  for (const [platform, platformListings] of Object.entries(byPlatform)) {
    const cleaned = applyStrongOutlierFilter(platformListings, lowFactor, highFactor);
    const prices = cleaned.map((l) => l?.price).filter((p) => typeof p === "number" && !Number.isNaN(p) && p > 0);
    if (prices.length === 0) continue;

    const med = median(prices);
    const avg = average(prices);
    const { min, max } = minMax(prices);
    platformStats[platform] = {
      minPrice: Math.round(min * 100) / 100,
      avgPrice: Math.round(avg * 100) / 100,
      maxPrice: Math.round(max * 100) / 100,
      median: Math.round(med * 100) / 100
    };
    allCleanedPrices.push(...prices);
    perPlatformCleanedListings.push(...cleaned);
  }

  const platforms = TABLE_PLATFORMS.map(({ name, currency }) => {
    const s = platformStats[name];
    return {
      name,
      currency,
      minPrice: s ? s.minPrice : null,
      avgPrice: s ? s.avgPrice : null,
      maxPrice: s ? s.maxPrice : null
    };
  });

  return {
    platforms,
    allCleanedPrices,
    perPlatformCleanedListings
  };
}
