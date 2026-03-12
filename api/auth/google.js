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

  try {
    const idToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
    if (!idToken) {
      return res.status(400).json({ error: "idToken gerekli" });
    }

    const backendUrl =
      process.env.API_BASE ||
      process.env.BACKEND_URL ||
      process.env.VITE_API_BASE ||
      "http://localhost:3006";
    const url = `${backendUrl.replace(/\/$/, "")}/api/auth/google`;

    const backendRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await backendRes.json().catch(() => ({}));
    res.status(backendRes.status).json(data);
  } catch (e) {
    const message = e?.message || "Server error";
    res.status(500).json({ error: "Google auth failed", message });
  }
}
