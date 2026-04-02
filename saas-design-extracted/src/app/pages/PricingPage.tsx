import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Sparkles } from "lucide-react";
import { getApiBase, getCreateCheckoutUrl, apiJson } from "../config";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

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

const YEARLY_STRIKE_PRICE = 440;
const YEARLY_PROMO_PRICE = 396;

/** API / site-plans.json eski veride aylık=popüler kalmışsa düzelt. */
function normalizePlanFlags(plan: PlanItem): PlanItem {
  if (plan.id === "monthly_plan") return { ...plan, highlighted: false };
  if (plan.id === "yearly_plan") return { ...plan, highlighted: true };
  return plan;
}

function localizePlan(plan: PlanItem, locale: "tr" | "en"): PlanItem {
  if (locale !== "en") return plan;
  const id = (plan.id || "").toLowerCase();
  const localizedPeriod = plan.period === "ay" ? "month" : plan.period === "yıl" ? "year" : plan.period;
  const byId: Record<string, Partial<PlanItem>> = {
    free: {
      name: "Free plan",
      description: "3 conversions, basic features",
      cta: "Start free",
      features: ["3 conversions", "Basic features"],
    },
    monthly_plan: {
      name: "Monthly plan",
      description: "30 conversions",
      cta: "Get started",
      features: ["30 conversions", "All features", "SEO description", "Price analysis"],
    },
    monthly_plan_pro: {
      name: "Monthly plan Pro",
      description: "80 conversions",
      cta: "Upgrade to Pro",
      features: ["80 conversions", "All features", "SEO description", "Price analysis"],
    },
    yearly_plan: {
      name: "Annual Subscription",
      description: "1200 conversions, 100 monthly credits",
      cta: "Choose yearly",
      features: ["1200 conversions", "100 monthly credits", "All features", "SEO description", "Price analysis", "Includes upcoming feature updates"],
    },
    enterprise: {
      name: "Enterprise",
      description: "Contact us",
      cta: "Contact us",
      features: ["Team workspace", "All features", "SEO description", "Price analysis", "Includes upcoming feature updates", "Annual billing"],
    },
    addon: {
      name: "Add-on pack",
      description: "25 conversions",
      cta: "Buy add-on",
      features: ["25 conversions", "All features included"],
    },
  };
  return {
    ...plan,
    ...byId[id],
    period: localizedPeriod,
  };
}

