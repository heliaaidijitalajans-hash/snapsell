export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      message: "Snapsell API running"
    }
  });
}
