/** Placeholder on Vercel: real pipeline runs on server.js. Set VITE_API_BASE to your backend URL so the app calls it instead. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  const authHeader = req.headers.authorization || req.headers["x-session-id"] || null;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Oturum gerekli" });
  }
  res.status(503).json({
    success: false,
    error: "Görsel işleme sunucusu bu ortamda çalışmıyor. Backend (server.js) adresini VITE_API_BASE ile ayarlayın veya backend'i aynı domain'e deploy edin.",
    upgradeUrl: "/fiyatlandirma",
    code: "BACKEND_REQUIRED"
  });
}
