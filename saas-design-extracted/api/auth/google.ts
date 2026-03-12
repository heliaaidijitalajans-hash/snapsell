const RAILWAY_BASE = "https://snapsell-production.up.railway.app";

type VercelReq = { method?: string; body?: unknown; headers?: Record<string, string | string[] | undefined> };
type VercelRes = {
  status: (code: number) => { send: (data: string) => void };
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", (req.headers?.origin as string) || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers?.authorization;
  if (auth && typeof auth === "string") headers["Authorization"] = auth;

  const response = await fetch(`${RAILWAY_BASE}/api/auth/google`, {
    method: "POST",
    headers,
    body: JSON.stringify(req.body ?? {}),
  });

  const data = await response.text();
  res.status(response.status).send(data);
}
