import { useCallback, useMemo, useState } from "react";

import {
  CUSTOM_BACKGROUND_ID,
  MIN_CUSTOM_PROMPT,
  REQUIRED_SELECTION_KEYS,
  type BackgroundId,
  type BrandStyleId,
  type CategoryId,
  type GenerationConfig,
  type MarketplaceId,
  type QualityId,
  type RatioId,
} from "../services/aiConfig/aiConfigContent";

export type AiConfigFormValues = {
  marketplace: MarketplaceId | null;
  category: CategoryId | null;
  background: BackgroundId | null;
  ratio: RatioId | null;
  quality: QualityId | null;
  brandStyle: BrandStyleId | null;
  customPrompt: string;
};

export type AiConfigFieldName = keyof Omit<AiConfigFormValues, "customPrompt">;

const DEFAULT_VALUES: AiConfigFormValues = {
  marketplace: null,
  category: null,
  background: null,
  ratio: null,
  quality: null,
  brandStyle: null,
  customPrompt: "",
};

const isConfigComplete = (values: AiConfigFormValues): boolean => {
  const allSelected = REQUIRED_SELECTION_KEYS.every(
    (key) => values[key] != null,
  );
  if (!allSelected) {
    return false;
  }
  return (
    values.background !== CUSTOM_BACKGROUND_ID ||
    values.customPrompt.trim().length >= MIN_CUSTOM_PROMPT
  );
};

const toGenerationConfig = (
  values: AiConfigFormValues,
  imageUri: string,
): GenerationConfig | null => {
  const { marketplace, category, background, ratio, quality, brandStyle } =
    values;
  if (
    marketplace === null ||
    category === null ||
    background === null ||
    ratio === null ||
    quality === null ||
    brandStyle === null
  ) {
    return null;
  }
  return {
    imageUri,
    marketplace,
    category,
    background,
    ratio,
    quality,
    brandStyle,
    customPrompt:
      background === CUSTOM_BACKGROUND_ID ? values.customPrompt.trim() : null,
  };
};

/**
 * Website port of SnapSell Mobile `useAiConfiguration` — empty-by-default,
 * every section required, a `canGenerate` gate (all options chosen + a custom
 * prompt when the AI-custom background is picked), and a `buildConfig` that
 * produces the fully-resolved `GenerationConfig`. Same rules, no UI concerns.
 */
export const useAiConfiguration = () => {
  const [values, setValues] = useState<AiConfigFormValues>(DEFAULT_VALUES);

  const select = useCallback((name: AiConfigFieldName, id: string) => {
    setValues((prev) => ({ ...prev, [name]: id }));
  }, []);

  const setCustomPrompt = useCallback((customPrompt: string) => {
    setValues((prev) => ({ ...prev, customPrompt }));
  }, []);

  const reset = useCallback(() => setValues(DEFAULT_VALUES), []);

  const isCustomBackground = values.background === CUSTOM_BACKGROUND_ID;
  const canGenerate = useMemo(() => isConfigComplete(values), [values]);

  const buildConfig = useCallback(
    (imageUri: string) => toGenerationConfig(values, imageUri),
    [values],
  );

  return {
    values,
    select,
    setCustomPrompt,
    reset,
    isCustomBackground,
    canGenerate,
    buildConfig,
  };
};
