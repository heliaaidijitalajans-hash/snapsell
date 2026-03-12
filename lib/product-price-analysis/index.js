/**
 * Product price analysis pipeline: image → product → search → clean → market stats → output.
 * @module product-price-analysis
 */

import { analyzeProductImage } from "./image-analysis.js";
import { buildSearchQuery } from "./search-query.js";
import { searchPrices, searchPricesPerPlatform } from "./price-search.js";
import { filterByRelevance } from "./relevance-filter.js";
import { toNumericPrices, applyStrongOutlierFilter, removeDuplicateListings } from "./price-cleaning.js";
import { computeMarketAnalysis, computeMarketAnalysisWithClustering, getLargestPriceCluster, median, minMax, average, recommendedSalePriceFromMedian } from "./market-stats.js";
import { buildGeneralSearchTable, buildPlatformTableWithPerPlatformCleaning } from "./platform-table.js";
import { fetchGoogleLensListings } from "./google-lens-search.js";
import { validateProductCategory } from "./category-validation.js";

export { analyzeProductImage } from "./image-analysis.js";
export { filterByRelevance, scoreListing, hasRequiredCategoryMatch } from "./relevance-filter.js";
export { buildSearchQuery } from "./search-query.js";
export { searchPrices, searchPricesPerPlatform } from "./price-search.js";
export { cleanPrices, removeDuplicatePrices, removeDuplicateListings, removePriceOutliers, toNumericPrices, filterListingsByCleanedPrices, filterListingsByGlobalMedian, applyStrongOutlierFilter } from "./price-cleaning.js";
export { median, average, minMax, recommendedSalePrice, recommendedSalePriceFromMedian, computeMarketAnalysis, computeMarketAnalysisWithClustering, getLargestPriceCluster } from "./market-stats.js";
export { buildPlatformTable, buildGeneralSearchTable, buildPlatformTableWithPerPlatformCleaning } from "./platform-table.js";
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
 * Cleans Lens listings: remove duplicates, then keep prices in [0.5×median, 1.8×median] (same band as main pipeline).
 * @param {import("./types.js").Listing[]} listings
 * @returns {import("./types.js").Listing[]}
 */
function cleanLensListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const deduped = removeDuplicateListings(listings);
  return applyStrongOutlierFilter(deduped, 0.5, 1.8);
}

/** Round price to 2 decimals for cluster matching. */
function roundPrice2(p) {
  return typeof p === "number" && !Number.isNaN(p) ? Math.round(p * 100) / 100 : null;
}

/**
 * Runs price analysis from SerpAPI Google Lens (image similarity). Use when imageUrl is a public URL.
 * Uses same 0.6–1.6 band and cluster-based stats as main pipeline for consistent accuracy.
 * @param {string} imageUrl - Public image URL (http/https)
 * @param {Object} [options]
 * @param {string} [options.gl="tr"]
 * @returns {Promise<import("./types.js").AnalysisResult>}
 */
