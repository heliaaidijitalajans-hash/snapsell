const buildTimeBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof window !== "undefined" ? window.location.origin : "");

let runtimeOverride: string | null = null;

/** Set API base from runtime config (e.g. /config.json). Call before any fetch. */
export function setApiBaseFromConfig(url: string): void {
  const u = (url || "").trim().replace(/\/$/, "");
  if (u) runtimeOverride = u;
}

/** Backend API base URL. Use this everywhere. Respects config.json and VITE_API_URL. */
export function getApiBase(): string {
  return runtimeOverride || buildTimeBase;
}

/** @deprecated Use getApiBase() so config.json is applied. */
export const API_BASE = buildTimeBase;

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
