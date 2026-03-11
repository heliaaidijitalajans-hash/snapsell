/**
 * Builds a precise search query from product identification fields.
 * @module price-pipeline/search-query
 */

/**
 * Builds a search query from identification: brand + model + product_type + color.
 * Empty fields are omitted. Falls back to product_type or a generic term.
 * @param {import("./types.js").ProductIdentification} identification
 * @returns {string}
 */
export function buildSearchQuery(identification) {
  if (!identification || typeof identification !== "object") return "product";

  const parts = [
    identification.brand,
    identification.model,
    identification.product_type,
    identification.color
  ]
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim());

  const query = parts.join(" ").trim();
  return query || identification.product_type || "product";
}
