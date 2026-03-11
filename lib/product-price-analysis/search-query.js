/**
 * Builds a search query from product fields: brand + model + product_type.
 * @module product-price-analysis/search-query
 */

/**
 * Builds search query from product: brand + product_type + color + category (e.g. "beige shoulder bag women").
 * @param {import("./types.js").Product} product
 * @returns {string}
 */
export function buildSearchQuery(product) {
  if (!product || typeof product !== "object") return "product";

  const parts = [product.brand, product.model, product.product_type, product.color, product.category]
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim());

  return parts.join(" ").trim() || "product";
}
