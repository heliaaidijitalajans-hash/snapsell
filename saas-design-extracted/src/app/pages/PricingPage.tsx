import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

const API = typeof window !== "undefined" ? window.location.origin : "";

type SitePlan = {
  id?: string;
  name: string;
  price: string;
  period: string;
  description?: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  planType?: string;
  currency?: string;
};

const DEFAULT_PLANS: SitePlan[] = [
  { id: "free", name: "Ücretsiz deneme", price: "0", period: "ay", description: "Denemek için ideal", features: ["Sınırlı dönüşüm", "Temel özellikler", "SnapSell ile tanışın"], cta: "Ücretsiz başla", href: "/register", highlighted: false, currency: "USD" },
  { id: "monthly_plan", name: "Aylık plan", price: "40", period: "ay", description: "100 dönüşüm", features: ["100 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Başla", href: "/register?plan=monthly_plan", highlighted: true, currency: "USD" },
  { id: "monthly_plan_pro", name: "Aylık plan Pro", price: "65", period: "ay", description: "200 dönüşüm", features: ["200 dönüşüm", "Tüm özellikler", "SEO açıklama", "Fiyat analizi"], cta: "Pro'ya geç", href: "/register?plan=monthly_plan_pro", highlighted: false, currency: "USD" },
  { id: "yearly_plan", name: "Yıllık plan", price: "440", period: "yıl", description: "3000 dönüşüm, aylık 250 hak", features: ["3000 dönüşüm", "Aylık 250 dönüşüm hakkı", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Yeni özellik gelişimleri dahil"], cta: "Yıllık seç", href: "/register?plan=yearly_plan", highlighted: false, currency: "USD" },
  { id: "enterprise", name: "Kurumsal", price: "—", period: "yıl", description: "Ekibiniz için", features: ["Ekibiniz ile takım kurma ayrıcalığı", "Tüm özellikler", "SEO açıklama", "Fiyat analizi", "Yeni özellik gelişmeleri", "Yıllık faturalandırma"], cta: "Bize ulaşın", href: "/destek", highlighted: false, currency: "USD" },
];

function PlanCard({ plan, t, onCtaClick }: { plan: SitePlan; t: (k: string) => string; onCtaClick: () => void }) {
  const symbol = plan.currency === "USD" ? "$" : "₺";
  const priceDisplay = plan.price === "—" || plan.price === "" ? t("pricing.custom") : (plan.currency === "USD" ? symbol + plan.price : symbol + plan.price);
  return (
    <div
      className={`rounded-2xl border-2 p-8 flex flex-col ${
        plan.highlighted ? "border-[#FF5A5F] bg-white shadow-lg scale-105" : "border-gray-200 bg-white"
      }`}
    >
      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
      {plan.description && <p className="mt-1 text-gray-600 text-sm">{plan.description}</p>}
      <div className="mt-6 flex flex-wrap items-baseline gap-x-1">
        <span className="text-4xl font-extrabold text-gray-900">{priceDisplay}</span>
        {plan.price !== "—" && plan.price !== "" && <span className="ml-1 text-gray-500"> {t("pricing.perPeriod")} {plan.period}</span>}
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {(plan.features || []).map((f) => (
          <li key={f} className="flex items-center text-gray-700">
            <span className="text-[#FF5A5F] mr-2">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCtaClick}
        className={`mt-8 block w-full text-center py-3 px-4 rounded-lg font-medium ${
          plan.highlighted ? "bg-[#FF5A5F] text-white hover:bg-[#FF5A5F]/90" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}

export function PricingPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<SitePlan[]>(DEFAULT_PLANS);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(API + "/api/site-plans")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data.plans || []) as (SitePlan & { planType?: string })[];
        if (list.length > 0) {
          const withFeatures = list.map((p) => ({ ...p, features: p.features || [], currency: p.currency || "USD" }));
          setPlans(withFeatures);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const comingSoonMessage = t("pricing.comingSoon");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">{t("pricing.title")}</h1>
        <p className="mt-4 text-xl text-gray-600">{t("pricing.subtitle")}</p>
      </div>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {plans.map((plan) => (
            <PlanCard key={plan.id || plan.name} plan={plan} t={t} onCtaClick={() => setModalOpen(true)} />
          ))}
        </div>
        <p className="text-center text-gray-600 mt-8 text-sm">{t("pricing.autoRenew")}</p>
      </section>

      <p className="text-center text-gray-500 mt-12">
        {t("pricing.enterpriseCta")} <Link to="/destek" className="text-[#FF5A5F] hover:underline">{t("pricing.contactUs")}</Link>.
      </p>

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-800 whitespace-pre-line">{comingSoonMessage}</p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-6 w-full py-3 px-4 rounded-lg font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90"
            >
              {t("pricing.modalClose")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
