/** Login placeholder: always return JSON. Temporarily bypass verification. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  res.status(200).json({
    success: true,
    data: {
      user: { id: "demo-user", email: "demo@snapsell.ai" }
    }
  });
}
