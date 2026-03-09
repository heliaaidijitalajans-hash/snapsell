/** Same-origin API. All requests go to Vercel serverless /api/*. No external server.js. */
const API_BASE = "/api";

export const API_BASE_URL = API_BASE;

/** Returns "/api" so fetch(getApiBase() + "/photoroom/pipeline") hits /api/photoroom/pipeline. */
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
