import type { GenerationConfig, QualityId } from "./aiConfigContent";

/**
 * Request mapping — ported 1:1 from SnapSell Mobile
 * (`src/services/process/processService.ts`). Turns the AI Configuration into
 * the exact `POST /api/photoroom/pipeline` `{ prompt, photoQuality }` inputs.
 */

export type PhotoQuality = "studio" | "professional" | "luxury";

/** Map quality ids → website `photoQuality` values (identical to mobile). */
export const toPhotoQuality = (quality: QualityId | undefined): PhotoQuality => {
  switch (quality) {
    case "ultra-hd":
      return "luxury";
    case "hd":
      return "professional";
    case "standard":
    default:
      return "studio";
  }
};

/** Same default prompts as `EditorReplicatePage` / mobile. */
export const defaultPromptForQuality = (photoQuality: PhotoQuality): string => {
  if (photoQuality === "luxury") {
    return "luxury product photography, premium lighting, elegant background";
  }
  if (photoQuality === "professional") {
    return "commercial product shot, clean neutral background, professional";
  }
  return "professional product photography, studio lighting, soft daylight";
};

const BACKGROUND_PROMPT: Record<string, string> = {
  "white-studio": "clean white studio backdrop",
  lifestyle: "natural lifestyle setting",
  outdoor: "soft outdoor natural light",
  marble: "elegant marble surface",
  wood: "warm wooden surface",
  gradient: "smooth neutral gradient backdrop",
  "ai-custom": "custom scene",
};

const BRAND_STYLE_PROMPT: Record<string, string> = {
  minimal: "minimal clean aesthetic",
  luxury: "luxury premium brand aesthetic",
  playful: "playful vibrant brand aesthetic",
  vintage: "vintage retro aesthetic",
  modern: "modern contemporary aesthetic",
};

/** Compose pipeline prompt from all AI Configuration options (identical to mobile). */
export const buildPipelinePrompt = (config: GenerationConfig): string => {
  const photoQuality = toPhotoQuality(config.quality);
  const base =
    config.customPrompt?.trim() || defaultPromptForQuality(photoQuality);
  const background =
    BACKGROUND_PROMPT[config.background] || config.background.replace(/-/g, " ");
  const brand =
    BRAND_STYLE_PROMPT[config.brandStyle] ||
    config.brandStyle.replace(/-/g, " ");
  const aspect =
    config.ratio === "1:1"
      ? "square 1:1 composition"
      : config.ratio === "4:5"
        ? "portrait 4:5 marketplace composition"
        : config.ratio === "9:16"
          ? "vertical 9:16 composition"
          : `${config.ratio} aspect ratio`;

  return [
    base,
    `Marketplace: ${config.marketplace}`,
    `Product category: ${config.category.replace(/-/g, " ")}`,
    `Background: ${background}`,
    `Brand style: ${brand}`,
    `Framing: ${aspect}`,
  ].join(". ");
};
