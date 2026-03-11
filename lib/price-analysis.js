/**
 * Fiyat analizi: ScraperAPI ile pazaryerlerinden fiyat çekme + GPT özet.
 * server.js ile aynı mantık (PRICE_MARKETPLACES, extract*, cleanPricesMinAvgMax).
 * V2: price-pipeline (structured image analysis + Google Shopping + cleaning) for accurate estimates.
 */

const SCRAPERAPI_API_KEY = (process.env.SCRAPERAPI_API_KEY || process.env.SCRAPER_API_KEY || "").trim();
const EXA_API_KEY = (process.env.EXA_API_KEY || "").trim();
const SERPAPI_API_KEY = (process.env.SERPAPI_API_KEY || "").trim();

/** Görsel + kullanıcı metninden fiyat araması için tek bir ürün arama terimi üretir (GPT Vision). */
export async function getProductQueryFromImageAndText(imageUrl, userText) {
  if (!process.env.OPENAI_API_KEY) return (userText && String(userText).trim()) || "";
  const text = (userText && String(userText).trim()) || "";
  if (!imageUrl || typeof imageUrl !== "string") return text;
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const content = [
      {
        type: "text",
        text: "Bu ürün görseli ve kullanıcının yazdığı metne göre fiyat araması için tek bir net arama terimi üret (Türkçe, 3-8 kelime). Sadece arama terimini döndür, başka metin yazma."
      },
      { type: "image_url", image_url: { url: imageUrl } }
    ];
    if (text) content[0].text = `Kullanıcı metni: "${text}". Buna ve görsele göre fiyat araması için tek bir net arama terimi üret (Türkçe, 3-8 kelime). Sadece arama terimini döndür.`;
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content }],
      max_tokens: 80
    });
    const query = (res.choices?.[0]?.message?.content || "").trim();
    return query || text;
  } catch (e) {
    console.warn("Ürün tespiti (Vision):", e.message);
    return text;
  }
}

const PRICE_MARKETPLACES = [
  { urlBase: "https://www.amazon.com.tr/s?k=", currency: "TRY", name: "Amazon" },
  { urlBase: "https://www.trendyol.com/sr?q=", currency: "TRY", name: "Trendyol" },
  { urlBase: "https://www.hepsiburada.com/ara?q=", currency: "TRY", name: "Hepsiburada" },
  { urlBase: "https://www.n11.com/arama?q=", currency: "TRY", name: "N11" },
  { urlBase: "https://www.ciceksepeti.com/arama?q=", currency: "TRY", name: "Çiçek Sepeti" },
  { urlBase: "https://www.etsy.com/search?q=", currency: "USD", name: "Etsy" }
];

const CURRENCY_LIMITS = { TRY: [25, 80000], USD: [1, 5000], EUR: [1, 5000], GBP: [1, 5000] };

