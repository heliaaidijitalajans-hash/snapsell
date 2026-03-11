/**
 * Listing relevance scoring and filtering by product type, category, brand, color, material.
 * Rejects listings that suggest a different product (e.g. set, bundle, wrong category).
 * @module product-price-analysis/relevance-filter
 */

/** Words that suggest a different product (set/bundle/organizer etc.) - reject if title contains and product is single item */
const REJECT_TITLE_WORDS = Object.freeze([
  "set", "bundle", "collection", "organizer", "kit", "pack ", " pack", "multi", "lot of",
  "luxury", "designer", "premium" // often unrelated high-price
]);

/** Pairs: if product_type/category suggests X, reject listings with Y in title */
const PRODUCT_TYPE_REJECT = Object.freeze([
  { productTerms: ["bag", "çanta", "handbag", "clutch"], rejectInTitle: ["wallet", "cüzdan", "luggage", "bavul", "suitcase", "travel bag", "wallet set", "organizer", "backpack", "travel luggage"] },
  { productTerms: ["shoulder bag", "omuz çantası"], rejectInTitle: ["luggage", "bavul", "suitcase", "travel bag", "wallet set", "organizer", "backpack", "travel luggage"] },
  { productTerms: ["shoe", "ayakkabı", "sneaker", "terlik"], rejectInTitle: ["bag", "çanta", "watch", "saat"] }
]);

/** Minimum token-overlap similarity between product description and listing title (0.7 = strict). */
const MIN_TITLE_SIMILARITY = 0.7;

/**
 * Normalizes string for comparison: lowercase, trim, collapse spaces.
 * @param {string} s
 * @returns {string}
 */
function normalize(s) {
  if (typeof s !== "string") return "";
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Extracts meaningful tokens (min 2 chars) from product_type or category for matching.
 * @param {string} productType
 * @param {string} category
 * @returns {string[]}
 */
function getCategoryTerms(productType, category) {
  const combined = [productType, category].filter(Boolean).join(" ");
  return combined
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Checks if listing title suggests a different product type (e.g. wallet when product is bag).
 * @param {string} titleNorm
 * @param {string[]} productTypeTerms
 * @returns {string|null} Reject reason or null
 */
function getProductTypeMismatchReason(titleNorm, productTypeTerms) {
  if (!titleNorm || productTypeTerms.length === 0) return null;
  for (const { productTerms, rejectInTitle } of PRODUCT_TYPE_REJECT) {
    const productMatch = productTerms.some((p) => productTypeTerms.some((t) => t.includes(p) || p.includes(t)));
    if (!productMatch) continue;
    const hasReject = rejectInTitle.some((r) => titleNorm.includes(r));
    if (hasReject) return `Title suggests different product type (${rejectInTitle.find((r) => titleNorm.includes(r))})`;
  }
  return null;
}

/**
 * Reject if title contains generic reject words (set, bundle, etc.).
 * @param {string} titleNorm
 * @returns {string|null}
 */
function getRejectWordReason(titleNorm) {
  if (!titleNorm) return null;
  for (const word of REJECT_TITLE_WORDS) {
    const re = new RegExp("\\b" + word.replace(/\s+/g, "\\s+") + "\\b", "i");
    if (re.test(titleNorm)) return `Title contains "${word}" (likely different product)`;
  }
  return null;
}

/**
 * Category/product_type match is required: at least one term from product_type or category must appear in title.
 * @param {string} titleNorm
 * @param {string[]} categoryTerms
 * @returns {boolean}
 */
function hasCategoryMatch(titleNorm, categoryTerms) {
  if (categoryTerms.length === 0) return true;
  return categoryTerms.some((term) => term.length >= 2 && titleNorm.includes(term));
}

/**
 * Tokenize string into words (min 2 chars), normalized.
 * @param {string} s
 * @returns {string[]}
 */
function tokenize(s) {
  if (typeof s !== "string" || !s.trim()) return [];
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2);
}

/**
 * Token-overlap similarity: share of product tokens that appear in the title (0..1).
 * Example: product "beige shoulder bag", title "beige shoulder bag leather" → 3/3 = 1.
 * product "beige shoulder bag", title "travel luggage bag" → 1/3 ≈ 0.33.
 * @param {string} productDescNorm - Normalized product description (brand + product_type + color etc.)
 * @param {string} titleNorm - Normalized listing title
 * @returns {number}
 */
function tokenOverlapSimilarity(productDescNorm, titleNorm) {
  const productTokens = tokenize(productDescNorm);
  const titleTokens = new Set(tokenize(titleNorm));
  if (productTokens.length === 0) return 1;
  const found = productTokens.filter((t) => titleTokens.has(t)).length;
  return found / productTokens.length;
}

/**
 * Simple title similarity: share of category terms found in title (0..1). Kept for fallback.
 * @param {string} titleNorm
 * @param {string[]} categoryTerms
 * @returns {number}
 */
function titleSimilarity(titleNorm, categoryTerms) {
  if (categoryTerms.length === 0) return 1;
  const found = categoryTerms.filter((t) => t.length >= 2 && titleNorm.includes(t)).length;
  return found / categoryTerms.length;
}

/**
 * Builds normalized product description string for similarity (brand + model + product_type + color).
 * @param {import("./types.js").Product} product
 * @returns {string}
 */
function getProductDescriptionString(product) {
  const parts = [
    product?.brand,
    product?.model,
    product?.product_type,
    product?.category,
    product?.color
  ]
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim());
  return normalize(parts.join(" "));
}

