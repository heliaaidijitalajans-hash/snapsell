/** Placeholder so /api/plans always returns JSON on Vercel (full backend in server.js). */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  res.status(200).json({
    success: true,
    data: []
  });
}
