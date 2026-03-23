/**
 * Google OAuth dönüş — Supabase Dashboard → Redirect URLs ile birebir aynı olmalı.
 * Production: https://snapsell.website/hesap-ayarlari
 */
export const OAUTH_REDIRECT_PRODUCTION = "https://snapsell.website/hesap-ayarlari";

export function getOAuthRedirectUrl(): string {
  const fromEnv = (import.meta.env.VITE_AUTH_REDIRECT_URL || "").toString().trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return `${window.location.origin}/hesap-ayarlari`;
    }
  }
  return OAUTH_REDIRECT_PRODUCTION;
}

/** Dev veya VITE_DEBUG_AUTH=true iken auth logları */
export function isAuthDebug(): boolean {
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === "true");
}

export function authLog(...args: unknown[]): void {
  if (isAuthDebug()) console.log("[SnapSell Auth]", ...args);
}
