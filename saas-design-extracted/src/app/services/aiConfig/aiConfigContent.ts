/**
 * AI Configuration option content — ported 1:1 from SnapSell Mobile
 * (`src/screens/AiConfiguration/aiConfig.content.ts`).
 * Ids are stable and language-independent; labels are resolved from i18n.
 */

export type ConfigOption = {
  id: string;
  label: string;
};

/* Section 1 — Marketplace */
export const MARKETPLACE_IDS = [
  "etsy",
  "amazon",
  "shopify",
  "tiktok-shop",
  "temu",
  "ebay",
  "trendyol",
  "hepsiburada",
  "n11",
] as const;
export type MarketplaceId = (typeof MARKETPLACE_IDS)[number];

/* Section 2 — Product Category */
export const CATEGORY_IDS = [
  "fashion",
  "jewelry",
  "beauty",
  "electronics",
  "furniture",
  "kitchen",
  "food",
  "handmade",
  "toys",
  "other",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/* Section 3 — Background Style */
export const BACKGROUND_IDS = [
  "white-studio",
  "luxury",
  "wood",
  "marble",
  "lifestyle",
  "kitchen",
  "outdoor",
  "transparent",
  "ai-custom",
] as const;
export type BackgroundId = (typeof BACKGROUND_IDS)[number];
export const CUSTOM_BACKGROUND_ID: BackgroundId = "ai-custom";

/* Section 4 — Image Ratio (values are language-independent) */
export const RATIO_IDS = ["1:1", "4:5", "3:4", "16:9", "9:16"] as const;
export type RatioId = (typeof RATIO_IDS)[number];
export const RATIOS: readonly ConfigOption[] = RATIO_IDS.map((id) => ({
  id,
  label: id,
}));

/* Section 5 — Quality */
export const QUALITY_IDS = ["standard", "hd", "ultra-hd"] as const;
export type QualityId = (typeof QUALITY_IDS)[number];

/* Section 6 — Brand Style */
export const BRAND_STYLE_IDS = [
  "minimal",
  "bold",
  "elegant",
  "playful",
  "luxury",
  "modern",
] as const;
export type BrandStyleId = (typeof BRAND_STYLE_IDS)[number];

/** Minimum custom-background prompt length (mirrors mobile schema). */
export const MIN_CUSTOM_PROMPT = 4;

export const REQUIRED_SELECTION_KEYS = [
  "marketplace",
  "category",
  "background",
  "ratio",
  "quality",
  "brandStyle",
] as const;

/**
 * Fully-resolved configuration for a single transformation.
 * Ported from `src/screens/AiConfiguration/aiConfig.types.ts`.
 */
export type GenerationConfig = {
  imageUri: string;
  marketplace: MarketplaceId;
  category: CategoryId;
  background: BackgroundId;
  ratio: RatioId;
  quality: QualityId;
  brandStyle: BrandStyleId;
  customPrompt: string | null;
};