function extractPricesFromScripts(html, currency) {
  if (!html || typeof html !== "string" || !currency) return [];
  const seen = new Set();
  const out = [];
  const limits = CURRENCY_LIMITS[currency] || [1, 100000];
  function add(n) {
    if (n < limits[0] || n > limits[1]) return;
    const key = n;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value: Math.round(n * 100) / 100, currency });
  }
  const patterns = [
    /"(?:price|amount|currentPrice|minPrice|maxPrice|value|fiyat|birimFiyat|salePrice|discountPrice|sellingPrice|originalPrice|productPrice|listPrice|marketPrice)"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /"(?:price|amount|currentPrice|sellingPrice)"\s*:\s*\{\s*"(?:value|amount)"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /data-(?:price|amount|product-price|sale-price)="(\d+(?:[.,]\d+)?)"/gi,
    /data-price="(\d+(?:[.,]\d+)?)"/gi,
    /"price"\s*:\s*\{\s*"value"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /discountedPrice["\s:]+(\d+(?:[.,]\d+)?)/gi,
    /sellingPrice["\s:]+(\d+(?:[.,]\d+)?)/gi
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const s = (m[1] || "").replace(",", ".");
      const n = parseFloat(s);
      if (!Number.isNaN(n)) add(n);
    }
  }
  return out;
}

function extractPricesWithCurrency(text) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\s+/g, " ");
  const seen = new Set();
  const out = [];

  function add(value, currency) {
    const n = Math.round(value * 100) / 100;
    if (n < 0.5 || n > 500000) return;
    const key = currency + ":" + n;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value: n, currency });
  }

  let m;
  const tlRegex = /(?:₺|TL)\s*(\d[\d.,]*\d|\d+)/gi;
  while ((m = tlRegex.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "TRY");
  }
  const tryFormat = /\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?[\s]*(?:TL|₺)/gi;
  while ((m = tryFormat.exec(normalized)) !== null) {
    const s = m[0].replace(/\s*(?:TL|₺)\s*/gi, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "TRY");
  }
  const tryPlain = /\d{1,3}(?:\.\d{3})*,\d{2}(?=\s|$|[^0-9])/g;
  while ((m = tryPlain.exec(normalized)) !== null) {
    const s = (m[0] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "TRY");
  }

  const usdRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/g;
  while ((m = usdRegex.exec(normalized)) !== null) {
    const n = parseFloat((m[1] || "").replace(/,/g, ""));
    if (!Number.isNaN(n)) add(n, "USD");
  }
  const usdAfter = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*USD/gi;
  while ((m = usdAfter.exec(normalized)) !== null) {
    const n = parseFloat((m[1] || "").replace(/,/g, ""));
    if (!Number.isNaN(n)) add(n, "USD");
  }

  const eurRegex = /€\s*(\d[\d.,]*\d|\d+)/g;
  while ((m = eurRegex.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "EUR");
  }
  const eurAfter = /(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{2})?)\s*EUR/gi;
  while ((m = eurAfter.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "EUR");
  }

  const gbpRegex = /£\s*(\d[\d.,]*\d|\d+)/g;
  while ((m = gbpRegex.exec(normalized)) !== null) {
    const s = (m[1] || "").replace(/,/g, "");
    const n = parseFloat(s);
    if (!Number.isNaN(n)) add(n, "GBP");
  }
  const gbpAfter = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*GBP/gi;
  while ((m = gbpAfter.exec(normalized)) !== null) {
    const n = parseFloat((m[1] || "").replace(/,/g, ""));
    if (!Number.isNaN(n)) add(n, "GBP");
  }

  return out.sort((a, b) => a.currency.localeCompare(b.currency) || a.value - b.value);
}

function cleanPricesMinAvgMax(list, currency) {
  const limits = CURRENCY_LIMITS[currency] || [1, 100000];
  let arr = (list || []).filter(v => v >= limits[0] && v <= limits[1]);
  if (arr.length === 0) return { minPrice: null, avgPrice: null, maxPrice: null, count: 0 };
  if (arr.length === 1) return { minPrice: arr[0], avgPrice: arr[0], maxPrice: arr[0], count: 1 };
  arr = arr.slice().sort((a, b) => a - b);
  const q1 = Math.floor(arr.length * 0.25);
  const q3 = Math.ceil(arr.length * 0.75) - 1;
  const p25 = arr[q1];
  const p75 = arr[Math.min(q3, arr.length - 1)];
  const iqr = p75 - p25 || 1;
  arr = arr.filter(v => v >= p25 - 1.5 * iqr && v <= p75 + 1.5 * iqr);
  if (arr.length === 0) return { minPrice: null, avgPrice: null, maxPrice: null, count: 0 };
  const minP = arr[0];
  const maxP = arr[arr.length - 1];
  const sum = arr.reduce((a, b) => a + b, 0);
  return { minPrice: minP, avgPrice: Math.round((sum / arr.length) * 100) / 100, maxPrice: maxP, count: arr.length };
}

function extractSellerOrResultCount(htmlOrText) {
  if (!htmlOrText || typeof htmlOrText !== "string") return null;
  const t = htmlOrText.slice(0, 50000);
  const patterns = [
    /(\d{1,5})\s*satıcı/i,
    /(\d{1,5})\s*ürün/i,
    /(\d{1,5})\s*sonuç/i,
    /(\d{1,5})\s*results?/i,
    /(\d{1,5})\s*sellers?/i,
    /"sellerCount"\s*:\s*(\d+)/i,
    /"totalResults?"\s*:\s*(\d+)/i
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 100000) return n;
    }
  }
  return null;
}

