import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").toString().trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").toString().trim();

/** .env.example veya placeholder değerler — gerçek proje değil sayılır. */
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

/** Gerçek Supabase URL + anon key (Vite build’de gömülür). Örnek metinler geçersiz sayılır. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey) && !looksLikeExampleConfig(supabaseUrl, supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase client: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY eksik veya .env.example placeholder. " +
      "Vercel → Environment Variables → Production + Preview → yeniden Deploy (Vite build sırasında gömülür)."
  );
}

// createClient throws if key is empty; use placeholders so the app can load and show errors instead of a white screen.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "sb-placeholder-not-configured";

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      /** OAuth (Google) dönüşünde URL/hash içindeki oturumu okur */
      detectSessionInUrl: true,
    },
  }
);
