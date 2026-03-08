/** User info (alias). Same as /api/me - always JSON, no demo text. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  const sessionId = req.headers["x-session-id"] || req.headers.authorization || null;
  const id = sessionId && typeof sessionId === "string" ? sessionId.slice(0, 32) : null;
  res.status(200).json({
    success: true,
    data: {
      user: { id: id || null, email: null, displayName: null }
    }
  });
}
