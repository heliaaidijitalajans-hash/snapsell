/**
 * Product price analysis pipeline: image → product → search → clean → market stats → output.
 * @module product-price-analysis
 */

import { analyzeProductImage } from "./image-analysis.js";
import { buildSearchQuery } from "./search-query.js";
import { searchPrices } from "./price-search.js";
import { filterByRelevance } from "./relevance-filter.js";
import { toNumericPrices, applyStrongOutlierFilter, removeDuplicateListings } from "./price-cleaning.js";
import { computeMarketAnalysis, computeMarketAnalysisWithClustering, getLargestPriceCluster } from "./market-stats.js";
import { buildGeneralSearchTable } from "./platform-table.js";
import { fetchGoogleLensListings } from "./google-lens-search.js";
import { validateProductCategory } from "./category-validation.js";

export { analyzeProductImage } from "./image-analysis.js";
export { filterByRelevance, scoreListing, hasRequiredCategoryMatch } from "./relevance-filter.js";
export { buildSearchQuery } from "./search-query.js";
export { searchPrices } from "./price-search.js";
export { cleanPrices, removeDuplicatePrices, removeDuplicateListings, removePriceOutliers, toNumericPrices, filterListingsByCleanedPrices, filterListingsByGlobalMedian, applyStrongOutlierFilter } from "./price-cleaning.js";
export { median, average, minMax, recommendedSalePrice, recommendedSalePriceFromMedian, computeMarketAnalysis, computeMarketAnalysisWithClustering, getLargestPriceCluster } from "./market-stats.js";
export { buildPlatformTable, buildGeneralSearchTable } from "./platform-table.js";
export { ALLOWED_PLATFORMS, ALLOWED_DOMAINS, TABLE_PLATFORMS } from "./types.js";
export { validateProductCategory } from "./category-validation.js";

/**
 * Confidence from accepted listing count: high (5+), medium (3-4), low (<3).
 * @param {number} count
 * @returns {"high"|"medium"|"low"}
 */
function getConfidence(count) {
  if (count >= 5) return "high";
  if (count >= 3) return "medium";
  return "low";
}

/**
 * Cleans Lens listings: remove duplicates, then keep prices in [0.5×median, 2×median].
 * @param {import("./types.js").Listing[]} listings
 * @returns {import("./types.js").Listing[]}
 */
function cleanLensListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const deduped = removeDuplicateListings(listings);
  return applyStrongOutlierFilter(deduped, 0.5, 2);
}

/**
 * Runs price analysis from SerpAPI Google Lens (image similarity). Use when imageUrl is a public URL.
 * @param {string} imageUrl - Public image URL (http/https)
 * @param {Object} [options]
 * @param {string} [options.gl="tr"]
 * @returns {Promise<import("./types.js").AnalysisResult>}
 */
export async function runProductPriceAnalysisFromLens(imageUrl, options = {}) {
  const { gl = "tr" } = options;
  const rawListings = await fetchGoogleLensListings(imageUrl, { gl });
  const accepted_listings = cleanLensListings(rawListings);
  const confidence = getConfidence(accepted_listings.length);

  const pricesForStats = toNumericPrices(accepted_listings);
  const lowConfidence = confidence === "low";
  let market_analysis;
  let recommended_sale_price = null;
  if (!lowConfidence && pricesForStats.length > 0) {
    const computed = computeMarketAnalysis(pricesForStats);
    market_analysis = computed.market_analysis;
    recommended_sale_price = computed.recommended_sale_price;
  } else {
    market_analysis = {
      average_price: null,
      median_price: null,
      price_range: { min: null, max: null }
    };
  }

  const platforms = buildGeneralSearchTable(accepted_listings, 0.5);

  return {
    product: { product_type: "Ürün", brand: "", model: "" },
    confidence,
    market_analysis,
    recommended_sale_price,
    accepted_listings,
    valid_listings: accepted_listings,
    rejected_listings: [],
    platforms
  };
}

