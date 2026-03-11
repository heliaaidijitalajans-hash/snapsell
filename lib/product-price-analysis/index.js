/**
 * Product price analysis pipeline: image → product → search → clean → market stats → output.
 * @module product-price-analysis
 */

import { analyzeProductImage } from "./image-analysis.js";
import { buildSearchQuery } from "./search-query.js";
import { searchPrices } from "./price-search.js";
import { cleanPrices, filterListingsByCleanedPrices, toNumericPrices } from "./price-cleaning.js";
import { computeMarketAnalysis } from "./market-stats.js";

export { analyzeProductImage } from "./image-analysis.js";
export { buildSearchQuery } from "./search-query.js";
export { searchPrices } from "./price-search.js";
export { cleanPrices, removeDuplicatePrices, removePriceOutliers, toNumericPrices, filterListingsByCleanedPrices } from "./price-cleaning.js";
export { median, average, minMax, recommendedSalePrice, computeMarketAnalysis } from "./market-stats.js";
export { ALLOWED_PLATFORMS, ALLOWED_DOMAINS } from "./types.js";

/**
 * Runs the full pipeline and returns the final output shape.
 * @param {string} imageUrl - Data URL or URL of the product image
 * @param {Object} [options]
 * @param {string} [options.userHint] - Optional text hint
 * @param {string} [options.gl="us"] - SerpAPI country (us, tr)
 * @param {number} [options.outlierTolerance=0.5] - Remove prices outside ± this fraction of median (0.5 = 50%)
 * @returns {Promise<import("./types.js").AnalysisResult>}
 */
export async function runProductPriceAnalysis(imageUrl, options = {}) {
  const { userHint = "", gl = "us", outlierTolerance = 0.5 } = options;

  const product = await analyzeProductImage(imageUrl, userHint);
  const query = buildSearchQuery(product);
  const listings = await searchPrices(query, { gl, num: 40 });

  const cleanedPrices = cleanPrices(listings, outlierTolerance);
  const filteredListings = filterListingsByCleanedPrices(listings, cleanedPrices);

  const pricesForStats = cleanedPrices.length > 0 ? cleanedPrices : toNumericPrices(listings);
  const { market_analysis, recommended_sale_price } = computeMarketAnalysis(pricesForStats);

  return {
    product,
    market_analysis,
    recommended_sale_price,
    listings: filteredListings.length > 0 ? filteredListings : listings.slice(0, 50)
  };
}

/**
 * Runs analysis when no image is available; uses text as product_type for query.
 * @param {string} searchText - e.g. "Nike Air Force 1 white sneakers"
 * @param {Object} [options]
 * @param {string} [options.gl="us"]
 * @param {number} [options.outlierTolerance=0.5]
 * @returns {Promise<import("./types.js").AnalysisResult>}
 */
export async function runProductPriceAnalysisFromText(searchText, options = {}) {
  const { gl = "us", outlierTolerance = 0.5 } = options;

  const product = {
    brand: "",
    model: "",
    product_type: String(searchText || "").trim().slice(0, 200),
    color: "",
    category: ""
  };

  const query = buildSearchQuery(product);
  const listings = await searchPrices(query, { gl, num: 40 });

  const cleanedPrices = cleanPrices(listings, outlierTolerance);
  const filteredListings = filterListingsByCleanedPrices(listings, cleanedPrices);

  const pricesForStats = cleanedPrices.length > 0 ? cleanedPrices : toNumericPrices(listings);
  const { market_analysis, recommended_sale_price } = computeMarketAnalysis(pricesForStats);

  return {
    product,
    market_analysis,
    recommended_sale_price,
    listings: filteredListings.length > 0 ? filteredListings : listings.slice(0, 50)
  };
}