async function getPricesFromExa(productDescription) {
  if (!EXA_API_KEY || !productDescription || typeof productDescription !== "string") return null;
  const query = String(productDescription).trim().slice(0, 150);
  if (!query) return null;
  try {
    const searchQuery = query + " fiyat TL satış";
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": EXA_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: searchQuery,
        numResults: 15,
        contents: {
          highlights: { maxCharacters: 5000 },
          text: true
        }
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!res.ok) {
      console.warn("Exa API:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const results = data.results || [];
    const textParts = [];
    for (const r of results) {
      if (r.content?.highlights?.length) textParts.push(r.content.highlights.join(" "));
      if (r.content?.text) textParts.push(r.content.text);
    }
    const combined = textParts.join(" ");
    if (!combined || combined.length < 50) return null;
    const extracted = extractPricesWithCurrency(combined);
    const byCurrency = { TRY: [], USD: [] };
    for (const p of extracted) {
      if (p.currency === "TRY") byCurrency.TRY.push(p.value);
      if (p.currency === "USD") byCurrency.USD.push(p.value);
    }
    const tryStats = cleanPricesMinAvgMax(byCurrency.TRY, "TRY");
    const usdStats = cleanPricesMinAvgMax(byCurrency.USD, "USD");
    if (!tryStats.minPrice && !usdStats.minPrice) return null;
    return { TRY: tryStats, USD: usdStats };
  } catch (e) {
    console.warn("Exa fiyat analizi:", e.message);
    return null;
  }
}

async function getPricesFromSerpAPI(productQuery) {
  if (!SERPAPI_API_KEY || !productQuery || typeof productQuery !== "string") return null;
  const q = String(productQuery).trim().slice(0, 150);
  if (!q) return null;
  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q,
      gl: "tr",
      hl: "tr",
      api_key: SERPAPI_API_KEY
    });
    const res = await fetch("https://serpapi.com/search?" + params.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tryPrices = [];
    const usdPrices = [];
    function addPrice(value, currency) {
      if (value == null || Number.isNaN(value) || value < 0.5) return;
      const limits = CURRENCY_LIMITS[currency];
      if (limits && (value < limits[0] || value > limits[1])) return;
      if (currency === "TRY") tryPrices.push(value);
      if (currency === "USD") usdPrices.push(value);
    }
    function collect(item) {
      if (!item) return;
      const num = item.extracted_price;
      const str = String(item.price || "");
      if (typeof num === "number") {
        if (/\$|USD|dolar/i.test(str)) addPrice(num, "USD");
        else addPrice(num, "TRY");
      } else if (str) {
        const tlMatch = str.match(/(?:₺|TL)\s*([\d.,]+)/i) || str.match(/([\d.,]+)\s*(?:₺|TL)/i);
        if (tlMatch) addPrice(parseFloat(tlMatch[1].replace(/\./g, "").replace(",", ".")), "TRY");
        const usdMatch = str.match(/\$\s*([\d.,]+)/) || str.match(/([\d.,]+)\s*USD/i);
        if (usdMatch) addPrice(parseFloat(usdMatch[1].replace(/,/g, "")), "USD");
      }
    }
    (data.shopping_results || []).forEach(collect);
    (data.inline_shopping_results || []).forEach(collect);
    (data.categorized_shopping_results || []).forEach((cat) => (cat.shopping_results || []).forEach(collect));
    const tryStats = cleanPricesMinAvgMax(tryPrices, "TRY");
    const usdStats = cleanPricesMinAvgMax(usdPrices, "USD");
    if (!tryStats.minPrice && !usdStats.minPrice) return null;
    return { TRY: tryStats, USD: usdStats };
  } catch (e) {
    console.warn("SerpAPI fiyat:", e.message);
    return null;
  }
}

