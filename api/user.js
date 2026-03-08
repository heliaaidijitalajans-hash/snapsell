/** User info (alias). Same as /api/me - always JSON. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: "demo-user",
        email: "demo@snapsell.ai"
      }
    }
  });
}
