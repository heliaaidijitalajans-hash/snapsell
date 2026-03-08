/** Editor status: on Vercel without server.js, allow editor for free (3 uses). With server.js, backend returns real status. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  const authHeader = req.headers.authorization || req.headers["x-session-id"] || null;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Oturum gerekli" });
  }
  res.status(200).json({
    available: true,
    photoRoomAvailable: true,
    pixianAvailable: false,
    needsPublicUrl: false,
    freeEditorUsesRemaining: 3,
    conversions: 3
  });
}
