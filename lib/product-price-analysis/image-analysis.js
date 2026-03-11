/**
 * Image analysis: vision model extracts product data (brand, model, product_type, color, category).
 * @module product-price-analysis/image-analysis
 */

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();

const DEFAULT_PRODUCT = Object.freeze({
  brand: "",
  model: "",
  product_type: "",
  color: "",
  category: ""
});

const PROMPT = `Analyze this product image and return a JSON object with exactly these string fields. Use empty string "" for any field you cannot determine. Do not invent brands or models.

Fields:
- brand: brand name if visible or recognizable, else ""
- model: model name or product number if visible, else ""
- product_type: type of product (e.g. "sneakers", "leather jacket", "wireless earbuds")
- color: main color(s)
- category: product category (e.g. "footwear", "apparel", "electronics")

Return only valid JSON, no other text.`;

/**
 * Extracts product data from an image using a vision model.
 * @param {string} imageUrl - Data URL or URL of the product image
 * @param {string} [userHint] - Optional hint (e.g. "Nike sneakers")
 * @returns {Promise<import("./types.js").Product>}
 */
export async function analyzeProductImage(imageUrl, userHint = "") {
  const fallback = { ...DEFAULT_PRODUCT };
  if (!OPENAI_API_KEY || !imageUrl || typeof imageUrl !== "string") return fallback;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const text = userHint
      ? `User hint: "${userHint}". ${PROMPT}`
      : PROMPT;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You respond only with valid JSON. No markdown, no explanation." },
        { role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: imageUrl } }] }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300
    });

    const raw = (res.choices?.[0]?.message?.content || "").trim();
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return {
      brand: sanitize(parsed.brand),
      model: sanitize(parsed.model),
      product_type: sanitize(parsed.product_type),
      color: sanitize(parsed.color),
      category: sanitize(parsed.category)
    };
  } catch (e) {
    console.warn("[product-price-analysis] image-analysis:", e.message);
    if (userHint) {
      return { ...fallback, product_type: String(userHint).trim().slice(0, 200) };
    }
    return fallback;
  }
}

function sanitize(value) {
  if (value == null) return "";
  return String(value).trim().slice(0, 200);
}