export async function getPriceAnalysisWithExa(productDescription) {
  const exaPrices = await getPricesFromExa(productDescription);
  if (!exaPrices) return null;
  const productName = productDescription.trim().slice(0, 200);
  const platforms = [];
  const tryStats = exaPrices.TRY;
  const usdStats = exaPrices.USD;
  for (const { name, currency } of FALLBACK_PLATFORM_NAMES) {
    if (currency === "TRY" && (tryStats.minPrice != null || tryStats.avgPrice != null || tryStats.maxPrice != null)) {
      platforms.push({
        name,
        currency: "TRY",
        minPrice: tryStats.minPrice ?? null,
        avgPrice: tryStats.avgPrice ?? null,
        maxPrice: tryStats.maxPrice ?? null
      });
    } else if (currency === "USD" && (usdStats.minPrice != null || usdStats.avgPrice != null || usdStats.maxPrice != null)) {
      platforms.push({
        name,
        currency: "USD",
        minPrice: usdStats.minPrice ?? null,
        avgPrice: usdStats.avgPrice ?? null,
        maxPrice: usdStats.maxPrice ?? null
      });
    }
  }
  if (platforms.length === 0) return null;
  let summaryText = "";
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const tableDesc = platforms.map((p) => {
        const fmt = (v) => (v == null ? "—" : p.currency === "TRY" ? v.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : v.toLocaleString("en-US", { minimumFractionDigits: 2 }));
        return p.name + ": En düşük " + fmt(p.minPrice) + ", Ortalama " + fmt(p.avgPrice) + ", En yüksek " + fmt(p.maxPrice) + " " + p.currency;
      }).join("\n");
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Ürün: "${productName}". Aşağıdaki fiyat tablosu (Exa arama sonuçlarından) için 2-3 cümle Türkçe özet ve rekabetçi fiyat stratejisi yaz.\n\n${tableDesc}` }]
      });
      summaryText = (res.choices?.[0]?.message?.content || "").trim();
    } catch (e) {
      console.warn("GPT Exa özet:", e.message);
    }
  }
  return {
    productName: productName || "Ürün",
    platforms,
    summaryText: summaryText || "Fiyat verileri Exa arama sonuçlarından derlendi."
  };
}

export async function getPriceAnalysisWithScraperAPI(productDescription) {
  if (!SCRAPERAPI_API_KEY || !productDescription || typeof productDescription !== "string") return null;
  const productName = productDescription.trim().slice(0, 200);
  const words = productName.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, 10);
  const searchQuery = encodeURIComponent(words.join(" "));
  if (!searchQuery) return null;

  const platforms = [];
  try {
    for (const marketplace of PRICE_MARKETPLACES) {
      const targetUrl = marketplace.urlBase + searchQuery;
      const apiUrl = "https://api.scraperapi.com?api_key=" + SCRAPERAPI_API_KEY + "&url=" + encodeURIComponent(targetUrl);
      let html = "";
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch(apiUrl, { method: "GET", signal: AbortSignal.timeout(90000) });
          if (res.ok) html = await res.text();
          if (html && html.length > 500) break;
        } catch (e) {
          if (attempt === maxRetries) console.warn("ScraperAPI " + marketplace.name + ":", e.message);
        }
        if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1500));
      }
      if (!html || html.length < 200) continue;
      const textNoScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const fromText = extractPricesWithCurrency(textNoScripts);
      const fromScripts = extractPricesFromScripts(html, marketplace.currency);
      const extracted = fromText.concat(fromScripts);
      const pricesForCurrency = (extracted.filter(p => p.currency === marketplace.currency)).map(p => p.value);
      const stats = cleanPricesMinAvgMax(pricesForCurrency, marketplace.currency);
      if (stats.count < 1 || (stats.minPrice == null && stats.maxPrice == null)) continue;
      const sellerCount = extractSellerOrResultCount(html) || extractSellerOrResultCount(textNoScripts);
      platforms.push({
        name: marketplace.name,
        currency: marketplace.currency,
        sellerCount: sellerCount != null ? sellerCount : null,
        minPrice: stats.minPrice,
        avgPrice: stats.avgPrice,
        maxPrice: stats.maxPrice,
        sampleCount: stats.count
      });
    }
    if (platforms.length === 0) {
      console.warn("ScraperAPI: hic platformdan veri alinamadi");
      return null;
    }

    const isTurkish = /[\u0130\u0131\u011e\u011f\u00fc\u00f6\u00e7\u015f\u00dc\u00d6\u00c7\u015e]|[ğüşıöçĞÜŞİÖÇ]/i.test(productName);
    const tableDesc = platforms.map(p => {
      const fmt = (v) => v == null ? "—" : (p.currency === "TRY" ? v.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : v.toLocaleString("en-US", { minimumFractionDigits: 2 }));
      return p.name + ": " + (p.sellerCount != null ? p.sellerCount + " satıcı, " : "") + "En düşük " + fmt(p.minPrice) + ", Ortalama " + fmt(p.avgPrice) + ", En yüksek " + fmt(p.maxPrice) + " " + p.currency;
    }).join("\n");
    const prompt = `Ürün: "${productName}". Aşağıdaki rakip analizi tablosu verilerine göre 2-3 cümlelik kısa bir özet ve rekabetçi fiyat stratejisi yaz. Sadece verilen rakamları kullan.\n\n${tableDesc}\n\nCevabı ${isTurkish ? "Türkçe" : "İngilizce"} yaz.`;
    let summaryText = "";
    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const analysisRes = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        });
        summaryText = (analysisRes.choices?.[0]?.message?.content || "").trim();
      } catch (e) {
        console.warn("GPT fiyat özeti:", e.message);
      }
    }
    return {
      productName: productName || "Ürün",
      platforms,
      summaryText: summaryText || "Fiyat verileri yukarıdaki tabloya göre değerlendirilebilir."
    };
  } catch (e) {
    console.warn("ScraperAPI fiyat analizi:", e.message);
    return null;
  }
}

const FALLBACK_PLATFORM_NAMES = [
  { name: "Amazon", currency: "USD" },
  { name: "Amazon Turkey", currency: "TRY" },
  { name: "Etsy", currency: "USD" },
  { name: "Trendyol", currency: "TRY" },
  { name: "Hepsiburada", currency: "TRY" },
  { name: "N11", currency: "TRY" },
  { name: "Ciceksepeti", currency: "TRY" },
  { name: "TikTok Shop", currency: "TRY" },
  { name: "Temu", currency: "USD" }
];

/** Mağaza isimlerini kaldırır; tek satır "Genel Arama" döner (TRY tercihli). */
function toGeneralSearchRow(platforms) {
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return [{ name: "Genel Arama", currency: "TRY", minPrice: null, avgPrice: null, maxPrice: null }];
  }
  const tryRows = platforms.filter((p) => (p.currency || "").toUpperCase() === "TRY");
  const useRows = tryRows.length > 0 ? tryRows : platforms;
  const mins = useRows.map((p) => p.minPrice).filter((v) => v != null && typeof v === "number");
  const maxs = useRows.map((p) => p.maxPrice).filter((v) => v != null && typeof v === "number");
  const avgs = useRows.map((p) => p.avgPrice).filter((v) => v != null && typeof v === "number");
  const currency = tryRows.length > 0 ? "TRY" : (platforms[0]?.currency || "TRY");
  const minPrice = mins.length > 0 ? Math.min(...mins) : null;
  const maxPrice = maxs.length > 0 ? Math.max(...maxs) : null;
  const avgPrice = avgs.length > 0 ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100 : null;
  return [
    {
      name: "Genel Arama",
      currency,
      minPrice: minPrice != null ? Math.round(minPrice * 100) / 100 : null,
      avgPrice,
      maxPrice: maxPrice != null ? Math.round(maxPrice * 100) / 100 : null
    }
  ];
}

function isScraperPlatformValid(p) {
  const min = p.minPrice;
  const max = p.maxPrice;
  const avg = p.avgPrice;
  const limits = CURRENCY_LIMITS[p.currency] || [1, 100000];
  if (min == null && avg == null && max == null) return false;
  const hasMin = min != null && min >= limits[0] && min <= limits[1];
  const hasMax = max != null && max >= limits[0] && max <= limits[1];
  if (!hasMin && !hasMax) return false;
  const lo = min ?? avg ?? max;
  const hi = max ?? avg ?? min;
  if (lo > hi) return false;
  if (hi / lo > 30) return false;
  if (avg != null && min != null && max != null && (avg < min - 0.01 || avg > max + 0.01)) return false;
  return true;
}

const SCRAPER_NAME_TO_TABLE = { "Çiçek Sepeti": "Ciceksepeti" };

function mergePriceSources(scraperResult, exaPrices, serpapiPrices) {
  const scraperMap = new Map();
  if (scraperResult && Array.isArray(scraperResult.platforms)) {
    for (const p of scraperResult.platforms) {
      if (isScraperPlatformValid(p)) {
        scraperMap.set(p.name, p);
        const tableName = SCRAPER_NAME_TO_TABLE[p.name];
        if (tableName) scraperMap.set(tableName, p);
      }
    }
  }
  const fallbackTryValues = [];
  const fallbackUsdValues = [];
  function pushStats(stats, currency) {
    if (!stats) return;
    if (currency === "TRY") {
      if (stats.minPrice != null) fallbackTryValues.push(stats.minPrice);
      if (stats.avgPrice != null) fallbackTryValues.push(stats.avgPrice);
      if (stats.maxPrice != null) fallbackTryValues.push(stats.maxPrice);
    } else {
      if (stats.minPrice != null) fallbackUsdValues.push(stats.minPrice);
      if (stats.avgPrice != null) fallbackUsdValues.push(stats.avgPrice);
      if (stats.maxPrice != null) fallbackUsdValues.push(stats.maxPrice);
    }
  }
  if (exaPrices) {
    pushStats(exaPrices.TRY, "TRY");
    pushStats(exaPrices.USD, "USD");
  }
  if (serpapiPrices) {
    pushStats(serpapiPrices.TRY, "TRY");
    pushStats(serpapiPrices.USD, "USD");
  }
  const fallbackTRY = cleanPricesMinAvgMax(fallbackTryValues, "TRY");
  const fallbackUSD = cleanPricesMinAvgMax(fallbackUsdValues, "USD");

  const platforms = FALLBACK_PLATFORM_NAMES.map(({ name, currency }) => {
    const scraped = scraperMap.get(name);
    if (scraped) {
      return {
        name,
        currency: scraped.currency,
        minPrice: scraped.minPrice ?? null,
        avgPrice: scraped.avgPrice ?? null,
        maxPrice: scraped.maxPrice ?? null
      };
    }
    const fallback = currency === "TRY" ? fallbackTRY : fallbackUSD;
    return {
      name,
      currency,
      minPrice: fallback.minPrice ?? null,
      avgPrice: fallback.avgPrice ?? null,
      maxPrice: fallback.maxPrice ?? null
    };
  });

  const hasAny = platforms.some(p => p.minPrice != null || p.avgPrice != null || p.maxPrice != null);
  if (!hasAny) return null;
  return {
    platforms,
    tryStats: fallbackTRY,
    usdStats: fallbackUSD
  };
}

function mapPipelineResultToLegacy(result) {
  if (!result || !result.price_analysis) return null;
  const id = result.product_identification || {};
  const productName = [id.brand, id.model, id.product_type].filter(Boolean).join(" ").trim() || "Ürün";
  const pa = result.price_analysis;
  const currency = pa.currency || "TRY";
  const platforms = [{
    name: "Google Shopping",
    currency,
    minPrice: pa.min_value ?? null,
    avgPrice: pa.average_value ?? null,
    maxPrice: pa.max_value ?? null
  }];
  const summaryText = [
    pa.median_price && `Medyan fiyat: ${pa.median_price}.`,
    pa.average_price && `Ortalama: ${pa.average_price}.`,
    pa.price_range && `Piyasa aralığı: ${pa.price_range}.`
  ].filter(Boolean).join(" ") + " (Google Shopping verileri, bilgi amaçlıdır.)";
  return { productName, platforms, summaryText, _v2: result };
}

export async function getPriceAnalysisV2(imageUrl, userHint) {
  const { runPricePipeline, runPricePipelineFromText } = await import("./price-pipeline/index.js");
  if (imageUrl && typeof imageUrl === "string") {
    return runPricePipeline(imageUrl, { userHint: (userHint && String(userHint).trim()) || "" });
  }
  const text = (userHint && String(userHint).trim()) || "";
  return runPricePipelineFromText(text);
}

export async function getPriceAnalysisUnified(imageUrl, userText, seoText) {
  const fallbackText = (userText && String(userText).trim()) || (seoText && String(seoText).trim()) || "";
  const productNameFromQuery = fallbackText.slice(0, 200);

  if (process.env.SERPAPI_API_KEY && (imageUrl || fallbackText)) {
    try {
      const { runForEditorTable } = await import("./product-price-analysis/index.js");
      const result = await runForEditorTable(imageUrl || "", fallbackText, { gl: "tr" });
      if (result?.error) {
        return {
          productName: productNameFromQuery || "Ürün",
          platforms: [],
          summaryText: result.message || "",
          error: result.error,
          message: result.message
        };
      }
      const hasAnyPrice = result?.platforms?.some(
        (p) => p.minPrice != null || p.avgPrice != null || p.maxPrice != null
      );
      if (hasAnyPrice && result?.platforms?.length > 0) {
        return {
          productName: result.productName || productNameFromQuery || "Ürün",
          platforms: toGeneralSearchRow(result.platforms),
          summaryText: result.summaryText || ""
        };
      }
    } catch (e) {
      console.warn("Product price analysis:", e.message);
    }
  }

  const productQuery = await getProductQueryFromImageAndText(imageUrl, fallbackText);
  const effectiveQuery = (productQuery && productQuery.trim()) || fallbackText || "ürün";
  const productName = effectiveQuery.slice(0, 200);

  const [scraperResult, exaPrices, serpapiPrices] = await Promise.all([
    getPriceAnalysisWithScraperAPI(effectiveQuery),
    getPricesFromExa(effectiveQuery),
    getPricesFromSerpAPI(effectiveQuery)
  ]);

  let platforms = null;
  const merged = mergePriceSources(
    scraperResult,
    exaPrices,
    serpapiPrices
  );
  if (merged && merged.platforms && merged.platforms.length > 0) {
    platforms = toGeneralSearchRow(merged.platforms);
  }
  if (!platforms || platforms.length === 0) {
    const fallback = await getPriceAnalysisFallbackWithGPT(effectiveQuery);
    if (fallback && fallback.platforms && fallback.platforms.length > 0) {
      return {
        productName: fallback.productName || productName,
        platforms: toGeneralSearchRow(fallback.platforms),
        summaryText: fallback.summaryText || ""
      };
    }
    platforms = toGeneralSearchRow([]);
  }

  let summaryText = "";
  if (process.env.OPENAI_API_KEY && platforms.length > 0) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const tableDesc = platforms.map((p) => {
        const fmt = (v) => (v == null ? "—" : p.currency === "TRY" ? v.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : v.toLocaleString("en-US", { minimumFractionDigits: 2 }));
        return p.name + ": En düşük " + fmt(p.minPrice) + ", Ortalama " + fmt(p.avgPrice) + ", En yüksek " + fmt(p.maxPrice) + " " + p.currency;
      }).join("\n");
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Ürün: "${productName}". Aşağıdaki birleşik fiyat tablosu (pazaryeri, Exa ve Google Alışveriş verilerinden) için 2-4 cümle Türkçe fiyat analizi raporu yaz: piyasa aralığı, rekabetçi strateji, satış fiyatı önerisi değil bilgi amaçlı özet.\n\n${tableDesc}`
        }]
      });
      summaryText = (res.choices?.[0]?.message?.content || "").trim();
    } catch (e) {
      console.warn("GPT birleşik özet:", e.message);
    }
  }
  return {
    productName: productName || "Ürün",
    platforms,
    summaryText: summaryText || "Fiyat verileri tabloya göre değerlendirilebilir."
  };
}

