/** Vercel serverless API base. All fetch calls use getApiBase() + path (e.g. /api/health). */
export const API_BASE_URL = "/api";

/** API base URL for fetch. Use: fetch(getApiBase() + "/health") */
export function getApiBase(): string {
  return API_BASE_URL;
}

/** No-op; kept for compatibility. Default is /api. */
export function setApiBaseFromConfig(_url: string): void {}

/** Parse JSON from response; if server returned HTML, throw generic error. */
export async function apiJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (ct.includes("text/html") || text.trimStart().startsWith("<!")) {
    throw new Error("Invalid API response");
  }
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Geçersiz API yanıtı.");
  }
}
