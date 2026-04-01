/**
 * Tarayıcı Supabase istemcisi.
 * Öncelik: import.meta.env.VITE_* → vite.config define ile gelen process.env.SUPABASE_* (build anında dolar).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readSupabaseUrl(): string {
  const v = import.meta.env.VITE_SUPABASE_URL;
  if (v) return String(v).trim();
  if (typeof process !== "undefined" && process.env?.SUPABASE_URL) {
    return String(process.env.SUPABASE_URL).trim();
  }
  return "";
}

function readSupabaseAnonKey(): string {
  const v = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (v) return String(v).trim();
  if (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) {
    return String(process.env.SUPABASE_ANON_KEY).trim();
  }
  return "";
}

const supabaseUrl = readSupabaseUrl();
const supabaseAnonKey = readSupabaseAnonKey();

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
    "[SnapSell] Supabase: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (veya build env SUPABASE_*) eksik veya placeholder. Vercel env + redeploy."
  );
}

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "sb-placeholder-not-configured";

/** Aynı origin’de başka Supabase uygulaması varsa oturum çakışmasını azaltmak için sabit storage anahtarı. */
const AUTH_STORAGE_KEY = "snapsell-supabase-auth";

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
    },
  }
);