/**
 * Runs the full pipeline: relevance filter (similarity >= 0.7) → outlier (0.5–2 × median) → confidence → output.
 * @param {string} imageUrl - Data URL or URL of the product image
 * @param {Object} [options]
 * @param {string} [options.userHint] - Optional text hint
 * @param {string} [options.gl="us"] - SerpAPI country (us, tr)
 * @returns {Promise<import("./types.js").AnalysisResult>}
 */
export async function runProductPriceAnalysis(imageUrl, options = {}) {
  const { userHint = "", gl = "us" } = options;

  const product = await analyzeProductImage(imageUrl, userHint);
  const validation = validateProductCategory(product);
  if (!validation.valid) {
    return {
      error: validation.error,
      message: validation.message,
      product,
      confidence: "low",
      market_analysis: { average_price: null, median_price: null, price_range: { min: null, max: null } },
      recommended_sale_price: null,
      accepted_listings: [],
      valid_listings: [],
      rejected_listings: [],
      platforms: []
    };
  }
  const query = buildSearchQuery(product);
  const rawListings = await searchPrices(query, { gl, num: 60 });

  const { accepted: afterRelevance, rejected: rejectedByRelevance } = filterByRelevance(rawListings, product, 0.7);

  const afterOutlier = applyStrongOutlierFilter(afterRelevance, 0.5, 2);
  const rejectedByOutlier = afterRelevance.filter((l) => !afterOutlier.includes(l));
  const rejected_listings = [
    ...rejectedByRelevance,
    ...rejectedByOutlier.map((l) => ({
      title: String(l?.title ?? "").slice(0, 200),
      price: String(l?.price ?? ""),
      reason: "Price outside valid range (0.5–2 × median)"
    }))
  ];

  const pricesForStats = toNumericPrices(afterOutlier);
  const clusterPrices = getLargestPriceCluster(pricesForStats, 0.5);
  const clusterSet = new Set(clusterPrices);
  const accepted_listings = afterOutlier.filter((l) => typeof l?.price === "number" && clusterSet.has(l.price));
  const confidence = getConfidence(accepted_listings.length);

  const lowConfidence = confidence === "low";
  let market_analysis;
  let recommended_sale_price = null;
  if (!lowConfidence && clusterPrices.length > 0) {
    const computed = computeMarketAnalysisWithClustering(pricesForStats, 0.5);
    market_analysis = computed.market_analysis;
    recommended_sale_price = computed.recommended_sale_price;
  } else if (clusterPrices.length > 0) {
    const computed = computeMarketAnalysisWithClustering(pricesForStats, 0.5);
    market_analysis = computed.market_analysis;
    recommended_sale_price = computed.recommended_sale_price;
  } else {
    market_analysis = {
      average_price: null,
      median_price: null,
      price_range: { min: null, max: null }
    };
  }

  const platforms = buildGeneralSearchTable(accepted_listings, 0.5);

  return {
    product,
    confidence,
    market_analysis,
    recommended_sale_price,
    accepted_listings,
    valid_listings: accepted_listings,
    rejected_listings,
    platforms
  };
}

/**
 * Runs analysis when no image is available; uses text as product_type for query.
 * @param {string} searchText - e.g. "Nike Air Force 1 white sneakers"
 * @param {Object} [options]
 * @param {string} [options.gl="us"]
 * @returns {Promise<import("./types.js").AnalysisResult>}
 */
