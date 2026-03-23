import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").toString().trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").toString().trim();

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep startup behavior explicit in development.
  console.warn("Supabase env vars missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
