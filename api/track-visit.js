/** Placeholder so /api/track-visit always returns JSON on Vercel (no HTML). */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  res.status(200).json({ success: true, data: null });
}
