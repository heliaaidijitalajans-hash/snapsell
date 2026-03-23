/**
 * Supabase Auth — tek giriş noktası (signUp / signIn / signOut).
 * Kullanıcı satırı: DB trigger +/veya POST /api/auth/supabase (service role).
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { getApiBase } from "../config";

export type AuthCredentials = { email: string; password: string };

function notConfiguredError() {
  return {
    data: { user: null, session: null },
    error: new Error(
      "Supabase yapılandırılmadı. Vercel’de VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyip yeniden deploy edin."
    ),
  } as const;
}

export async function signUp({ email, password }: AuthCredentials) {
  if (!isSupabaseConfigured) return notConfiguredError();
  const trimmed = email.trim();
  return supabase.auth.signUp({ email: trimmed, password });
}

export async function signIn({ email, password }: AuthCredentials) {
  if (!isSupabaseConfigured) return notConfiguredError();
  const trimmed = email.trim();
  return supabase.auth.signInWithPassword({ email: trimmed, password });
}

export async function signOut() {
  if (!isSupabaseConfigured) return { error: null };
  return supabase.auth.signOut();
}

/**
 * Oturum varsa backend'de public.users satırını oluşturur/günceller (plan, kredi).
 * E-posta onayı açıksa session gelmeyebilir; o zaman trigger (005 migration) devrededir.
 */
export async function syncUserRowWithBackend(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  const res = await fetch(`${getApiBase()}/api/auth/supabase`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Auth sync failed: ${res.status}`);
  }
}
