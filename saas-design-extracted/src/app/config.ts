/** Same-origin Vercel API. No config.json or env required. */
export const API_BASE_URL = "/api";

/** Returns "/api" for all fetch calls. No Firebase/backend detection. */
export function getApiBase(): string {
  return "/api";
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
