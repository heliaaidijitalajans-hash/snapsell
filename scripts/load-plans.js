#!/usr/bin/env node
/**
 * Planları sisteme işler: data/site-plans.json ve data/plan-prices.json oluşturur.
 * Kullanım:
 *   node scripts/load-plans.js              # Varsayılan planları yazar
 *   node scripts/load-plans.js plans.json    # Özel JSON dosyasındaki planları yazar
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DEFAULT_SITE_PLANS = [
  { id: "free", name: "Ücretsiz", price: "0", period: "ay", description: "3 dönüşüm, temel özellikler", features: ["3 dönüşüm", "Temel özellikler"], cta: "Ücretsiz başla", href: "/register", highlighted: false, planType: "conversion", credits: 30 },
  { id: "monthly_plan", name: "Aylık plan", price: "40", period: "ay", description: "30 dönüşüm", features: ["30 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Başla", href: "/register?plan=monthly_plan", highlighted: true, planType: "conversion", credits: 300 },
  { id: "monthly_plan_pro", name: "Aylık plan Pro", price: "65", period: "ay", description: "80 dönüşüm", features: ["80 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Pro'ya geç", href: "/register?plan=monthly_plan_pro", highlighted: false, planType: "conversion", credits: 800 },
  { id: "yearly_plan", name: "Yıllık plan", price: "440", period: "yıl", description: "1200 dönüşüm, aylık 100 yüklenecek", features: ["1200 dönüşüm", "Aylık 100 dönüşüm yüklenecek", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Özellik gelişmeleri dahil"], cta: "Yıllık seç", href: "/register?plan=yearly_plan", highlighted: false, planType: "conversion", credits: 12000 },
  { id: "enterprise", name: "Kurumsal", price: "—", period: "yıl", description: "Bize ulaşın", features: ["Ekibiniz ile takım kurma ayrıcalığı", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Yüklenecek özellik gelişmeleri dahil", "Yıllık faturalandırma"], cta: "Bize ulaşın", href: "/destek", highlighted: false, planType: "conversion", credits: 0 },
  { id: "addon", name: "Ek paket", price: "15", period: "ay", description: "25 dönüşüm", features: ["25 dönüşüm", "Tüm özellikler dahil"], cta: "Ek paket al", href: "/register?plan=addon", highlighted: false, planType: "addon", credits: 250 }
];
const DEFAULT_PLAN_PRICES = { free: 0, monthly_plan: 40, monthly_plan_pro: 65, yearly_plan: 440, enterprise: 0, addon: 15 };

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("data/ klasörü oluşturuldu.");
  }
}

function loadPlans() {
  const customPath = process.argv[2];
  if (customPath) {
    const abs = path.isAbsolute(customPath) ? customPath : path.join(process.cwd(), customPath);
    if (fs.existsSync(abs)) {
      const raw = fs.readFileSync(abs, "utf8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : (data.plans || data.sitePlans || DEFAULT_SITE_PLANS);
    }
    console.warn("Dosya bulunamadı:", abs, "- varsayılan planlar kullanılıyor.");
  }
  return DEFAULT_SITE_PLANS;
}

ensureDataDir();
const plans = loadPlans();
const sitePlansPath = path.join(DATA_DIR, "site-plans.json");
const planPricesPath = path.join(DATA_DIR, "plan-prices.json");

fs.writeFileSync(sitePlansPath, JSON.stringify(plans, null, 2), "utf8");
console.log("Yazıldı:", sitePlansPath, "(" + plans.length + " plan)");

const prices = { ...DEFAULT_PLAN_PRICES };
plans.forEach((p) => {
  if (p.id && p.price !== undefined && p.price !== "—" && p.price !== "") {
    const num = parseFloat(String(p.price).replace(/[^\d.]/g, ""));
    if (!Number.isNaN(num)) prices[p.id] = num;
  }
});
fs.writeFileSync(planPricesPath, JSON.stringify(prices, null, 2), "utf8");
console.log("Yazıldı:", planPricesPath);

console.log("Planlar sisteme işlendi. server.js yeniden başlatıldığında bu dosyalar okunacak.");
