import { supabase } from "./supabase";

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
    source: "photoroom",
    prompt: prompt || "",
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}
