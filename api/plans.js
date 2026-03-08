/** Pricing plans for Vercel. Full backend uses server.js /api/plans or /api/site-plans. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  const plans = [
    { id: "free", name: "Ücretsiz", price: "0", period: "ay", credits: 30, description: "3 dönüşüm, temel özellikler", features: ["3 dönüşüm", "Temel özellikler"], cta: "Ücretsiz başla", href: "/register", highlighted: false },
    { id: "monthly_plan", name: "Aylık plan", price: "40", period: "ay", credits: 300, description: "30 dönüşüm", features: ["30 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Başla", href: "/register?plan=monthly_plan", highlighted: true },
    { id: "monthly_plan_pro", name: "Aylık plan Pro", price: "65", period: "ay", credits: 800, description: "80 dönüşüm", features: ["80 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Pro'ya geç", href: "/register?plan=monthly_plan_pro", highlighted: false },
    { id: "yearly_plan", name: "Yıllık plan", price: "440", period: "yıl", credits: 12000, description: "1200 dönüşüm, aylık 100 yüklenecek", features: ["1200 dönüşüm", "Aylık 100 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Yıllık seç", href: "/register?plan=yearly_plan", highlighted: false },
    { id: "enterprise", name: "Kurumsal", price: "—", period: "yıl", credits: 0, description: "Bize ulaşın", features: ["Ekibiniz ile takım kurma", "Tüm özellikler", "Yıllık faturalandırma"], cta: "Bize ulaşın", href: "/destek", highlighted: false },
    { id: "addon", name: "Ek paket", price: "15", period: "ay", credits: 250, description: "25 dönüşüm", features: ["25 dönüşüm", "Tüm özellikler dahil"], cta: "Ek paket al", href: "/register?plan=addon", highlighted: false }
  ];
  res.status(200).json({ success: true, plans });
}
