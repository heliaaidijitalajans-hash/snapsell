/** Site plans for pricing page. Frontend expects response.plans array. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(400).json({ success: false, error: "Method not allowed" });
  }
  const plans = [
    { id: "free", name: "Ücretsiz", price: "0", period: "ay", description: "3 dönüşüm, temel özellikler", features: ["3 dönüşüm", "Temel özellikler"], cta: "Ücretsiz başla", href: "/register", highlighted: false, currency: "USD" },
    { id: "monthly_plan", name: "Aylık plan", price: "40", period: "ay", description: "30 dönüşüm", features: ["30 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Başla", href: "/register?plan=monthly_plan", highlighted: true, currency: "USD" },
    { id: "monthly_plan_pro", name: "Aylık plan Pro", price: "65", period: "ay", description: "80 dönüşüm", features: ["80 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Pro'ya geç", href: "/register?plan=monthly_plan_pro", highlighted: false, currency: "USD" },
    { id: "yearly_plan", name: "Yıllık plan", price: "440", period: "yıl", description: "1200 dönüşüm, aylık 100 yüklenecek", features: ["1200 dönüşüm", "Aylık 100 dönüşüm yüklenecek", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Özellik gelişmeleri dahil"], cta: "Yıllık seç", href: "/register?plan=yearly_plan", highlighted: false, currency: "USD" },
    { id: "enterprise", name: "Kurumsal", price: "—", period: "yıl", description: "Bize ulaşın", features: ["Ekibiniz ile takım kurma ayrıcalığı", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Yüklenecek özellik gelişmeleri dahil", "Yıllık faturalandırma"], cta: "Bize ulaşın", href: "/destek", highlighted: false, currency: "USD" },
    { id: "addon", name: "Ek paket", price: "15", period: "ay", description: "25 dönüşüm", features: ["25 dönüşüm", "Tüm özellikler dahil"], cta: "Ek paket al", href: "/register?plan=addon", highlighted: false, currency: "USD" }
  ];
  res.status(200).json({ success: true, plans });
}
