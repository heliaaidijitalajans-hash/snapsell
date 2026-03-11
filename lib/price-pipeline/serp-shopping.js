/**
 * SerpAPI Google Shopping: fetch results and normalize to title, price, store, link.
 * @module price-pipeline/serp-shopping
 */

const SERPAPI_API_KEY = (process.env.SERPAPI_API_KEY || "").trim();

/**
 * Fetches Google Shopping results via SerpAPI and normalizes to listing shape.
 * @param {string} query - Search query (e.g. "Nike Air Max running shoes white")
 * @param {Object} [options]
 * @param {string} [options.gl="tr"] - Country (tr → TRY)
 * @param {string} [options.hl="tr"] - Language
 * @param {number} [options.num=20] - Number of results
 * @returns {Promise<import("./types.js").ShoppingListing[]>}
 */
export async function fetchGoogleShopping(query, options = {}) {
  const { gl = "tr", hl = "tr", num = 20 } = options;
  if (!SERPAPI_API_KEY || !query || typeof query !== "string") return [];
  const q = String(query).trim().slice(0, 200);
  if (!q) return [];

  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q,
      gl,
      hl,
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
    const collect = (item) => {
      const listing = normalizeItem(item, gl);
      if (listing) listings.push(listing);
    };

    (data.shopping_results || []).forEach(collect);
    (data.inline_shopping_results || []).forEach(collect);
    if (Array.isArray(data.categorized_shopping_results)) {
      for (const cat of data.categorized_shopping_results) {
        (cat.shopping_results || []).forEach(collect);
      }
    }

    return listings;
  } catch (e) {
    console.warn("[price-pipeline] SerpAPI:", e.message);
    return [];
  }
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} gl
 * @returns {ShoppingListing|null}
 */
function normalizeItem(item, gl) {
  if (!item || typeof item !== "object") return null;

  const title = String(item.title ?? "").trim();
  const store = String(item.source ?? item.seller ?? "").trim();
  const link = String(item.link ?? "").trim();

  let price = null;
  const extracted = item.extracted_price;
  const priceStr = String(item.price ?? "");

  if (typeof extracted === "number" && extracted > 0) {
    price = extracted;
  } else if (priceStr) {
    const parsed = parsePriceString(priceStr);
    if (parsed != null) price = parsed;
  }

  if (price == null || price < 0.5) return null;

  return {
    title: title || "—",
    price,
    store: store || "—",
    link: link || "",
    priceDisplay: priceStr || undefined
  };
}

function parsePriceString(str) {
  const tlMatch = str.match(/(?:₺|TL)\s*([\d.,]+)/i) || str.match(/([\d.,]+)\s*(?:₺|TL)/i);
  if (tlMatch) {
    const n = parseFloat(tlMatch[1].replace(/\./g, "").replace(",", "."));
    return Number.isNaN(n) ? null : n;
  }
  const usdMatch = str.match(/\$\s*([\d.,]+)/) || str.match(/([\d.,]+)\s*USD/i);
  if (usdMatch) {
    const n = parseFloat(usdMatch[1].replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
  }
  const plain = str.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = parseFloat(plain);
  return Number.isNaN(n) ? null : n;
}
