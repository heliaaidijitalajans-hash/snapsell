import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  User,
  CreditCard,
  BarChart3,
  Package,
  RefreshCw,
  XCircle,
  LogOut,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getApiBase, apiJson } from "../config";

type AccountData = {
  email: string | null;
  displayName: string | null;
  credits: number;
  plan: string;
  conversions: number;
  totalConversions: number;
  hasLeonardo: boolean;
  hasEditor: boolean;
  planName: string;
  planFeatures: string[];
  planPrice: string;
  planPeriod: string;
  createdAt: string | null;
};

export function AccountPage() {
  const { user, logout, getAuthHeaders } = useAuth();
  const { t, locale } = useLanguage();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthHeaders()
      .then((headers) => fetch(`${getApiBase()}/api/account`, { headers }))
      .then(async (r) => {
        const parsed = await apiJson<AccountData | { success?: boolean; data?: AccountData }>(r);
        if (!r.ok) return Promise.reject(new Error((parsed && typeof parsed === "object" && "error" in parsed && parsed.error) ? String(parsed.error) : t("account.errorLoad")));
        return parsed;
      })
      .then((d) => {
        if (cancelled) return;
        const payload = d && typeof d === "object" && "data" in d && d.data != null ? d.data : d;
        setData(payload as AccountData);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || t("account.errorGeneric"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [getAuthHeaders, t]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF5A5F] animate-spin" aria-hidden />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700">{error || t("account.loadFailed")}</p>
          <p className="text-sm text-red-600 mt-2">{t("account.pleaseLogin")}</p>
        </div>
      </div>
    );
  }

  const displayEmail = data.email || user?.email || "—";
  const displayName = data.displayName || user?.displayName || "—";

  const dateLocale = locale === "en" ? "en-US" : "tr-TR";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{t("account.title")}</h1>
        <p className="mt-1 text-gray-600">{t("account.subtitle")}</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#FF5A5F]" />
              {t("account.profile")}
            </h2>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#FF5A5F]/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-[#FF5A5F]">
                  {(displayName !== "—" ? String(displayName).slice(0, 2) : displayEmail.slice(0, 2)).toUpperCase()}
                </span>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </div>
                {displayName !== "—" && (
                  <p className="text-sm text-gray-600">{t("account.name")}: {displayName}</p>
                )}
                {data.createdAt && (
                  <p className="text-xs text-gray-500">
                    {t("account.membership")}: {new Date(data.createdAt).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#FF5A5F]" />
              {t("account.usageSummary")}
            </h2>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-xl bg-[#FF5A5F]/5 border border-[#FF5A5F]/20 p-5">
                <p className="text-sm font-medium text-gray-600">{t("account.remainingConversions")}</p>
                <p className="mt-1 text-3xl font-bold text-[#FF5A5F] tabular-nums">{data.conversions}</p>
                <p className="text-xs text-gray-500 mt-1">{t("account.conversionNote")}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                <p className="text-sm font-medium text-gray-600">{t("account.totalConversions")}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 tabular-nums">{data.totalConversions}</p>
                <p className="text-xs text-gray-500 mt-1">{t("account.sinceAccount")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF5A5F]" />
              {t("account.planDetail")}
            </h2>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">{data.planName || data.plan}</span>
              {data.planPrice !== undefined && data.planPrice !== "" && (
                <span className="text-gray-600">
                  — ₺{data.planPrice}
                  {data.planPeriod ? ` / ${data.planPeriod}` : ""}
                </span>
              )}
            </div>
            {data.planFeatures && data.planFeatures.length > 0 && (
              <ul className="mt-4 space-y-2">
                {data.planFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-700">
                    <Sparkles className="w-4 h-4 text-[#FF5A5F] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {(data.hasLeonardo || data.hasEditor) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.hasEditor && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF5A5F]/10 text-[#FF5A5F]">
                    {t("account.imageEdit")}
                  </span>
                )}
                {data.hasLeonardo && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF5A5F]/10 text-[#FF5A5F]">
                    Pixian AI
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF5A5F]" />
              {t("account.subscription")}
            </h2>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">{t("account.renewUpgrade")}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{t("account.renewDesc")}</p>
              </div>
              <Link
                to="/fiyatlandirma"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                {t("account.goPricing")}
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-amber-50/80 border border-amber-100">
              <div>
                <h3 className="font-medium text-gray-900">{t("account.cancelTitle")}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{t("account.cancelDesc")}</p>
              </div>
              <Link
                to="/destek"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 shrink-0"
              >
                <XCircle className="w-4 h-4" />
                {t("account.cancel")}
              </Link>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900">{t("account.renewingSubscription")}</p>
              <p className="text-sm text-gray-600 mt-1">{t("account.renewingSubscriptionDesc")}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">{t("account.session")}</h2>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm text-gray-600 mb-4">{t("account.logoutDesc")}</p>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/30 transition"
            >
              <LogOut className="w-4 h-4" />
              {t("account.logout")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