function PlanCard({
  plan,
  t,
  onCtaClick,
  loading,
  displayCurrency,
  displayPrice,
  strikePrice,
}: {
  plan: PlanItem;
  t: (key: string) => string;
  onCtaClick: () => void;
  loading?: boolean;
  displayCurrency?: "USD";
  displayPrice?: number | string;
  /** Yıllık planda eski fiyat (üstü çizili) */
  strikePrice?: number;
}) {
  const currency = "$";
  const isAnnual = plan.id === "yearly_plan";
  const price = displayPrice !== undefined ? displayPrice : plan.price;
  const priceDisplay =
    price === "—" || price === "" || (typeof price === "number" && !Number.isFinite(price))
      ? t("pricing.custom")
      : `${currency}${typeof price === "number" ? (Number.isInteger(price) ? price : price.toFixed(2)) : price}`;
  const showPeriod =
    price !== "—" && price !== "" && plan.period && t("pricing.perPeriod");

  return (
    <div
      className={`relative rounded-2xl border p-8 flex flex-col h-full transition-all duration-200 ${
        isAnnual
          ? "border-gray-200/90 bg-white pt-14 shadow-lg shadow-gray-900/5 ring-1 ring-black/[0.04] md:p-10 lg:col-span-2 max-w-2xl lg:max-w-none mx-auto w-full"
          : plan.highlighted
            ? "border-[#FF5A5F] border-2 bg-white shadow-xl shadow-[#FF5A5F]/10 scale-[1.02] z-10"
            : "border-gray-200 border-2 bg-white hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      {isAnnual && (
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            {t("pricing.bestValue")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5A5F] px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {t("pricing.popular")}
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {isAnnual ? t("pricing.annualName") : plan.name}
        </h3>
        {isAnnual && (
          <p className="mt-2 text-sm font-semibold tracking-tight text-gray-800">{t("pricing.annualLaunchDiscount")}</p>
        )}
        {plan.description && (
          <p className={`text-sm text-gray-600 ${isAnnual ? "mt-2" : "mt-1.5"}`}>{plan.description}</p>
        )}
      </div>
      {isAnnual && strikePrice != null ? (
        <div className="mb-6">
          <p className="text-2xl font-medium text-gray-400 line-through decoration-gray-400">
            {currency}
            {strikePrice}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-5xl font-extrabold tracking-tight text-gray-900">{priceDisplay}</span>
            {showPeriod && (
              <span className="text-lg text-gray-500">
                {t("pricing.perPeriod")} {plan.period}
              </span>
            )}
          </div>
        </div>
      ) : (
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
      )}
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
        disabled={loading}
        className={`mt-auto block w-full rounded-xl py-3.5 px-4 text-center font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
          plan.highlighted || isAnnual
            ? "bg-[#FF5A5F] text-white hover:bg-[#e54d52]"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        {loading ? "..." : (plan.cta || t("pricing.ctaDefault"))}
      </button>
    </div>
  );
}

const PAID_PLAN_IDS = ["monthly_plan", "monthly_plan_pro", "yearly_plan", "addon", "enterprise"] as const;

export default function PricingPage() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCtaClick = useCallback(
    async (plan: PlanItem) => {
      const planKey = plan.id || plan.name;
      setPaymentLoading(planKey);
      setCheckoutError(null);
      try {
        if (plan.id === "free") {
          navigate("/login");
          return;
        }
        if (plan.id === "enterprise") {
          navigate("/destek");
          return;
        }
        const isPaidCard =
          plan.id && PAID_PLAN_IDS.includes(plan.id as (typeof PAID_PLAN_IDS)[number]);
        if (!isPaidCard) {
          setCheckoutError(t("pricing.checkoutUnavailable"));
          return;
        }
        if (!user?.id || !user.email) {
          navigate("/login", { state: { from: "/fiyatlandirma" } });
          return;
        }
        const headers = await getAuthHeaders();
        const checkoutPlan = plan.id as (typeof PAID_PLAN_IDS)[number];
        const payload = { plan: checkoutPlan };
        const res = await fetch(getCreateCheckoutUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(payload),
        });
        const json = await apiJson<{ checkoutUrl?: string; error?: string; detail?: string }>(res);
        console.log("[create-checkout] status:", res.status, "body:", json);
        if (res.ok && json?.checkoutUrl) {
          console.log("Checkout created");
          window.location.href = json.checkoutUrl;
          return;
        }
        const errMsg = json?.error || t("pricing.checkoutError");
        const lemonDetail = json?.detail ? String(json.detail).trim().slice(0, 400) : "";
        setCheckoutError(lemonDetail ? `${errMsg} (${lemonDetail})` : errMsg);
      } finally {
        setPaymentLoading(null);
      }
    },
    [navigate, user, getAuthHeaders, t]
  );

  const getDisplayForPlan = useCallback((plan: PlanItem) => {
    if (plan.id === "yearly_plan") {
      return {
        displayCurrency: "USD" as const,
        displayPrice: YEARLY_PROMO_PRICE,
        strikePrice: YEARLY_STRIKE_PRICE,
      };
    }
    return { displayCurrency: "USD" as const, displayPrice: plan.price };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getApiBase()}/api/site-plans`, { signal: controller.signal })
      .then(async (res) => {
        const data = await apiJson<{ success?: boolean; plans?: PlanItem[] } | PlanItem[]>(res);
        if (data && typeof data === "object" && "plans" in data && Array.isArray((data as { plans: PlanItem[] }).plans)) {
          return (data as { plans: PlanItem[] }).plans.map((p) =>
            normalizePlanFlags(
              localizePlan(
                {
                  ...p,
                  features: p.features || [],
                  currency: "USD",
                },
                locale
              )
            )
          );
        }
        if (Array.isArray(data)) return data.map((p) => normalizePlanFlags(localizePlan({ ...p, currency: "USD" }, locale)));
        return [];
      })
      .then(setPlans)
      .catch(() => {
        fetch(`${getApiBase()}/api/plans`, { signal: controller.signal })
          .then(async (res) => {
            const data = await apiJson<{ success?: boolean; plans?: PlanItem[] } | PlanItem[]>(res);
            if (data && typeof data === "object" && "plans" in data && Array.isArray((data as { plans: PlanItem[] }).plans)) {
              return (data as { plans: PlanItem[] }).plans.map((p) =>
                normalizePlanFlags(localizePlan({ ...p, currency: "USD" }, locale))
              );
            }
            if (Array.isArray(data)) return data.map((p) => normalizePlanFlags(localizePlan({ ...p, currency: "USD" }, locale)));
            return [];
          })
          .then(setPlans)
          .catch(() => setPlans([]));
      });
    return () => controller.abort();
  }, [locale]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900">{t("pricing.title")}</h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          {t("pricing.subtitle")}
        </p>
      </div>

      {checkoutError && (
        <div
          className="mb-8 max-w-2xl mx-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {checkoutError}
        </div>
      )}

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const display = getDisplayForPlan(plan);
            return (
              <PlanCard
                key={plan.id || plan.name}
                plan={plan}
                t={t}
                onCtaClick={() => handleCtaClick(plan)}
                loading={paymentLoading === (plan.id || plan.name)}
                displayCurrency={display.displayCurrency}
                displayPrice={display.displayPrice}
                strikePrice={"strikePrice" in display ? display.strikePrice : undefined}
              />
            );
          })}
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

    </div>
  );
}
