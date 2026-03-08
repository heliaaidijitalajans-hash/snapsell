/** API base URL: empty = same-origin only. All calls use fetch("/api/..."). No Railway or external backend. */
const API_BASE_URL = "";

/** API base URL. Always "" so fetch("/api/...") is used everywhere. */
export function getApiBase(): string {
  return API_BASE_URL;
}

/** No-op; kept for compatibility. API base is always same-origin. */
export function setApiBaseFromConfig(_url: string): void {}

/** Parse JSON from response; if server returned HTML (wrong host), throw a clear error. */
export async function apiJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (ct.includes("text/html") || text.trimStart().startsWith("<!")) {
    throw new Error(
      "API_ADRESI_YOK"
    );
  }
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Geçersiz API yanıtı.");
  }
}
