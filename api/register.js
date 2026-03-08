export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const authHeader = req.headers.authorization || null;
  const sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);

  res.status(200).json({
    success: true,
    data: {
      sessionId
    },
    sessionId
  });
}