export async function getPriceAnalysisFallbackWithGPT(productDescription) {
  if (!productDescription || typeof productDescription !== "string") return null;
  const productName = productDescription.trim().slice(0, 300);
  if (!productName) return null;
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Sen bir e-ticaret fiyat analisti ve pazar araştırmacısısın. Aşağıdaki ürün/kategori için Türkiye ve Etsy piyasasında GERÇEKÇI fiyat aralıkları üret.

ÜRÜN / KATEGORİ: "${productName}"

YAPMAN GEREKENLER:
1. Bu ürünün hangi kategoriye girdiğini düşün (elektronik, giyim, ev eşyası, kozmetik, gıda takviyesi, hediyelik eşya vb.).
2. Türkiye'de 2024 yılı bu kategorideki TİPİK perakende fiyat aralığını (en ucuz satıcıdan en pahalıya) biliyormuşsun gibi davran. Örnek: kadın deri ceket 800-4500 TL, bluetooth kulaklık 150-1200 TL, makyaj seti 80-600 TL.
3. Her platformun pazar konumunu dikkate al:
   - Amazon TR: geniş yelpaze, orta-üst segment, kampanyalı fiyatlar.
   - Trendyol: Türkiye'de çok yaygın, hem uygun hem premium ürün, indirimli fiyatlar sık.
   - Hepsiburada: benzer Trendyol'a, çok satıcılı, fiyat dağılımı geniş.
   - N11: genelde benzer veya biraz daha uygun fiyatlar, küçük satıcılar.
   - Çiçek Sepeti: çiçek, hediye, özel gün ürünleri ağırlıklı; bu kategoride değilse genel pazar ortalaması kullan.
   - Etsy: ABD/global, el yapımı veya unique ürünler, USD; Türkiye ürünü için USD karşılığı makul band (örn. 15-80 USD).
4. minPrice = piyasadaki en düşük gerçekçi fiyat, avgPrice = ortalama satış fiyatı, maxPrice = premium/özel ürün tarafı. Aralıklar birbirine makul uzaklıkta olsun (min ile max en az %20-30 fark).

ÇIKTI: Sadece aşağıdaki JSON. Başka açıklama yazma. Tüm sayılar sayı (number) olsun.
{"platforms":[{"name":"Amazon","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Trendyol","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Hepsiburada","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"N11","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Çiçek Sepeti","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Etsy","currency":"USD","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi}],"summaryText":"2-4 cümle Türkçe: Bu ürün kategorisinde piyasa aralığı, hangi platformda neden fark olabileceği ve rekabetçi fiyat önerisi (sadece bilgi amaçlı, satış tavsiyesi değil)."}`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Sen e-ticaret fiyat analisti ve pazar araştırmacısısın. Türkiye (TRY) ve Etsy (USD) için gerçekçi, kategorisine uygun fiyat aralıkları üretirsin. Yanıtını sadece geçerli JSON olarak verirsin."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    const raw = (res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || "";
    const parsed = JSON.parse(raw);
    if (!parsed.platforms || !Array.isArray(parsed.platforms) || parsed.platforms.length === 0) return null;
    const platforms = parsed.platforms.map((p) => ({
      name: p.name || "Platform",
      currency: p.currency || "TRY",
      minPrice: typeof p.minPrice === "number" ? Math.round(p.minPrice * 100) / 100 : null,
      avgPrice: typeof p.avgPrice === "number" ? Math.round(p.avgPrice * 100) / 100 : null,
      maxPrice: typeof p.maxPrice === "number" ? Math.round(p.maxPrice * 100) / 100 : null
    }));
    return {
      productName: productName || "Ürün",
      platforms,
      summaryText: (parsed.summaryText && String(parsed.summaryText).trim()) || "Fiyat verileri yukarıdaki tabloya göre değerlendirilebilir."
    };
  } catch (e) {
    console.warn("GPT fiyat fallback:", e.message);
    return null;
  }
}
