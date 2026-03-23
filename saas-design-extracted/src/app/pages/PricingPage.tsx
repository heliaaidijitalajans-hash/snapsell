import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Sparkles } from "lucide-react";
import { getApiBase, apiJson } from "../config";
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

function PlanCard({
  plan,
  t,
  onCtaClick,
  loading,
  displayCurrency,
  displayPrice,
}: {
  plan: PlanItem;
  t: (key: string) => string;
  onCtaClick: () => void;
  loading?: boolean;
  displayCurrency?: "TRY" | "USD";
  displayPrice?: number | string;
}) {
  const currency = (displayCurrency || plan.currency) === "USD" ? "$" : "₺";
  const price = displayPrice !== undefined ? displayPrice : plan.price;
  const priceDisplay =
    price === "—" || price === "" || (typeof price === "number" && !Number.isFinite(price))
      ? t("pricing.custom")
      : `${currency}${typeof price === "number" ? (currency === "$" ? price.toFixed(2) : price) : price}`;
  const showPeriod =
    price !== "—" && price !== "" && plan.period && t("pricing.perPeriod");

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
        disabled={loading}
        className={`mt-auto block w-full rounded-xl py-3.5 px-4 text-center font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
          plan.highlighted
            ? "bg-[#FF5A5F] text-white hover:bg-[#e54d52]"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        {loading ? "..." : (plan.cta || t("pricing.ctaDefault"))}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isTurkey, setIsTurkey] = useState<boolean>(true);
  const [usdToTry, setUsdToTry] = useState<number>(34);

  useEffect(() => {
    const c = new AbortController();
    fetch(`${getApiBase()}/api/geo`, { signal: c.signal })
      .then((r) => r.json())
      .then((d) => setIsTurkey(d.isTurkey === true))
      .catch(() => setIsTurkey(true));
    fetch(`${getApiBase()}/api/exchange-rate`, { signal: c.signal })
      .then((r) => r.json())
      .then((d) => setUsdToTry(typeof d.usdToTry === "number" && d.usdToTry > 0 ? d.usdToTry : 34))
      .catch(() => setUsdToTry(34));
    return () => c.abort();
  }, []);

  const submitToShopier = useCallback((postUrl: string, params: Record<string, string>) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = postUrl;
    form.style.display = "none";
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }, []);

  const handleCtaClick = useCallback(
    async (
      plan: PlanItem,
      payment: { price: number; currency: "TRY" | "USD"; usdToTryRate?: number }
    ) => {
      setPaymentError(null);
      const planId = plan.id || plan.name;
      setPaymentLoading(planId);
      try {
        const payload: Record<string, unknown> = {
          plan: {
            id: plan.id,
            name: plan.name,
            price: payment.price,
            currency: payment.currency,
          },
          buyer: {
            name: (user?.user_metadata?.full_name as string | undefined) || (user?.user_metadata?.name as string | undefined) || "",
            email: user?.email ?? "",
            phone: "",
          },
        };
        if (payment.currency === "USD" && payment.usdToTryRate) {
          payload.usdToTryRate = payment.usdToTryRate;
        }
        const res = await fetch(`${getApiBase()}/api/create-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await apiJson<{ paymentUrl?: string; postUrl?: string; params?: Record<string, string>; message?: string; error?: string }>(res);
        if (!res.ok) {
          const msg = (data && "message" in data && data.message) || (data && "error" in data && data.error) || "Ödeme sayfası açılamadı. Lütfen daha sonra tekrar deneyin veya destek ile iletişime geçin.";
          setPaymentError(msg);
          return;
        }
        if (data?.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }
        if (data?.postUrl && data?.params) {
          submitToShopier(data.postUrl, data.params);
          return;
        }
        setPaymentError("Ödeme sayfası açılamadı. Lütfen daha sonra tekrar deneyin veya destek ile iletişime geçin.");
      } catch {
        setPaymentError("Ödeme sayfası açılamadı. Lütfen daha sonra tekrar deneyin veya destek ile iletişime geçin.");
      } finally {
        setPaymentLoading(null);
      }
    },
    [user?.user_metadata, user?.email, submitToShopier]
  );

  const getPaymentPayload = useCallback(
    (plan: PlanItem) => {
      const raw = plan.price === "—" || plan.price === "" ? 0 : Number(plan.price);
      const tlPrice = Number.isFinite(raw) ? raw : 0;
      if (isTurkey) {
        return { price: tlPrice, currency: "TRY" as const };
      }
      const usdPrice = usdToTry > 0 ? tlPrice / usdToTry : tlPrice;
      return { price: Math.round(usdPrice * 100) / 100, currency: "USD" as const, usdToTryRate: usdToTry };
    },
    [isTurkey, usdToTry]
  );

  const getDisplayForPlan = useCallback(
    (plan: PlanItem) => {
      const raw = plan.price === "—" || plan.price === "" ? null : Number(plan.price);
      const tlPrice = raw != null && Number.isFinite(raw) ? raw : null;
      if (isTurkey || tlPrice == null) {
        return { displayCurrency: "TRY" as const, displayPrice: plan.price };
      }
      const usdPrice = usdToTry > 0 ? tlPrice / usdToTry : tlPrice;
      return { displayCurrency: "USD" as const, displayPrice: Math.round(usdPrice * 100) / 100 };
    },
    [isTurkey, usdToTry]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getApiBase()}/api/site-plans`, { signal: controller.signal })
      .then(async (res) => {
        const data = await apiJson<{ success?: boolean; plans?: PlanItem[] } | PlanItem[]>(res);
        if (data && typeof data === "object" && "plans" in data && Array.isArray((data as { plans: PlanItem[] }).plans)) {
          return (data as { plans: PlanItem[] }).plans.map((p) => ({
            ...p,
            features: p.features || [],
            currency: p.currency || "TRY",
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

      {paymentError && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
          {paymentError}
        </div>
      )}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const display = getDisplayForPlan(plan);
            const payment = getPaymentPayload(plan);
            return (
              <PlanCard
                key={plan.id || plan.name}
                plan={plan}
                t={t}
                onCtaClick={() => handleCtaClick(plan, payment)}
                loading={paymentLoading === (plan.id || plan.name)}
                displayCurrency={display.displayCurrency}
                displayPrice={display.displayPrice}
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
