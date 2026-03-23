/**
 * Supabase Auth — tek giriş noktası (signUp / signIn / signOut).
 * Kullanıcı satırı: DB trigger +/veya POST /api/auth/supabase (service role).
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { getApiBase } from "../config";
import { getOAuthRedirectUrl } from "../../lib/authConfig";
import { isNetworkFetchError, supabaseUnreachableMessage } from "./supabaseNetworkError";

export type AuthCredentials = { email: string; password: string };

function notConfiguredError() {
  return {
    data: { user: null, session: null },
    error: new Error(
      "Supabase yapılandırılmadı. Vercel’de VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyip yeniden deploy edin."
    ),
  } as const;
}

function mapAuthResultNetwork<T extends { error: { message?: string } | null }>(result: T): T {
  const msg = result.error?.message || "";
  if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("network")) {
    return { ...result, error: supabaseUnreachableMessage() } as T;
  }
  return result;
}

export async function signUp({ email, password }: AuthCredentials) {
  if (!isSupabaseConfigured) return notConfiguredError();
  const trimmed = email.trim();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  try {
    return mapAuthResultNetwork(
      await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          // Doğrulama e-postasındaki link bu adrese döner (Supabase → URL Configuration ile uyumlu olmalı).
          emailRedirectTo: origin ? `${origin}/login` : undefined,
        },
      })
    );
  } catch (e) {
    if (isNetworkFetchError(e)) {
      return { data: { user: null, session: null }, error: supabaseUnreachableMessage() };
    }
    throw e;
  }
}

export async function signIn({ email, password }: AuthCredentials) {
  if (!isSupabaseConfigured) return notConfiguredError();
  const trimmed = email.trim();
  try {
    return mapAuthResultNetwork(await supabase.auth.signInWithPassword({ email: trimmed, password }));
  } catch (e) {
    if (isNetworkFetchError(e)) {
      return { data: { user: null, session: null }, error: supabaseUnreachableMessage() };
    }
    throw e;
  }
}

export async function signOut() {
  if (!isSupabaseConfigured) return { error: null };
  return supabase.auth.signOut();
}

/**
 * Google OAuth — Supabase Dashboard: Authentication → Providers → Google açık olmalı;
 * URL Configuration’da Site URL ve Redirect URLs’e `https://siteniz.com/**` ekleyin.
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    return { data: { provider: null, url: null }, error: new Error("Supabase yapılandırılmadı (VITE_SUPABASE_*).") };
  }
  const redirectTo = getOAuthRedirectUrl();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: false,
    },
  });
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
