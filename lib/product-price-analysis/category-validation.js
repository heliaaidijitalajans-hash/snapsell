/**
 * Product category validation after vision model output.
 * Blocks unsupported categories (e.g. food, drink) to prevent irrelevant price searches.
 * @module product-price-analysis/category-validation
 */

/** Allowed category keywords (price analysis supported). */
const ALLOWED_CATEGORIES = Object.freeze([
  "fashion",
  "electronics",
  "accessory",
  "accessories",
  "home",
  "beauty",
  "toys",
  "footwear",
  "apparel",
  "bag",
  "clothing",
  "wear"
]);

/** Blocked category keywords (do not run price analysis). */
const BLOCKED_CATEGORIES = Object.freeze([
  "food",
  "drink",
  "recipe",
  "cooking oil",
  "ingredient",
  "meal"
]);

/**
 * Checks if the detected product (category + product_type) contains a blocked keyword.
 * @param {import("./types.js").Product} product - Vision output { category, product_type, brand, color, ... }
 * @returns {{ valid: true } | { valid: false, error: string, message: string }}
 */
export function validateProductCategory(product) {
  const raw = [
    String(product?.category ?? ""),
    String(product?.product_type ?? "")
  ]
    .join(" ")
    .toLowerCase()
    .trim();
  if (!raw) return { valid: true };

  const normalized = raw.replace(/\s+/g, " ");
  const hasBlocked = BLOCKED_CATEGORIES.some((keyword) => {
    const re = new RegExp("\\b" + keyword.replace(/\s+/g, "\\s+") + "\\b", "i");
    return re.test(normalized);
  });
  if (hasBlocked) {
    return {
      valid: false,
      error: "product_category_not_supported",
      message: "The system could not confidently identify the product category."
    };
  }
  return { valid: true };
}
