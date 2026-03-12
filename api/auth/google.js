/**
 * Vercel serverless: POST /api/auth/google
 * Body: { idToken: string }
 * Proxies to Express backend (API_BASE / BACKEND_URL).
 */
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Use POST with body: { idToken: \"...\" }",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST is supported",
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
  if (!idToken) {
    return res.status(400).json({ error: "idToken gerekli" });
  }

  const backendUrl =
    process.env.API_BASE ||
    process.env.BACKEND_URL ||
    process.env.VITE_API_BASE ||
    "";
  if (!backendUrl || backendUrl.includes("localhost")) {
    return res.status(503).json({
      error: "Backend not configured",
      message: "Set API_BASE or BACKEND_URL in Vercel env to your Express API URL (e.g. https://your-api.railway.app)",
    });
  }

  try {
    const url = `${backendUrl.replace(/\/$/, "")}/api/auth/google`;
    const backendRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await backendRes.json().catch(() => ({ error: "Invalid backend response" }));
    return res.status(backendRes.status).json(data);
  } catch (e) {
    const message = e?.message || String(e);
    console.error("api/auth/google proxy error:", message);
    return res.status(500).json({
      error: "Google auth failed",
      message: "Could not reach backend. Check API_BASE/BACKEND_URL and that the backend is running.",
      detail: message,
    });
  }
}
