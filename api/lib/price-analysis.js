/**
 * Fiyat analizi: ScraperAPI ile pazaryerlerinden fiyat çekme + GPT özet.
 * server.js ile aynı mantık (PRICE_MARKETPLACES, extract*, cleanPricesMinAvgMax).
 */

const SCRAPERAPI_API_KEY = (process.env.SCRAPERAPI_API_KEY || process.env.SCRAPER_API_KEY || "").trim();

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
    /"(?:price|amount|currentPrice|minPrice|maxPrice|value|fiyat|birimFiyat|salePrice)"\s*:\s*(\d+(?:[.,]\d+)?)/gi,
    /data-(?:price|amount)="(\d+(?:[.,]\d+)?)"/gi,
    /"price"\s*:\s*\{\s*"value"\s*:\s*(\d+(?:[.,]\d+)?)/gi
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

/**
 * ScraperAPI ile pazaryeri fiyatlarını çeker; GPT ile özet üretir.
 * Dönüş: { productName, platforms: [{ name, currency, sellerCount, minPrice, avgPrice, maxPrice }], summaryText } veya null.
 */
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
      try {
        const res = await fetch(apiUrl, { method: "GET", signal: AbortSignal.timeout(60000) });
        if (res.ok) html = await res.text();
      } catch (e) {
        console.warn("ScraperAPI " + marketplace.name + ":", e.message);
        continue;
      }
      if (!html || html.length < 200) continue;
      const textNoScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const fromText = extractPricesWithCurrency(textNoScripts);
      const fromScripts = extractPricesFromScripts(html, marketplace.currency);
      const extracted = fromText.concat(fromScripts);
      const pricesForCurrency = (extracted.filter(p => p.currency === marketplace.currency)).map(p => p.value);
      const stats = cleanPricesMinAvgMax(pricesForCurrency, marketplace.currency);
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

/** Sabit platform listesi: tabloda her zaman bu platformlar gösterilir. */
const FALLBACK_PLATFORM_NAMES = [
  { name: "Amazon", currency: "TRY" },
  { name: "Trendyol", currency: "TRY" },
  { name: "Hepsiburada", currency: "TRY" },
  { name: "N11", currency: "TRY" },
  { name: "Çiçek Sepeti", currency: "TRY" },
  { name: "Etsy", currency: "USD" }
];

/**
 * ScraperAPI veri dönmediğinde GPT ile platform bazlı min/ort/maks fiyat üretir.
 * Dönüş: { productName, platforms: [{ name, currency, minPrice, avgPrice, maxPrice }], summaryText }
 */
export async function getPriceAnalysisFallbackWithGPT(productDescription) {
  if (!productDescription || typeof productDescription !== "string") return null;
  const productName = productDescription.trim().slice(0, 300);
  if (!productName) return null;
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Ürün veya kategori: "${productName}"

Aşağıdaki pazaryerleri için bu ürün/kategori için gerçekçi piyasa fiyat aralıklarını tahmin et.
Her platform için sadece sayısal min, ortalama ve max fiyat ver (para birimi: TRY veya USD).

Platformlar:
- Amazon (TRY)
- Trendyol (TRY)
- Hepsiburada (TRY)
- N11 (TRY)
- Çiçek Sepeti (TRY)
- Etsy (USD)

Yanıtı SADECE aşağıdaki JSON formatında ver, başka metin yazma:
{"platforms":[{"name":"Amazon","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Trendyol","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Hepsiburada","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"N11","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Çiçek Sepeti","currency":"TRY","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi},{"name":"Etsy","currency":"USD","minPrice":sayi,"avgPrice":sayi,"maxPrice":sayi}],"summaryText":"2-3 cümlelik Türkçe özet ve rekabetçi fiyat stratejisi."}

Fiyatlar gerçekçi olsun: Türkiye pazaryerleri için TL (örn. 50-5000 TL), Etsy için USD (örn. 5-200 USD).`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
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
