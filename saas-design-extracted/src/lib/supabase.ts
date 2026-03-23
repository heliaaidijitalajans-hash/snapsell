/**
 * Tarayıcı Supabase istemcisi — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (Vite build’de gömülür).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").toString().trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").toString().trim();

function looksLikeExampleConfig(url: string, key: string): boolean {
  const u = url.toLowerCase();
  const k = key.toLowerCase();
  if (!url || !key) return true;
  if (u.includes("your-project") || u.includes("placeholder") || u.includes("example.com")) return true;
  if (k === "your_anon_key" || k.includes("placeholder") || k.includes("your_anon")) return true;
  if (k.length < 20) return true;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "placeholder.supabase.co") return true;
  } catch {
    return true;
  }
  return false;
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey) && !looksLikeExampleConfig(supabaseUrl, supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[SnapSell] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY eksik veya placeholder. Vercel env + redeploy gerekir."
  );
}

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "sb-placeholder-not-configured";

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
