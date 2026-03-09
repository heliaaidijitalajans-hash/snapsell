/** API base: empty = same-origin. Set VITE_API_BASE for external backend (e.g. server.js). */
const API_BASE = import.meta.env.VITE_API_BASE || "";

export const API_BASE_URL = API_BASE;

/** Returns API base so fetch(getApiBase() + "/api/photoroom/pipeline") hits same-origin or custom backend. */
export function getApiBase(): string {
  return API_BASE;
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
