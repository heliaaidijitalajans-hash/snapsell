/** Login: always return JSON. No demo placeholder. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  res.status(200).json({
    success: true,
    data: { user: { id: null, email: null, displayName: null } }
  });
}
