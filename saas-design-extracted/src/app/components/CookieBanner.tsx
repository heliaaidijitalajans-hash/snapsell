import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

const STORAGE_KEY = "snapsell_cookie_consent";

export type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  createdAt: number;
};

export function getStoredConsent(): CookieConsent | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CookieConsent;
    if (data && typeof data.essential === "boolean" && typeof data.analytics === "boolean") return data;
  } catch {
    // ignore
  }
  return null;
}

export function hasAnalyticsConsent(): boolean {
  const c = getStoredConsent();
  return !!c?.analytics;
}

export function CookieBanner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const consent = getStoredConsent();
    if (consent === null) setVisible(true);
  }, []);

  const save = (essential: boolean, analyticsChoice: boolean) => {
    const data: CookieConsent = { essential: true, analytics: analyticsChoice, createdAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    setVisible(false);
    setExpanded(false);
  };

  const acceptAll = () => save(true, true);
  const essentialOnly = () => save(true, false);
  const saveCustom = () => save(true, analytics);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[100] rounded-xl bg-white border border-gray-200 shadow-lg p-4 text-gray-800"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <h2 id="cookie-banner-title" className="text-base font-semibold text-gray-900 mb-1">
        {t("cookie.bannerTitle")}
      </h2>
      <p id="cookie-banner-desc" className="text-sm text-gray-600 mb-3">
        {t("cookie.bannerText")}{" "}
        <button
          type="button"
          onClick={() => navigate("/cerez-politikasi")}
          className="text-[#FF5A5F] hover:underline font-inherit text-inherit p-0 border-0 bg-transparent cursor-pointer inline"
        >
          {t("cookie.policyLink")}
        </button>
      </p>

      {!expanded ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={acceptAll}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition"
          >
            {t("cookie.acceptAll")}
          </button>
          <button
            type="button"
            onClick={essentialOnly}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            {t("cookie.essentialOnly")}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition"
          >
            {t("cookie.customize")}
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{t("cookie.essentialCookies")}</p>
              <p className="text-xs text-gray-500">{t("cookie.essentialDesc")}</p>
            </div>
            <span className="text-gray-400 text-sm shrink-0">✓</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{t("cookie.analyticsCookies")}</p>
              <p className="text-xs text-gray-500">{t("cookie.analyticsDesc")}</p>
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="rounded border-gray-400 text-[#FF5A5F] focus:ring-[#FF5A5F]"
              />
              <span className="text-sm text-gray-600 sr-only">{t("cookie.analyticsCookies")}</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={saveCustom}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition"
            >
              {t("cookie.savePreferences")}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              {t("cookie.customize")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
