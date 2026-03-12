import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Sparkles } from "lucide-react";
import { getApiBase, apiJson } from "../config";
import { useLanguage } from "../contexts/LanguageContext";

type PlanItem = {
  id: string;
  name: string;
  price: number | string;
  period?: string;
  credits?: number;
  description?: string;
  features?: string[];
  cta?: string;
  href?: string;
  highlighted?: boolean;
  currency?: string;
};

function PlanCard({
  plan,
  t,
  onCtaClick,
}: {
  plan: PlanItem;
  t: (key: string) => string;
  onCtaClick: () => void;
}) {
  const currency = plan.currency === "USD" ? "$" : "₺";
  const priceDisplay =
    plan.price === "—" || plan.price === ""
      ? t("pricing.custom")
      : `${currency}${plan.price}`;
  const showPeriod =
    plan.price !== "—" &&
    plan.price !== "" &&
    plan.period &&
    t("pricing.perPeriod");

  return (
    <div
      className={`relative rounded-2xl border-2 p-8 flex flex-col h-full transition-all duration-200 ${
        plan.highlighted
          ? "border-[#FF5A5F] bg-white shadow-xl shadow-[#FF5A5F]/10 scale-[1.02] z-10"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5A5F] px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5" />
            {t("pricing.popular")}
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1.5 text-sm text-gray-600">{plan.description}</p>
        )}
      </div>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-1">
        <span className="text-4xl font-extrabold tracking-tight text-gray-900">
          {priceDisplay}
        </span>
        {showPeriod && (
          <span className="text-gray-500">
            {" "}
            {t("pricing.perPeriod")} {plan.period}
          </span>
        )}
      </div>
      <ul className="mb-8 flex-1 space-y-3">
        {(plan.features || [])
          .filter((f) => !/fiyat analizi|price analysis/i.test(String(f)))
          .map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-gray-700">
            <span className="mt-0.5 shrink-0 rounded-full bg-[#FF5A5F]/10 p-0.5">
              <Check className="w-4 h-4 text-[#FF5A5F]" strokeWidth={2.5} />
            </span>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onCtaClick}
        className={`mt-auto block w-full rounded-xl py-3.5 px-4 text-center font-semibold transition-colors ${
          plan.highlighted
            ? "bg-[#FF5A5F] text-white hover:bg-[#e54d52]"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        {plan.cta || t("pricing.ctaDefault")}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getApiBase()}/api/site-plans`, { signal: controller.signal })
      .then(async (res) => {
        const data = await apiJson<{ success?: boolean; plans?: PlanItem[] } | PlanItem[]>(res);
        if (data && typeof data === "object" && "plans" in data && Array.isArray((data as { plans: PlanItem[] }).plans)) {
          return (data as { plans: PlanItem[] }).plans.map((p) => ({
            ...p,
            features: p.features || [],
            currency: p.currency || "USD",
          }));
        }
        if (Array.isArray(data)) return data;
        return [];
      })
      .then(setPlans)
      .catch(() => {
        fetch(`${getApiBase()}/api/plans`, { signal: controller.signal })
          .then(async (res) => {
            const data = await apiJson<{ success?: boolean; plans?: PlanItem[] } | PlanItem[]>(res);
            if (data && typeof data === "object" && "plans" in data && Array.isArray((data as { plans: PlanItem[] }).plans)) {
              return (data as { plans: PlanItem[] }).plans;
            }
            if (Array.isArray(data)) return data;
            return [];
          })
          .then(setPlans)
          .catch(() => setPlans([]));
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900">{t("pricing.title")}</h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          {t("pricing.subtitle")}
        </p>
      </div>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id || plan.name}
              plan={plan}
              t={t}
              onCtaClick={() => setShowModal(true)}
            />
          ))}
        </div>
        <p className="text-center text-gray-500 mt-10 text-sm">
          {t("pricing.autoRenew")}
        </p>
        <p className="text-center text-gray-600 mt-8">
          {t("pricing.enterpriseCta")}{" "}
          <Link to="/destek" className="text-[#FF5A5F] font-medium hover:underline">
            {t("pricing.contactUs")}
          </Link>
          .
        </p>
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("pricing.modalClose")}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-800 whitespace-pre-line">{t("pricing.comingSoon")}</p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-[#FF5A5F] hover:bg-[#e54d52] transition-colors"
            >
              {t("pricing.modalClose")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
