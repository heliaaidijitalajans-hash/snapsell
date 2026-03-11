/**
 * Image analysis: vision model extracts structured product identification (JSON).
 * @module price-pipeline/image-analysis
 */

import { DEFAULT_IDENTIFICATION } from "./types.js";

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();

const STRUCTURED_PROMPT = `Analyze this product image and return a JSON object with exactly these string fields. Use empty string "" for any field you cannot determine. Do not invent brands or models.

Fields:
- brand: brand name if visible or recognizable, else ""
- model: model name or number if visible, else ""
- product_type: category (e.g. "leather jacket", "wireless earbuds", "makeup palette")
- color: main color(s)
- material: main material if visible (e.g. leather, cotton, plastic)
- condition: "new", "used", "refurbished", or "" if unknown

Return only valid JSON, no other text.`;

/**
 * Extracts structured product identification from an image using a vision model.
 * @param {string} imageUrl - Data URL or URL of the product image
 * @param {string} [userHint] - Optional user text hint (e.g. "women's jacket")
 * @returns {Promise<import("./types.js").ProductIdentification>}
 */
export async function extractProductFromImage(imageUrl, userHint = "") {
  const fallback = { ...DEFAULT_IDENTIFICATION };
  if (!OPENAI_API_KEY) return fallback;
  if (!imageUrl || typeof imageUrl !== "string") return fallback;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const content = [
      {
        type: "text",
        text: userHint
          ? `User hint: "${userHint}". ${STRUCTURED_PROMPT}`
          : STRUCTURED_PROMPT
      },
      { type: "image_url", image_url: { url: imageUrl } }
    ];

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You respond only with valid JSON. No markdown, no explanation."
        },
        { role: "user", content }
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
      material: sanitize(parsed.material),
      condition: sanitize(parsed.condition)
    };
  } catch (e) {
    console.warn("[price-pipeline] image-analysis:", e.message);
    if (userHint) {
      return {
        ...fallback,
        product_type: String(userHint).trim().slice(0, 200)
      };
    }
    return fallback;
  }
}

function sanitize(value) {
  if (value == null) return "";
  const s = String(value).trim();
  return s.slice(0, 200);
}
