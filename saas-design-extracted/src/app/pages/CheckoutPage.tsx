import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Check, CreditCard, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

type PlanItem = {
  id: string;
  name: string;
  price: number | string;
  period?: string;
  features?: string[];
  currency?: string;
};

function renderSectionContent(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const parts: React.ReactNode[] = [];
  let currentList: string[] = [];
  let currentParagraph: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      parts.push(
        <ul key={parts.length} className="list-disc list-inside my-2 space-y-1 ml-2 text-sm">
          {currentList.map((item, i) => (
            <li key={i}>{item.replace(/^[•\-]\s*/, "")}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      parts.push(
        <p key={parts.length} className="my-2 text-sm">
          {currentParagraph.join(" ")}
        </p>
      );
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      flushParagraph();
      currentList.push(trimmed);
    } else {
      flushList();
      currentParagraph.push(trimmed);
    }
  }
  flushList();
  flushParagraph();
  return <>{parts}</>;
}

const DISTANCE_KEYS = [
  "distance.s1", "distance.s2", "distance.s3", "distance.s4", "distance.s5",
  "distance.s6", "distance.s7", "distance.s8", "distance.s9", "distance.s10",
  "distance.s11", "distance.s12",
];
const REFUND_KEYS = ["refund.s1", "refund.s2", "refund.s3", "refund.s4", "refund.s5", "refund.s6", "refund.s7"];
const KVKK_TITLE_KEYS = ["kvkk.s1Title", "kvkk.s2Title", "kvkk.s3Title", "kvkk.s4Title", "kvkk.s5Title", "kvkk.s6Title", "kvkk.s7Title"];
const KVKK_BODY_KEYS = ["kvkk.s1", "kvkk.s2", "kvkk.s3", "kvkk.s4", "kvkk.s5", "kvkk.s6", "kvkk.s7"];

export default function CheckoutPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const plan = (location.state as { plan?: PlanItem })?.plan;

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [agreeDistance, setAgreeDistance] = useState(false);
  const [agreeKvkk, setAgreeKvkk] = useState(false);
  const [showDistanceText, setShowDistanceText] = useState(false);
  const [showKvkkText, setShowKvkkText] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!plan) {
    navigate("/fiyatlandirma", { replace: true });
    return null;
  }

  const currency = plan.currency === "USD" ? "$" : "₺";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeDistance || !agreeKvkk) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl bg-green-50 border border-green-200 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("checkout.successTitle")}</h1>
          <p className="mt-2 text-gray-600">{t("checkout.successMessage")}</p>
          <Link
            to="/fiyatlandirma"
            className="mt-6 inline-block px-6 py-3 rounded-xl font-semibold text-white bg-[#FF5A5F] hover:bg-[#e54d52]"
          >
            {t("checkout.backToPricing")}
          </Link>
        </div>
      </div>
    );
  }

  const features = (plan.features || []).filter((f) => !/fiyat analizi|price analysis/i.test(String(f)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
        <Lock className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">{t("checkout.demoNotice")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h2 className="text-lg font-semibold text-gray-900">{t("checkout.orderSummary")}</h2>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#FF5A5F]">
                  {currency}{plan.price === "—" || plan.price === "" ? "—" : plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-500">{t("checkout.perPeriod")} {plan.period}</span>
                )}
              </div>
              {features.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-[#FF5A5F] shrink-0 mt-0.5" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FF5A5F]" />
                {t("checkout.paymentDetails")}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.cardNumber")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.expiry")}</label>
                  <input
                    type="text"
                    placeholder="AA/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.cvc")}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.cardName")}</label>
                <input
                  type="text"
                  placeholder={t("checkout.cardNamePlaceholder")}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
                />
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeDistance}
                      onChange={(e) => setAgreeDistance(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FF5A5F] focus:ring-[#FF5A5F]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {t("checkout.agreeDistanceRefund")}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDistanceText(!showDistanceText)}
                    className="text-xs font-medium text-[#FF5A5F] hover:underline flex items-center gap-1"
                  >
                    {showDistanceText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showDistanceText ? t("checkout.hideText") : t("checkout.showText")}
                  </button>
                  {showDistanceText && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto text-gray-600 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{t("distance.title")}</h4>
                        {DISTANCE_KEYS.map((key) => {
                          const text = t(key);
                          return text ? <div key={key} className="mb-2">{renderSectionContent(text)}</div> : null;
                        })}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{t("refund.title")}</h4>
                        {REFUND_KEYS.map((key) => {
                          const text = t(key);
                          return text ? <div key={key} className="mb-2">{renderSectionContent(text)}</div> : null;
                        })}
                      </div>
                      <p className="text-xs pt-2">
                        <Link to="/mesafeli-satis-sozlesmesi" className="text-[#FF5A5F] hover:underline">{t("checkout.fullTextDistance")}</Link>
                        {" · "}
                        <Link to="/iptal-iade-politikasi" className="text-[#FF5A5F] hover:underline">{t("checkout.fullTextRefund")}</Link>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeKvkk}
                      onChange={(e) => setAgreeKvkk(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FF5A5F] focus:ring-[#FF5A5F]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {t("checkout.agreeKvkk")}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKvkkText(!showKvkkText)}
                    className="text-xs font-medium text-[#FF5A5F] hover:underline flex items-center gap-1"
                  >
                    {showKvkkText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showKvkkText ? t("checkout.hideText") : t("checkout.showText")}
                  </button>
                  {showKvkkText && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto text-gray-600 space-y-4">
                      {KVKK_TITLE_KEYS.map((titleKey, i) => {
                        const body = t(KVKK_BODY_KEYS[i]);
                        const title = t(titleKey);
                        if (!body) return null;
                        return (
                          <div key={titleKey}>
                            {title && <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>}
                            {renderSectionContent(body)}
                          </div>
                        );
                      })}
                      <p className="text-xs pt-2">
                        <Link to="/kvkk-aydinlatma-metni" className="text-[#FF5A5F] hover:underline">{t("checkout.fullTextKvkk")}</Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!agreeDistance || !agreeKvkk || submitting}
                className="w-full py-4 rounded-xl font-semibold text-white bg-[#FF5A5F] hover:bg-[#e54d52] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : null}
                {t("checkout.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
