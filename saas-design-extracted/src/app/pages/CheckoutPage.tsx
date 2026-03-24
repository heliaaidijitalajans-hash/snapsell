import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Check, CreditCard, Lock } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

type PlanItem = {
  id: string;
  name: string;
  price: number | string;
  period?: string;
  features?: string[];
  currency?: string;
};

export default function CheckoutPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const plan = (location.state as { plan?: PlanItem })?.plan;

  const [agreeDistance, setAgreeDistance] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);

  if (!plan) {
    navigate("/fiyatlandirma", { replace: true });
    return null;
  }

  const currency = "$";

  const features = (plan.features || []).filter((f) => !/fiyat analizi|price analysis/i.test(String(f)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 p-4 rounded-xl bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center gap-3">
        <Lock className="w-5 h-5 text-[#FF5A5F] shrink-0" />
        <p className="text-sm sm:text-base text-[#9f252a] font-medium">
          Odeme sistemi su an aktif degildir. En kisa surede global odemelere acilacaktir.
        </p>
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
          <form className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FF5A5F]" />
                {t("checkout.paymentDetails")}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.cardName")}</label>
                <input
                  type="text"
                  placeholder={t("checkout.cardNamePlaceholder")}
                  value=""
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-400 px-4 py-3 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.cardNumber")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value=""
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-400 px-4 py-3 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.expiry")}</label>
                  <input
                    type="text"
                    placeholder="AA/YY"
                    value=""
                    disabled
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-400 px-4 py-3 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("checkout.cvc")}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="CVC"
                    value=""
                    disabled
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-400 px-4 py-3 cursor-not-allowed"
                  />
                </div>
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
                      Mesafeli Satis Sozlesmesi'ni kabul ediyorum.
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    <Link to="/mesafeli-satis-sozlesmesi" className="text-[#FF5A5F] hover:underline">Mesafeli Satis Sozlesmesi</Link>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeRefund}
                      onChange={(e) => setAgreeRefund(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FF5A5F] focus:ring-[#FF5A5F]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Iptal ve Iade Kosullari'ni kabul ediyorum.
                    </span>
                  </label>
                  <p className="text-xs text-gray-600">
                    <Link to="/iptal-iade-politikasi" className="text-[#FF5A5F] hover:underline">Iptal ve Iade Kosullari</Link>
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="w-full py-4 rounded-xl font-semibold text-white bg-[#FF5A5F] hover:bg-[#e54d52] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Odeme Sistemi Gecici Olarak Kapali
              </button>
              {agreeDistance && agreeRefund && (
                <p className="text-center text-xs text-gray-500">
                  Tum adimlar hazir. Sistem aktif oldugunda bu ekrandan odemeye devam edebileceksiniz.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
