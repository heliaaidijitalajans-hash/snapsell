const RAILWAY_BASE = "https://snapsell-production.up.railway.app";

export default async function handler(
  req: { method?: string; query: { path?: string | string[] }; body?: unknown; headers?: Record<string, string | string[] | undefined } },
  res: { status: (code: number) => { send: (data: string) => void }; setHeader: (name: string, value: string) => void; end?: () => void }
) {
  // Preflight: respond immediately so browser gets 2xx (avoids 405 from platform or Railway)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers?.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).send("");
    return;
  }

  const pathSegments = req.query?.path;
  const path = Array.isArray(pathSegments) ? pathSegments.join("/") : (pathSegments || "");
  const url = `${RAILWAY_BASE}/api/${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = req.headers?.authorization;
  if (auth && typeof auth === "string") headers["Authorization"] = auth;
  const sid = req.headers?.["x-session-id"];
  if (sid && typeof sid === "string") headers["X-Session-Id"] = sid;

  const response = await fetch(url, {
    method: req.method || "GET",
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body ?? {}) : undefined,
  });

  const data = await response.text();
  res.status(response.status).send(data);
}
