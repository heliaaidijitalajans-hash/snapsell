/** Editor status: always return 200 with editor available so the page opens. Auth not required here; pipeline enforces it. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
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
