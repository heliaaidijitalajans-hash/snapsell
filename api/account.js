/** Account settings: requires Authorization or X-Session-Id. Returns JSON; 401 when no auth. */
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
    success: true,
    data: {
      email: null,
      displayName: null,
      credits: 30,
      plan: "free",
      conversions: 3,
      totalConversions: 0,
      hasLeonardo: false,
      hasEditor: false,
      planName: "Ücretsiz",
      planFeatures: ["3 dönüşüm", "Temel özellikler"],
      planPrice: "0",
      planPeriod: "ay",
      createdAt: new Date().toISOString()
    }
  });
}
