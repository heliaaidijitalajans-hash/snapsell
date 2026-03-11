/**
 * SerpAPI Google Lens: image similarity search. Returns visually similar product listings.
 * @module product-price-analysis/google-lens-search
 */

import { SOURCE_TO_PLATFORM } from "./types.js";

const SERPAPI_API_KEY = (process.env.SERPAPI_API_KEY || "").trim();

/**
 * Maps source name to our platform name (for table compatibility).
 * @param {string} source
 * @returns {string}
 */
function platformFromSource(source) {
  if (!source || typeof source !== "string") return source || "—";
  const s = String(source).trim();
  for (const { pattern, name } of SOURCE_TO_PLATFORM) {
    if (pattern.test(s)) return name;
  }
  return s || "—";
}

/**
 * Converts price string or object to number. Handles "249 TL", "€29.99", "$19.99", extracted_value.
 * @param {string|number|{ value?: string, extracted_value?: number }|null} price
 * @returns {number|null}
 */
export function parsePriceToNumber(price) {
  if (price == null) return null;
  if (typeof price === "number" && !Number.isNaN(price) && price > 0) {
    return Math.round(price * 100) / 100;
  }
  if (typeof price === "object" && typeof price.extracted_value === "number" && price.extracted_value > 0) {
    return Math.round(price.extracted_value * 100) / 100;
  }
  const str = typeof price === "object" ? price?.value : String(price ?? "");
  if (!str || typeof str !== "string") return null;

  const normalized = str.trim().replace(/\s+/g, " ");
  const tlMatch = normalized.match(/(?:₺|TL)\s*([\d.,]+)/i) || normalized.match(/([\d.,]+)\s*(?:₺|TL)/i);
  if (tlMatch) {
    const n = parseFloat(tlMatch[1].replace(/\./g, "").replace(",", "."));
    return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
  }
  const usdMatch = normalized.match(/\$\s*([\d.,]+)/) || normalized.match(/([\d.,]+)\s*USD/i);
  if (usdMatch) {
    const n = parseFloat(usdMatch[1].replace(/,/g, ""));
    return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
  }
  const eurMatch = normalized.match(/€\s*([\d.,]+)/) || normalized.match(/([\d.,]+)\s*EUR/i);
  if (eurMatch) {
    const n = parseFloat(eurMatch[1].replace(/\./g, "").replace(",", "."));
    return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
  }
  const plain = parseFloat(normalized.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isNaN(plain) ? null : Math.round(plain * 100) / 100;
}

/**
 * Fetches visually similar products from SerpAPI Google Lens.
 * @param {string} imageUrl - Public image URL (http/https). Data URLs may not be supported by SerpAPI.
 * @param {Object} [options]
 * @param {string} [options.gl="tr"]
 * @returns {Promise<Array<{ title: string, source: string, price: number, link: string }>>}
 */
export async function fetchGoogleLensListings(imageUrl, options = {}) {
  const { gl = "tr" } = options;
  if (!SERPAPI_API_KEY || !imageUrl || typeof imageUrl !== "string") return [];

  const url = imageUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: "google_lens",
      url: url,
      api_key: SERPAPI_API_KEY,
      gl: gl || "tr"
    });

    const res = await fetch("https://serpapi.com/search?" + params.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(25000)
    });

    if (!res.ok) return [];
    const data = await res.json();

    const listings = [];
    const visualMatches = data.visual_matches || data.visual_results || [];

    for (const item of visualMatches) {
      const title = String(item.title ?? "").trim() || "—";
      const source = String(item.source ?? "").trim() || "—";
      const link = String(item.link ?? "").trim();
      const priceNum = parsePriceToNumber(item.price);
      if (priceNum == null || priceNum < 0.01) continue;

      listings.push({
        title,
        source,
        price: priceNum,
        link,
        platform: platformFromSource(source),
        url: link
      });
    }

    return listings;
  } catch (e) {
    console.warn("[product-price-analysis] Google Lens:", e.message);
    return [];
  }
}
