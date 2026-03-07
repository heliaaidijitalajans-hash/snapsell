import { Outlet, Link, useLocation } from "react-router";
import { Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";
import { CookieBanner, hasAnalyticsConsent } from "./CookieBanner";

import { getApiBase } from "../config";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem("snapsell_visit_sent")) return;
    if (!hasAnalyticsConsent()) return;
    sessionStorage.setItem("snapsell_visit_sent", "1");
    fetch(getApiBase() + "/api/track-visit", { method: "GET" }).catch(() => {});
  }, []);

  const navigation = [
    { nameKey: "nav.home", href: "/", external: false },
    { nameKey: "nav.imageEdit", href: "/gorsel-duzenleme", external: false },
    { nameKey: "nav.examples", href: "/ornekler", external: false },
    { nameKey: "nav.pricing", href: "/fiyatlandirma", external: false },
    { nameKey: "nav.support", href: "/destek", external: false },
    { nameKey: "nav.faq", href: "/sss", external: false },
    { nameKey: "nav.about", href: "/hakkimizda", external: false },
  ];

  const userNavigation = [
    { nameKey: "nav.imageEdit", href: "/gorsel-duzenleme", external: false },
    { nameKey: "nav.library", href: "/kutuphane", external: false },
    { nameKey: "nav.accountSettings", href: "/hesap-ayarlari", external: false },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/" || location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold" style={{ color: "#FF5A5F" }}>SnapSell</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.nameKey}
                  to={item.href}
                  className={`transition-colors ${isActive(item.href) ? "text-[#FF5A5F]" : "text-gray-700 hover:text-[#FF5A5F]"}`}
                >
                  {t(item.nameKey)}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <LanguageSelector />
              {user ? (
                <div className="relative group">
                  <button type="button" className="flex items-center space-x-2 text-gray-700 hover:text-[#FF5A5F] transition-colors">
                    <User className="w-6 h-6" />
                    <span>{user.email?.split("@")[0] || t("nav.myAccount")}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                    {userNavigation.map((item) =>
                      item.external ? (
                        <a key={item.nameKey} href={item.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg">
                          {t(item.nameKey)}
                        </a>
                      ) : (
                        <Link key={item.nameKey} to={item.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg">
                          {t(item.nameKey)}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-[#FF5A5F] transition-colors font-medium">{t("nav.login")}</Link>
                  <Link to="/register" className="px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#FF5A5F]/90 transition-colors font-medium">{t("nav.register")}</Link>
                  <div className="relative group">
                    <button type="button" className="flex items-center space-x-2 text-gray-700 hover:text-[#FF5A5F] transition-colors">
                      <User className="w-6 h-6" />
                      <span>{t("nav.myAccount")}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                      {userNavigation.map((item) =>
                        item.external ? (
                          <a key={item.nameKey} href={item.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg">
                            {t(item.nameKey)}
                          </a>
                        ) : (
                          <Link key={item.nameKey} to={item.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg">
                            {t(item.nameKey)}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-700" aria-label="Menü">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link key={item.nameKey} to={item.href} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md ${isActive(item.href) ? "bg-[#FF5A5F] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                  {t(item.nameKey)}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 space-y-1 flex flex-wrap items-center gap-2">
                <div className="w-full px-3 py-2">
                  <LanguageSelector />
                </div>
                <Link to="/login" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>{t("nav.login")}</Link>
                <Link to="/register" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>{t("nav.register")}</Link>
                {userNavigation.map((item) =>
                  item.external ? (
                    <a key={item.nameKey} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                      {t(item.nameKey)}
                    </a>
                  ) : (
                    <Link key={item.nameKey} to={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                      {t(item.nameKey)}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">SnapSell</div>
              <p className="text-sm">{t("footer.description")}</p>
            </div>
            <div>
              <h3 className="text-white mb-4">{t("footer.product")}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/fiyatlandirma" className="hover:text-white">{t("nav.pricing")}</Link></li>
                <li><Link to="/gorsel-duzenleme" className="hover:text-white">{t("nav.imageEdit")}</Link></li>
                <li><Link to="/kutuphane" className="hover:text-white">{t("nav.library")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">{t("nav.support")}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/destek" className="hover:text-white">{t("footer.contact")}</Link></li>
                <li><Link to="/sss" className="hover:text-white">{t("nav.faq")}</Link></li>
                <li><Link to="/hakkimizda" className="hover:text-white">{t("nav.about")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">{t("footer.legal")}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/kullanim-kosullari" className="hover:text-white">{t("footer.terms")}</Link></li>
                <li><Link to="/mesafeli-satis-sozlesmesi" className="hover:text-white">{t("footer.distanceSales")}</Link></li>
                <li><Link to="/on-bilgilendirme-formu" className="hover:text-white">{t("footer.preliminaryInfo")}</Link></li>
                <li><Link to="/iptal-iade-politikasi" className="hover:text-white">{t("footer.refundPolicy")}</Link></li>
                <li><Link to="/gizlilik" className="hover:text-white">{t("footer.privacy")}</Link></li>
                <li><Link to="/cerez-politikasi" className="hover:text-white">{t("footer.cookiePolicy")}</Link></li>
                <li><Link to="/kvkk-aydinlatma-metni" className="hover:text-white">{t("footer.kvkk")}</Link></li>
              </ul>
            </div>
          </div>
          {/* Ödeme kartları — koyu arka plan (footer ile uyumlu) */}
          <div className="border-t border-gray-600 mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 bg-gray-700 rounded-lg">
            <span className="sr-only">Kabul edilen ödeme kartları:</span>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/visa.svg`} alt="Visa" className="h-10 w-auto object-contain" width="80" height="28" />
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/mastercard.svg`} alt="Mastercard" className="h-10 w-auto object-contain" width="48" height="32" />
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/troy.svg`} alt="Troy" className="h-9 w-auto object-contain" width="90" height="28" />
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/maestro.svg`} alt="Maestro" className="h-9 w-auto object-contain" width="100" height="28" />
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/amex.svg`} alt="American Express" className="h-9 w-auto object-contain" width="90" height="28" />
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/discover.svg`} alt="Discover" className="h-9 w-auto object-contain" width="120" height="28" />
              <img src={`${import.meta.env.BASE_URL}images/payment-cards/diners.svg`} alt="Diners Club" className="h-9 w-auto object-contain" width="130" height="28" />
            </div>
            <p className="text-center text-base text-gray-200 mt-5 space-y-1">
              <span className="block">All transactions are processed via PCI DSS Level 1 certified payment providers.</span>
              <span className="block">We use 256-bit SSL encryption and do not store card data.</span>
            </p>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-sm text-center">
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
}
