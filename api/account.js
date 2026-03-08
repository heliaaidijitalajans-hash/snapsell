/** Placeholder so /api/account always returns JSON on Vercel (full backend in server.js). */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  const authHeader = req.headers.authorization || null;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Oturum gerekli" });
  }
  res.status(503).json({
    success: false,
    error: "Account endpoint requires full backend. Deploy server.js or set BACKEND_URL."
  });
}
