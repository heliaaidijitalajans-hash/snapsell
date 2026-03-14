const RAILWAY_API_BASE = "https://snapsell-production.up.railway.app";
const envApiBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "").toString().trim().replace(/\/$/, "");

/** Base URL for API – env'de yoksa Railway kullanılır (SEO ve pipeline istekleri her zaman backend'e gitsin). */
const API_BASE_URL = envApiBase || RAILWAY_API_BASE;
export { API_BASE_URL, RAILWAY_API_BASE };

/** Returns full API base URL for fetch( getApiBase() + "/api/..." ). API istekleri Railway'e gider. */
export function getApiBase(): string {
  return API_BASE_URL;
}

/** Parse JSON from response. Returns {} for empty/non-JSON; throws only for HTML (wrong host). */
export async function apiJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (ct.includes("text/html") || text.trimStart().startsWith("<!")) {
    throw new Error("Invalid API response");
  }
  if (!text || !text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
