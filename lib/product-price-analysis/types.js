/**
 * Types for the product price analysis system.
 * @module product-price-analysis/types
 */

/**
 * @typedef {Object} Product
 * @property {string} brand
 * @property {string} model
 * @property {string} product_type
 * @property {string} color
 * @property {string} category
 */

/**
 * @typedef {Object} Listing
 * @property {string} title
 * @property {number} price
 * @property {string} platform
 * @property {string} url
 */

/**
 * @typedef {Object} PriceRange
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {Object} MarketAnalysis
 * @property {number} average_price
 * @property {number} median_price
 * @property {PriceRange} price_range
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {Product} product
 * @property {MarketAnalysis} market_analysis
 * @property {number} recommended_sale_price
 * @property {Listing[]} listings
 */

/** Allowed e-commerce domains (hostname) → display name */
export const ALLOWED_PLATFORMS = Object.freeze({
  "amazon.com": "Amazon",
  "www.amazon.com": "Amazon",
  "amazon.com.tr": "Amazon Turkey",
  "www.amazon.com.tr": "Amazon Turkey",
  "etsy.com": "Etsy",
  "www.etsy.com": "Etsy",
  "trendyol.com": "Trendyol",
  "www.trendyol.com": "Trendyol",
  "hepsiburada.com": "Hepsiburada",
  "www.hepsiburada.com": "Hepsiburada",
  "n11.com": "N11",
  "www.n11.com": "N11",
  "ciceksepeti.com": "Ciceksepeti",
  "www.ciceksepeti.com": "Ciceksepeti",
  "tiktok.com": "TikTok Shop",
  "www.tiktok.com": "TikTok Shop",
  "shop.tiktok.com": "TikTok Shop",
  "temu.com": "Temu",
  "www.temu.com": "Temu"
});

/** Base domain names for allow-list (without www) */
export const ALLOWED_DOMAINS = Object.freeze([
  "amazon.com",
  "amazon.com.tr",
  "etsy.com",
  "trendyol.com",
  "hepsiburada.com",
  "n11.com",
  "ciceksepeti.com",
  "tiktok.com",
  "temu.com"
]);

/** Fixed table order and default currency per platform (for UI table) */
export const TABLE_PLATFORMS = Object.freeze([
  { name: "Amazon", currency: "USD" },
  { name: "Amazon Turkey", currency: "TRY" },
  { name: "Etsy", currency: "USD" },
  { name: "Trendyol", currency: "TRY" },
  { name: "Hepsiburada", currency: "TRY" },
  { name: "N11", currency: "TRY" },
  { name: "Ciceksepeti", currency: "TRY" },
  { name: "TikTok Shop", currency: "TRY" },
  { name: "Temu", currency: "USD" }
]);
