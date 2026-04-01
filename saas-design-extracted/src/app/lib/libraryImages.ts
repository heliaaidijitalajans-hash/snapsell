import { supabase, isSupabaseConfigured } from "./supabase";

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
