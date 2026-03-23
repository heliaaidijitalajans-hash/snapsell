import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").toString().trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").toString().trim();

/** True when real Supabase URL + anon key are set (Vite embeds VITE_* at build time). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase env vars missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Add them in Vercel (or .env) and redeploy — Vite bakes them in at build time."
  );
}

// createClient throws if key is empty; use placeholders so the app can load and show errors instead of a white screen.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "sb-placeholder-not-configured";

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true },
  }
);
