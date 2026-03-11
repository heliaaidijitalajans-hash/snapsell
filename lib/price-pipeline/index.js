/**
 * Product price analysis pipeline: image → structured identification → search → clean → stats.
 * Optimized for accurate price estimation from product images.
 * @module price-pipeline
 */

import { extractProductFromImage } from "./image-analysis.js";
import { buildSearchQuery } from "./search-query.js";
import { fetchGoogleShopping } from "./serp-shopping.js";
import { cleanListings } from "./cleaning.js";
import { computePriceStats } from "./price-stats.js";
import { DEFAULT_IDENTIFICATION, DEFAULT_CURRENCY } from "./types.js";

export { extractProductFromImage } from "./image-analysis.js";
export { buildSearchQuery } from "./search-query.js";
export { fetchGoogleShopping } from "./serp-shopping.js";
export { cleanListings, removeDuplicates, removePriceOutliers, filterByProductMatch } from "./cleaning.js";
export { computePriceStats, median, average } from "./price-stats.js";
export { DEFAULT_IDENTIFICATION, OUTLIER_MEDIAN_TOLERANCE, DEFAULT_CURRENCY } from "./types.js";

/**
 * Runs the full pipeline: image analysis → search query → Google Shopping → clean → stats.
 * @param {string} imageUrl - Data URL or URL of the product image
 * @param {Object} [options]
 * @param {string} [options.userHint] - Optional user text (e.g. "women's leather jacket")
 * @param {string} [options.gl="tr"] - SerpAPI country
 * @param {string} [options.hl="tr"] - SerpAPI language
 * @param {number} [options.outlierTolerance=0.5] - ± fraction of median for outlier removal (0.5 = 50%)
 * @returns {Promise<import("./types.js").PricePipelineResult>}
 */
export async function runPricePipeline(imageUrl, options = {}) {
  const {
    userHint = "",
    gl = "tr",
    hl = "tr",
    outlierTolerance = 0.5
  } = options;

  const product_identification = await extractProductFromImage(imageUrl, userHint);
  const query = buildSearchQuery(product_identification);
  const rawListings = await fetchGoogleShopping(query, { gl, hl, num: 30 });
  const cleaned = cleanListings(rawListings, product_identification, outlierTolerance);
  const sources = cleaned.length > 0 ? cleaned : rawListings.slice(0, 20);
  const currency = gl === "tr" ? "TRY" : gl === "us" ? "USD" : DEFAULT_CURRENCY;
  const price_analysis = computePriceStats(sources, currency);

  return {
    product_identification,
    price_analysis,
    sources
  };
}

/**
 * Runs the pipeline when no image is available: uses user text as product_type for identification,
 * then builds query and fetches/cleans/stats as usual.
 * @param {string} productDescription - Text description (e.g. "Nike Air Max white")
 * @param {Object} [options]
 * @param {string} [options.gl="tr"]
 * @param {string} [options.hl="tr"]
 * @param {number} [options.outlierTolerance=0.5]
 * @returns {Promise<import("./types.js").PricePipelineResult>}
 */
export async function runPricePipelineFromText(productDescription, options = {}) {
  const {
    gl = "tr",
    hl = "tr",
    outlierTolerance = 0.5
  } = options;

  const text = (productDescription && String(productDescription).trim()) || "";
  const product_identification = {
    ...DEFAULT_IDENTIFICATION,
    product_type: text.slice(0, 200)
  };
  const query = buildSearchQuery(product_identification);
  const rawListings = await fetchGoogleShopping(query, { gl, hl, num: 30 });
  const cleaned = cleanListings(rawListings, product_identification, outlierTolerance);
  const sources = cleaned.length > 0 ? cleaned : rawListings.slice(0, 20);
  const currency = gl === "tr" ? "TRY" : gl === "us" ? "USD" : DEFAULT_CURRENCY;
  const price_analysis = computePriceStats(sources, currency);

  return {
    product_identification,
    price_analysis,
    sources
  };
}
