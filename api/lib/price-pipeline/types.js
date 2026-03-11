/**
 * Shared types and constants for the price analysis pipeline.
 * @module price-pipeline/types
 */

/**
 * @typedef {Object} ProductIdentification
 * @property {string} brand
 * @property {string} model
 * @property {string} product_type
 * @property {string} color
 * @property {string} material
 * @property {string} condition
 */

/**
 * @typedef {Object} ShoppingListing
 * @property {string} title
 * @property {number|null} price
 * @property {string} store
 * @property {string} link
 * @property {string} [priceDisplay]
 */

/**
 * @typedef {Object} PriceAnalysis
 * @property {string} median_price
 * @property {string} average_price
 * @property {string} price_range
 * @property {number} [median_value]
 * @property {number} [average_value]
 * @property {number} [min_value]
 * @property {number} [max_value]
 * @property {string} [currency]
 */

/**
 * @typedef {Object} PricePipelineResult
 * @property {ProductIdentification} product_identification
 * @property {PriceAnalysis} price_analysis
 * @property {ShoppingListing[]} sources
 */

/** Default product identification when vision returns empty fields */
export const DEFAULT_IDENTIFICATION = {
  brand: "",
  model: "",
  product_type: "",
  color: "",
  material: "",
  condition: ""
};

/** Currency used for formatting (e.g. from SerpAPI gl=tr) */
export const DEFAULT_CURRENCY = "TRY";

/** Outlier filter: keep prices within ± this fraction of median (0.5 = 50%) */
export const OUTLIER_MEDIAN_TOLERANCE = 0.5;
