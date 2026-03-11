/**
 * Fetches product listings via SerpAPI (Google Shopping), filtered by allowed platforms.
 * Returns { title, price, platform, url } from amazon.com, etsy.com, trendyol.com, etc.
 * @module product-price-analysis/price-search
 */

import { ALLOWED_PLATFORMS, SOURCE_TO_PLATFORM } from "./types.js";

const SERPAPI_API_KEY = (process.env.SERPAPI_API_KEY || "").trim();

/**
 * Gets hostname from URL (e.g. "https://www.amazon.com.tr/foo" → "www.amazon.com.tr").
 * @param {string} url
 * @returns {string}
 */
function getHostname(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Platform from URL hostname (only allowed domains).
 * @param {string} url
 * @returns {string|null}
 */
function platformFromUrl(url) {
  const host = getHostname(url);
  return ALLOWED_PLATFORMS[host] || null;
}

/**
 * Platform from SerpAPI source/seller name (when link is Google redirect).
 * @param {string} source
 * @returns {string|null}
 */
function platformFromSource(source) {
  if (!source || typeof source !== "string") return null;
  const s = String(source).trim();
  if (!s) return null;
  for (const { pattern, name } of SOURCE_TO_PLATFORM) {
    if (pattern.test(s)) return name;
  }
  return null;
}

/**
 * Parse price from SerpAPI item (extracted_price or price string).
 * @param {Record<string, unknown>} item
 * @returns {number|null}
 */
function parsePrice(item) {
  const num = item.extracted_price;
  if (typeof num === "number" && num > 0) return Math.round(num * 100) / 100;

  const str = String(item.price ?? "");
  const tl = str.match(/(?:₺|TL)\s*([\d.,]+)/i) || str.match(/([\d.,]+)\s*(?:₺|TL)/i);
  if (tl) {
    const n = parseFloat(tl[1].replace(/\./g, "").replace(",", "."));
    return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
  }
  const usd = str.match(/\$\s*([\d.,]+)/) || str.match(/([\d.,]+)\s*USD/i);
  if (usd) {
    const n = parseFloat(usd[1].replace(/,/g, ""));
    return Number.isNaN(n) ? null : Math.round(n * 100) / 100;
  }
  const plain = parseFloat(str.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isNaN(plain) ? null : Math.round(plain * 100) / 100;
}

/**
 * Fetches shopping results and returns only listings from allowed platforms.
 * @param {string} query - Search query (e.g. "Nike Air Force 1 white sneakers")
 * @param {Object} [options]
 * @param {string} [options.gl="us"] - Country (us, tr, etc.)
 * @param {number} [options.num=30]
 * @returns {Promise<import("./types.js").Listing[]>}
 */
export async function searchPrices(query, options = {}) {
  const { gl = "us", num = 30 } = options;
  if (!SERPAPI_API_KEY || !query || typeof query !== "string") return [];

  const q = String(query).trim().slice(0, 200);
  if (!q) return [];

  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q,
      gl,
      hl: gl === "tr" ? "tr" : "en",
      api_key: SERPAPI_API_KEY,
      num: String(num)
    });

    const res = await fetch("https://serpapi.com/search?" + params.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) return [];
    const data = await res.json();

    const listings = [];
    const seen = new Set();

    function add(item) {
      if (!item || typeof item !== "object") return;
      const link = String(item.link ?? "").trim();
      const source = String(item.source ?? item.seller ?? "").trim();
      let platform = platformFromUrl(link);
      if (!platform) platform = platformFromSource(source);
      if (!platform) return;

      const price = parsePrice(item);
      if (price == null || price < 0.01) return;

      const title = String(item.title ?? "").trim() || "—";
      const key = `${title}|${price}|${platform}|${link || source}`;
      if (seen.has(key)) return;
      seen.add(key);

      listings.push({ title, price, platform, url: link || "" });
    }

    (data.shopping_results || []).forEach(add);
    (data.inline_shopping_results || []).forEach(add);
    if (Array.isArray(data.categorized_shopping_results)) {
      for (const cat of data.categorized_shopping_results) {
        (cat.shopping_results || []).forEach(add);
      }
    }

    return listings;
  } catch (e) {
    console.warn("[product-price-analysis] price-search:", e.message);
    return [];
  }
}
