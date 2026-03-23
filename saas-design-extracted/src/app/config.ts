/** Eski Railway deploy'ları için referans; varsayılan API tabanı artık boş (aynı origin / Vercel). */
const RAILWAY_API_BASE = "https://snapsell-production.up.railway.app";
const envApiBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "").toString().trim().replace(/\/$/, "");

/**
 * API kökü. Boş = tarayıcıda aynı origin (`/api/...` → Vercel veya local).
 * Sadece API başka bir host'taysa `VITE_API_BASE_URL` verin (örn. eski Railway).
 */
const API_BASE_URL = envApiBase;
export { API_BASE_URL, RAILWAY_API_BASE };

/** `fetch(\`\${getApiBase()}/api/...\`)` — boş dönerse istekler mevcut siteye gider (Vercel'de /api gerekli). */
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
