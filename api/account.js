/** Account settings. Temporarily bypass verification: if any auth header present, return demo JSON so UI loads. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  const authHeader = req.headers.authorization || req.headers["x-session-id"] || null;
  if (!authHeader) {
    return res.status(400).json({ success: false, error: "Oturum gerekli" });
  }
  res.status(200).json({
    success: true,
    data: {
      email: "demo@snapsell.ai",
      displayName: "Demo User",
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
