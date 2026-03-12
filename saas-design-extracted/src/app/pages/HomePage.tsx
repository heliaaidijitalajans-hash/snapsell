import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div>
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
              {t("home.heroTitle")} <span style={{ color: "#FF5A5F" }}>{t("home.heroTitleHighlight")}</span> {t("home.heroTitleSuffix")}
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <a href="/register" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">{t("home.ctaStartFree")}</a>
              )}
              {user && (
                <Link to="/gorsel-duzenleme" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">{t("home.ctaImageEdit")}</Link>
              )}
              <Link to="/fiyatlandirma" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-[#FF5A5F] bg-gray-100 hover:bg-gray-200">{t("home.ctaViewPricing")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t("home.whyTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="w-12 h-12 mb-4 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center" aria-hidden>
                <svg className="w-6 h-6 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeOpacity="0.4" />
                  <circle cx="12" cy="11" r="4" />
                  <path d="M8 21h8" strokeOpacity="0.6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("home.feature1Title")}</h3>
              <p className="text-gray-600">{t("home.feature1Desc")}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="w-12 h-12 mb-4 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center" aria-hidden>
                <svg className="w-6 h-6 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  <path d="M15 5l4 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("home.feature2Title")}</h3>
              <p className="text-gray-600">{t("home.feature2Desc")}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="w-12 h-12 mb-4 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center" aria-hidden>
                <svg className="w-6 h-6 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 6-4-4-3 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("home.feature3Title")}</h3>
              <p className="text-gray-600">{t("home.feature3Desc")}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="w-12 h-12 mb-4 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center" aria-hidden>
                <svg className="w-6 h-6 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("home.feature4Title")}</h3>
              <p className="text-gray-600">{t("home.feature4Desc")}</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mt-16 mb-8">{t("examples.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <img
              src={`${import.meta.env.BASE_URL}images/examples/ornek1.png`}
              alt={t("examples.alt1")}
              className="w-full h-auto rounded-xl border border-gray-200 shadow-sm object-cover aspect-square"
            />
            <img
              src={`${import.meta.env.BASE_URL}images/examples/ornek2.png`}
              alt={t("examples.alt2")}
              className="w-full h-auto rounded-xl border border-gray-200 shadow-sm object-cover aspect-square"
            />
            <img
              src={`${import.meta.env.BASE_URL}images/examples/ornek3.png`}
              alt={t("examples.alt3")}
              className="w-full h-auto rounded-xl border border-gray-200 shadow-sm object-cover aspect-square"
            />
          </div>
          <div className="mt-20">
            <div className="relative max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-[#FF5A5F]/5 via-white to-gray-50/80 border border-gray-200/80 shadow-xl shadow-gray-200/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5A5F]/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF5A5F]/[0.04] rounded-full translate-y-1/2 -translate-x-1/2" aria-hidden />
              <div className="relative px-6 sm:px-10 py-10 sm:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 mb-8">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FF5A5F]/10 text-[#FF5A5F] w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A5F] animate-pulse" />
                    {t("home.upcomingFeaturesSubtitle")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("home.upcomingFeaturesTitle")}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="group flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 hover:border-[#FF5A5F]/20 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5A5F]/15 to-[#FF5A5F]/5 flex items-center justify-center mb-4 group-hover:from-[#FF5A5F]/20 group-hover:to-[#FF5A5F]/10 transition-colors">
                      <svg className="w-7 h-7 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
                        <polygon points="5 8 5 16 12 12 5 8" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{t("home.upcomingFeature1")}</p>
                  </div>
                  <div className="group flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 hover:border-[#FF5A5F]/20 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5A5F]/15 to-[#FF5A5F]/5 flex items-center justify-center mb-4 group-hover:from-[#FF5A5F]/20 group-hover:to-[#FF5A5F]/10 transition-colors">
                      <svg className="w-7 h-7 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                        <polygon points="10 9 10 15 16 12 10 9" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{t("home.upcomingFeature2")}</p>
                  </div>
                  <div className="group flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 hover:border-[#FF5A5F]/20 hover:shadow-md transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5A5F]/15 to-[#FF5A5F]/5 flex items-center justify-center mb-4 group-hover:from-[#FF5A5F]/20 group-hover:to-[#FF5A5F]/10 transition-colors">
                      <svg className="w-7 h-7 text-[#FF5A5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="M18 17V9" />
                        <path d="M13 17V5" />
                        <path d="M8 17v-3" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{t("home.upcomingFeature3")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
