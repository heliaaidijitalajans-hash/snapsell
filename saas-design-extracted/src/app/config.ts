const envApiBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "").toString().trim().replace(/\/$/, "");

/** Base URL for API – build sırasında .env'deki VITE_API_BASE_URL kullanılır (Vercel'de de tanımlayın). */
const API_BASE_URL = envApiBase;
export { API_BASE_URL };

/** Returns full API base URL for fetch( getApiBase() + "/api/..." ). */
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
