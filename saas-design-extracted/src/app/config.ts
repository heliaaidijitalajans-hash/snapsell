/** API base: "" = same-origin /api/... . Set VITE_API_BASE to backend URL (e.g. https://api.snapsell.website) to use server.js. */
const envBase = typeof import.meta.env !== "undefined" && import.meta.env?.VITE_API_BASE;
export const API_BASE_URL = (typeof envBase === "string" ? envBase.trim() : "") || "";

/** Returns API base: "" for same-origin, or VITE_API_BASE for full backend (server.js). */
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
