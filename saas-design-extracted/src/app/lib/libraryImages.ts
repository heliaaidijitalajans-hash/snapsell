import { supabase, isSupabaseConfigured } from "./supabase";
import type { PriceAnalysisViewFields } from "../services/price/priceTypes";
import type { GenerationConfig } from "../services/aiConfig/aiConfigContent";

/**
 * Converts a data URL (e.g. data:image/png;base64,...) to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = (header.match(/data:([^;]+)/) || [])[1] || "image/png";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export type StoredGenerationConfig = {
  marketplace?: string | null;
  category?: string | null;
  background?: string | null;
  ratio?: string | null;
  quality?: string | null;
  brandStyle?: string | null;
  customPrompt?: string | null;
};

export type LibrarySession = {
  id: string;
  imageUrl: string;
  originalImageUrl: string | null;
  createdAt: string | null;
  source: string;
  prompt: string;
  seoDescription: string;
  config: StoredGenerationConfig | null;
  priceAnalysis: PriceAnalysisViewFields | null;
  metadata: Record<string, unknown> | null;
};

function mapSessionRow(row: Record<string, unknown>): LibrarySession {
  const config =
    row.config && typeof row.config === "object" && !Array.isArray(row.config)
      ? (row.config as StoredGenerationConfig)
      : null;
  const priceAnalysis =
    row.price_analysis && typeof row.price_analysis === "object" && !Array.isArray(row.price_analysis)
      ? (row.price_analysis as PriceAnalysisViewFields)
      : null;
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;
  return {
    id: String(row.id || ""),
    imageUrl: String(row.image_url || ""),
    originalImageUrl: row.original_image_url ? String(row.original_image_url) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    source: row.source ? String(row.source) : "",
    prompt: row.prompt ? String(row.prompt) : "",
    seoDescription: row.seo_description ? String(row.seo_description) : "",
    config,
    priceAnalysis,
    metadata,
  };
}

/**
 * Uploads processed image to Supabase Storage and records metadata.
 */
export async function saveGeneratedImageToLibrary(
  userId: string,
  imageDataUrl: string,
  prompt: string
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn("saveGeneratedImageToLibrary: Supabase VITE_* env eksik.");
    return null;
  }
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}.png`;

  const blob = dataUrlToBlob(imageDataUrl);
  const { error: uploadErr } = await supabase.storage
    .from("generated-images")
    .upload(path, blob, { contentType: "image/png", upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: publicUrlData } = supabase.storage
    .from("generated-images")
    .getPublicUrl(path);
  const downloadURL = publicUrlData.publicUrl;

  const { data, error } = await supabase.from("images").insert({
    user_id: userId,
    image_url: downloadURL,
    created_at: new Date().toISOString(),
    source: "editor",
    prompt: prompt || "",
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

/**
 * PhotoRoom / pipeline çıktısı HTTP URL olduğunda (çoğu dönüşüm); tarayıcıdan indirip Storage'a yükler.
 */
export async function saveRemoteImageToLibrary(
  userId: string,
  imageHttpUrl: string,
  prompt: string
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn("saveRemoteImageToLibrary: Supabase VITE_* env eksik.");
    return null;
  }
  const url = String(imageHttpUrl || "").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;

  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) {
    throw new Error(`Görsel indirilemedi (${res.status})`);
  }
  const blob = await res.blob();
  if (!blob.size) throw new Error("Boş görsel yanıtı");

  const timestamp = Date.now();
  const ext = blob.type.includes("jpeg") || blob.type.includes("jpg") ? "jpg" : "png";
  const path = `${userId}/${timestamp}.${ext}`;
  const contentType = blob.type || (ext === "jpg" ? "image/jpeg" : "image/png");

  const { error: uploadErr } = await supabase.storage
    .from("generated-images")
    .upload(path, blob, { contentType, upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: publicUrlData } = supabase.storage.from("generated-images").getPublicUrl(path);
  const downloadURL = publicUrlData.publicUrl;

  const { data, error } = await supabase
    .from("images")
    .insert({
      user_id: userId,
      image_url: downloadURL,
      created_at: new Date().toISOString(),
      source: "editor",
      prompt: prompt || "",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id || null;
}

export function toStoredGenerationConfig(config: GenerationConfig): StoredGenerationConfig {
  return {
    marketplace: config.marketplace,
    category: config.category,
    background: config.background,
    ratio: config.ratio,
    quality: config.quality,
    brandStyle: config.brandStyle,
    customPrompt: config.customPrompt,
  };
}

/** Persist first Price Analysis result — never overwrite an existing cache. */
export async function savePriceAnalysisToLibrary(
  imageId: string,
  priceAnalysis: PriceAnalysisViewFields
): Promise<boolean> {
  if (!isSupabaseConfigured || !imageId) return false;
  const { data: existing, error: readErr } = await supabase
    .from("images")
    .select("id, price_analysis")
    .eq("id", imageId)
    .maybeSingle();
  if (readErr) {
    console.warn("savePriceAnalysisToLibrary read:", readErr.message);
    return false;
  }
  if (!existing) return false;
  if (existing.price_analysis) return true;

  const { error } = await supabase
    .from("images")
    .update({ price_analysis: priceAnalysis })
    .eq("id", imageId)
    .is("price_analysis", null);
  if (error) {
    // Column may not exist until migration 008.
    console.warn("savePriceAnalysisToLibrary update:", error.message);
    return false;
  }
  return true;
}

export async function fetchLibrarySession(
  imageId: string,
  userId: string
): Promise<LibrarySession | null> {
  if (!isSupabaseConfigured || !imageId || !userId) return null;

  const full = await supabase
    .from("images")
    .select(
      "id, image_url, created_at, source, prompt, original_image_url, seo_description, config, price_analysis, metadata"
    )
    .eq("id", imageId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error && full.data) {
    return mapSessionRow(full.data as Record<string, unknown>);
  }

  // Fallback for DBs that have not run migration 008 yet.
  const minimal = await supabase
    .from("images")
    .select("id, image_url, created_at, source, prompt")
    .eq("id", imageId)
    .eq("user_id", userId)
    .maybeSingle();
  if (minimal.error || !minimal.data) {
    console.warn("fetchLibrarySession:", full.error?.message || minimal.error?.message);
    return null;
  }
  return mapSessionRow(minimal.data as Record<string, unknown>);
}