/**
 * Scores a listing for relevance. Returns { score, rejectReason }.
 * - Token-overlap similarity (product desc vs title) must be >= 0.7.
 * - Category validation: reject words (luggage, travel bag, wallet set, organizer, backpack, etc.) when product is bag.
 * - Reject words and product-type mismatch force reject.
 * @param {import("./types.js").Product} product
 * @param {import("./types.js").Listing} listing
 * @returns {{ score: number, rejectReason: string|null }}
 */
export function scoreListing(product, listing) {
  const title = String(listing?.title ?? "").trim();
  const titleNorm = normalize(title);
  if (titleNorm.length < 2) return { score: 0, rejectReason: "Title too short" };

  const productDescNorm = getProductDescriptionString(product || {});
  const categoryTerms = getCategoryTerms(product?.product_type ?? "", product?.category ?? "");

  let rejectReason = getRejectWordReason(titleNorm);
  if (rejectReason) return { score: 0, rejectReason };

  rejectReason = getProductTypeMismatchReason(titleNorm, categoryTerms);
  if (rejectReason) return { score: 0, rejectReason };

  if (categoryTerms.length > 0 && !hasCategoryMatch(titleNorm, categoryTerms)) {
    return { score: 0, rejectReason: "Category/product_type does not match title" };
  }

  const tokenSim = tokenOverlapSimilarity(productDescNorm, titleNorm);
  if (tokenSim < MIN_TITLE_SIMILARITY) {
    return { score: 0, rejectReason: `Title similarity too low (${(tokenSim * 100).toFixed(0)}% < 70%)` };
  }

  let score = tokenSim;
  const brand = normalize(product?.brand ?? "");
  if (brand && titleNorm.includes(brand)) score += 0.1;
  const color = normalize(product?.color ?? "");
  if (color && titleNorm.includes(color)) score += 0.05;
  const material = normalize(product?.material ?? "");
  if (material && titleNorm.includes(material)) score += 0.05;

  return { score: Math.min(1, score), rejectReason: null };
}

/**
 * Validates that listing has category/product_type match (required).
 * @param {import("./types.js").Product} product
 * @param {import("./types.js").Listing} listing
 * @returns {boolean}
 */
export function hasRequiredCategoryMatch(product, listing) {
  const titleNorm = normalize(String(listing?.title ?? ""));
  const categoryTerms = getCategoryTerms(product?.product_type ?? "", product?.category ?? "");
  return hasCategoryMatch(titleNorm, categoryTerms);
}

/**
 * Filters listings by relevance. Removes duplicates (by title+price+platform), missing price, and low relevance.
 * @param {import("./types.js").Listing[]} listings
 * @param {import("./types.js").Product} product
 * @param {number} [minScore=0.7] - Minimum score to accept (token similarity product vs title >= 0.7)
 * @returns {{ accepted: import("./types.js").Listing[], rejected: import("./types.js").RejectedListing[] }}
 */
export function filterByRelevance(listings, product, minScore = 0.7) {
  const accepted = [];
  const rejected = [];
  const seen = new Set();

  for (const listing of listings || []) {
    const price = listing?.price;
    if (price == null || typeof price !== "number" || Number.isNaN(price) || price <= 0) {
      rejected.push({
        title: String(listing?.title ?? "").slice(0, 200),
        price: String(price ?? ""),
        reason: "Price missing or invalid"
      });
      continue;
    }

    const key = `${normalize(String(listing?.title ?? ""))}|${price}|${listing?.platform ?? ""}`;
    if (seen.has(key)) {
      rejected.push({
        title: String(listing?.title ?? "").slice(0, 200),
        price: String(price),
        reason: "Duplicate listing"
      });
      continue;
    }
    seen.add(key);

    const { score, rejectReason } = scoreListing(product, listing);
    if (rejectReason || score < minScore) {
      rejected.push({
        title: String(listing?.title ?? "").slice(0, 200),
        price: String(price),
        reason: rejectReason || "Title similarity too low"
      });
      continue;
    }

    accepted.push(listing);
  }

  return { accepted, rejected };
}
