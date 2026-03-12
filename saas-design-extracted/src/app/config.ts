const envApiBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "").toString().replace(/\/$/, "");

function isSnapsellWebsite(): boolean {
  if (typeof window === "undefined" || !window.location?.hostname) return false;
  const h = window.location.hostname.toLowerCase();
  return h === "snapsell.website" || h === "www.snapsell.website";
}

/** Base URL for API. On snapsell.website we always use same-origin /api (proxy) to avoid CORS. */
const API_BASE_URL = "";
export { API_BASE_URL };

/** Returns full API base URL for fetch( getApiBase() + "/api/..." ). On snapsell.website always "" = same-origin /api. */
export function getApiBase(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const h = window.location.hostname.toLowerCase();
    if (h === "snapsell.website" || h === "www.snapsell.website") return "";
  }
  return envApiBase;
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
