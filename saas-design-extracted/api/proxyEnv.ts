/**
 * Vercel serverless → Railway (veya başka) API kökü. Repoda sabit host tutulmaz.
 * Vercel’de: API_PROXY_TARGET veya VITE_API_BASE_URL (sonda / olmadan).
 */
export function getApiProxyTarget(): string {
  const raw =
    (typeof process !== "undefined" && process.env?.API_PROXY_TARGET) ||
    (typeof process !== "undefined" && process.env?.VITE_API_BASE_URL) ||
    "";
  return String(raw).replace(/\/$/, "").trim();
}