export async function runProductPriceAnalysisFromLens(imageUrl, options = {}) {
  const { gl = "tr" } = options;
  const rawListings = await fetchGoogleLensListings(imageUrl, { gl });
  const afterOutlier = cleanLensListings(rawListings);
  const pricesForStats = toNumericPrices(afterOutlier);
  const finalCluster = getLargestPriceCluster(pricesForStats, 0.45);
  const clusterSet = new Set(finalCluster.map(roundPrice2).filter((p) => p != null && p > 0));
  const accepted_listings = finalCluster.length > 0
    ? afterOutlier.filter((l) => clusterSet.has(roundPrice2(l?.price)))
    : afterOutlier;
  const confidence = getConfidence(accepted_listings.length);

  const pricesToUse = accepted_listings.length > 0 ? toNumericPrices(accepted_listings) : pricesForStats;
  let market_analysis;
  let recommended_sale_price = null;
  if (pricesToUse.length > 0) {
    const med = median(pricesToUse);
    const avg = average(pricesToUse);
    market_analysis = {
      median_price: Math.round(med * 100) / 100,
      average_price: Math.round(avg * 100) / 100,
      price_range: { min: null, max: null }
    };
    recommended_sale_price = recommendedSalePriceFromMedian(med, 0.95);
  } else {
    market_analysis = {
      average_price: null,
      median_price: null,
      price_range: { min: null, max: null }
    };
  }

  const platforms = buildGeneralSearchTable(accepted_listings, 0);

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
 * Runs the full pipeline: relevance filter (similarity >= 0.75) → outlier (0.6–1.6 × median) → cluster → output.
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
  const rawListings = await searchPricesPerPlatform(query, { gl, numPerPlatform: 20 });

  const { accepted: afterRelevance, rejected: rejectedByRelevance } = filterByRelevance(rawListings, product, 0.6);

  const { platforms, allCleanedPrices, perPlatformCleanedListings } = buildPlatformTableWithPerPlatformCleaning(
    afterRelevance,
    0.5,
    1.8
  );
  const finalCluster = getLargestPriceCluster(allCleanedPrices, 0.45);
  const clusterSet = new Set(finalCluster.map(roundPrice2).filter((p) => p != null && p > 0));
  const accepted_listings = finalCluster.length > 0
    ? perPlatformCleanedListings.filter((l) => clusterSet.has(roundPrice2(l?.price)))
    : perPlatformCleanedListings;
  const rejectedByOutlier = afterRelevance.filter((l) => !perPlatformCleanedListings.includes(l));
  const rejected_listings = [
    ...rejectedByRelevance,
    ...rejectedByOutlier.map((l) => ({
      title: String(l?.title ?? "").slice(0, 200),
      price: String(l?.price ?? ""),
      reason: "Price outside valid range (0.5–1.8 × median) for platform"
    }))
  ];

  const confidence = getConfidence(accepted_listings.length);

  const pricesForStats = accepted_listings.length > 0 ? toNumericPrices(accepted_listings) : allCleanedPrices;
  let market_analysis;
  let recommended_sale_price = null;
  let platformsFinal = platforms;
  if (pricesForStats.length > 0) {
    const med = median(pricesForStats);
    const avg = average(pricesForStats);
    market_analysis = {
      median_price: Math.round(med * 100) / 100,
      average_price: Math.round(avg * 100) / 100,
      price_range: { min: null, max: null }
    };
    recommended_sale_price = recommendedSalePriceFromMedian(med, 0.95);
    const { platforms: fromListings } = buildPlatformTableWithPerPlatformCleaning(accepted_listings, 0, 10);
    platformsFinal = fromListings;
  } else {
    market_analysis = { average_price: null, median_price: null, price_range: { min: null, max: null } };
  }

  return {
    product,
    confidence,
    market_analysis,
    recommended_sale_price,
    accepted_listings,
    valid_listings: accepted_listings,
    rejected_listings,
    platforms: platformsFinal
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
  let rawListings = await searchPricesPerPlatform(query, { gl, numPerPlatform: 20 });
  if (rawListings.length < 5) {
    rawListings = await searchPrices(query, { gl, num: 60 });
  }

  const { accepted: afterRelevance, rejected: rejectedByRelevance } = filterByRelevance(rawListings, product, 0.6);

  const { platforms, allCleanedPrices, perPlatformCleanedListings } = buildPlatformTableWithPerPlatformCleaning(
    afterRelevance,
    0.5,
    1.8
  );
  const finalCluster = getLargestPriceCluster(allCleanedPrices, 0.45);
  const clusterSet = new Set(finalCluster.map(roundPrice2).filter((p) => p != null && p > 0));
  const accepted_listings = finalCluster.length > 0
    ? perPlatformCleanedListings.filter((l) => clusterSet.has(roundPrice2(l?.price)))
    : perPlatformCleanedListings;
  const rejectedByOutlier = afterRelevance.filter((l) => !perPlatformCleanedListings.includes(l));
  const rejected_listings = [
    ...rejectedByRelevance,
    ...rejectedByOutlier.map((l) => ({
      title: String(l?.title ?? "").slice(0, 200),
      price: String(l?.price ?? ""),
      reason: "Price outside valid range (0.5–1.8 × median) for platform"
    }))
  ];

  const confidence = getConfidence(accepted_listings.length);

  const pricesForStats = accepted_listings.length > 0 ? toNumericPrices(accepted_listings) : allCleanedPrices;
  let market_analysis;
  let recommended_sale_price = null;
  let platformsFinal = platforms;
  if (pricesForStats.length > 0) {
    const med = median(pricesForStats);
    const avg = average(pricesForStats);
    market_analysis = {
      median_price: Math.round(med * 100) / 100,
      average_price: Math.round(avg * 100) / 100,
      price_range: { min: null, max: null }
    };
    recommended_sale_price = recommendedSalePriceFromMedian(med, 0.95);
    const { platforms: fromListings } = buildPlatformTableWithPerPlatformCleaning(accepted_listings, 0, 10);
    platformsFinal = fromListings;
  } else {
    market_analysis = { average_price: null, median_price: null, price_range: { min: null, max: null } };
  }

  return {
    product,
    confidence,
    market_analysis,
    recommended_sale_price,
    accepted_listings,
    valid_listings: accepted_listings,
    rejected_listings,
    platforms: platformsFinal
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
  if (ma.average_price != null) parts.push(`Ortalama: ${ma.average_price}.`);
  if (result.recommended_sale_price != null) {
    parts.push(`Önerilen satış fiyatı: ${result.recommended_sale_price}.`);
  }
  const summaryText = parts.length ? parts.join(" ") : "Fiyat analizi tamamlandı.";

  const hasAnyPrice = result.platforms.some(
    (p) => p.avgPrice != null || p.minPrice != null || p.maxPrice != null
  );
  const platformsOut = hasAnyPrice ? result.platforms : [];

  return {
    productName,
    platforms: platformsOut,
    summaryText
  };
}
