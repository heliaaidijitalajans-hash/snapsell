/**
 * OAuth dönüş URL’si — Supabase Dashboard → Redirect URLs’e aynısı eklenmeli.
 * Örn: https://snapsell.website/hesap-ayarlari
 */
export function getOAuthRedirectUrl(): string {
  const fromEnv = (import.meta.env.VITE_AUTH_REDIRECT_URL || "").toString().trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/hesap-ayarlari`;
  }
  return "https://snapsell.website/hesap-ayarlari";
}

/** Dev veya VITE_DEBUG_AUTH=true iken auth logları */
export function isAuthDebug(): boolean {
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === "true");
}

export function authLog(...args: unknown[]): void {
  if (isAuthDebug()) console.log("[SnapSell Auth]", ...args);
}