export async function runProductPriceAnalysisFromText(searchText, options = {}) {
  const { gl = "us" } = options;

  const product = {
    brand: "",
    model: "",
    product_type: String(searchText || "").trim().slice(0, 200),
    color: "",
    category: ""
  };

  const query = buildSearchQuery(product);
  const rawListings = await searchPrices(query, { gl, num: 60 });

  const { accepted: afterRelevance, rejected: rejectedByRelevance } = filterByRelevance(rawListings, product, 0.7);

  const afterOutlier = applyStrongOutlierFilter(afterRelevance, 0.5, 2);
  const rejectedByOutlier = afterRelevance.filter((l) => !afterOutlier.includes(l));
  const rejected_listings = [
    ...rejectedByRelevance,
    ...rejectedByOutlier.map((l) => ({
      title: String(l?.title ?? "").slice(0, 200),
      price: String(l?.price ?? ""),
      reason: "Price outside valid range (0.5–2 × median)"
    }))
  ];

  const pricesForStats = toNumericPrices(afterOutlier);
  const clusterPrices = getLargestPriceCluster(pricesForStats, 0.5);
  const clusterSet = new Set(clusterPrices);
  const accepted_listings = afterOutlier.filter((l) => typeof l?.price === "number" && clusterSet.has(l.price));
  const confidence = getConfidence(accepted_listings.length);

  const lowConfidence = confidence === "low";
  let market_analysis;
  let recommended_sale_price = null;
  if (!lowConfidence && clusterPrices.length > 0) {
    const computed = computeMarketAnalysisWithClustering(pricesForStats, 0.5);
    market_analysis = computed.market_analysis;
    recommended_sale_price = computed.recommended_sale_price;
  } else if (clusterPrices.length > 0) {
    const computed = computeMarketAnalysisWithClustering(pricesForStats, 0.5);
    market_analysis = computed.market_analysis;
    recommended_sale_price = computed.recommended_sale_price;
  } else {
    market_analysis = { average_price: null, median_price: null, price_range: { min: null, max: null } };
  }

  const platforms = buildGeneralSearchTable(accepted_listings, 0.5);

  return {
    product,
    confidence,
    market_analysis,
    recommended_sale_price,
    accepted_listings,
    valid_listings: accepted_listings,
    rejected_listings,
    platforms
  };
}

/**
 * Returns the result in the format expected by the editor UI: productName, platforms (9 rows), summaryText.
 * Keeps existing layout; uses accepted_listings for table and adds confidence in summary when low.
 * @param {string} imageUrl
 * @param {string} [userHint]
 * @param {Object} [options]
 * @returns {Promise<{ productName: string, platforms: Array<{ name: string, currency: string, minPrice?: number|null, avgPrice?: number|null, maxPrice?: number|null }>, summaryText: string }>}
 */
export async function runForEditorTable(imageUrl, userHint = "", options = {}) {
  const { gl = "tr" } = options;

  const isPublicImageUrl =
    imageUrl &&
    typeof imageUrl === "string" &&
    (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"));

  let result;
  if (isPublicImageUrl) {
    try {
      const lensResult = await runProductPriceAnalysisFromLens(imageUrl, { gl });
      if (lensResult.accepted_listings.length >= 1) {
        result = lensResult;
      } else {
        result = await runProductPriceAnalysis(imageUrl, { userHint, gl });
      }
    } catch (e) {
      result = await runProductPriceAnalysis(imageUrl, { userHint, gl });
    }
  } else if (imageUrl) {
    result = await runProductPriceAnalysis(imageUrl, { userHint, gl });
  } else {
    result = await runProductPriceAnalysisFromText(userHint, { gl });
  }

  if (result.error) {
    return {
      productName: "",
      platforms: [],
      summaryText: result.message || "",
      error: result.error,
      message: result.message
    };
  }

  const productName = [result.product.brand, result.product.model, result.product.product_type]
    .filter(Boolean)
    .join(" ")
    .trim() || "Product";

  const ma = result.market_analysis;
  const parts = [];
  if (result.confidence === "low") {
    parts.push("Az eşleşen ilan (düşük güven).");
  }
  if (ma.price_range?.min != null && ma.price_range?.max != null) {
    parts.push(`En düşük: ${ma.price_range.min}, En yüksek: ${ma.price_range.max}.`);
  }
  if (ma.average_price != null) parts.push(`Ortalama: ${ma.average_price}.`);
  if (result.recommended_sale_price != null) {
    parts.push(`Önerilen satış fiyatı: ${result.recommended_sale_price} (ortalama × 0.95).`);
  }
  const summaryText = parts.length ? parts.join(" ") : "Fiyat analizi tamamlandı.";

  return {
    productName,
    platforms: result.platforms,
    summaryText
  };
}
