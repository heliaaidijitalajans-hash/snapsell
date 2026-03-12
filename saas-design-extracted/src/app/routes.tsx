import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";

function RedirectDashboardToRoot() {
  const loc = useLocation();
  const to = loc.pathname.replace(/^\/dashboard\/?/, "") || "/";
  return <Navigate to={to + loc.search} replace />;
}

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PricingPage = lazy(() => import("./pages/PricingPage").then((m) => ({ default: m.default })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((m) => ({ default: m.default })));
const ExamplesPage = lazy(() => import("./pages/ExamplesPage").then((m) => ({ default: m.ExamplesPage })));
const SupportPage = lazy(() => import("./pages/SupportPage").then((m) => ({ default: m.SupportPage })));
const FAQPage = lazy(() => import("./pages/FAQPage").then((m) => ({ default: m.FAQPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const DistanceSalesPage = lazy(() => import("./pages/DistanceSalesPage").then((m) => ({ default: m.DistanceSalesPage })));
const PreliminaryInfoPage = lazy(() => import("./pages/PreliminaryInfoPage").then((m) => ({ default: m.PreliminaryInfoPage })));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage").then((m) => ({ default: m.RefundPolicyPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage").then((m) => ({ default: m.CookiePolicyPage })));
const KvkkPage = lazy(() => import("./pages/KvkkPage").then((m) => ({ default: m.KvkkPage })));
const EditorReplicatePage = lazy(() => import("./pages/EditorReplicatePage").then((m) => ({ default: m.EditorReplicatePage })));
const LibraryPage = lazy(() => import("./pages/LibraryPage").then((m) => ({ default: m.LibraryPage })));
const AccountPage = lazy(() => import("./pages/AccountPage").then((m) => ({ default: m.AccountPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-gray-500">Yükleniyor…</div>
    </div>
  );
}

export const router = createBrowserRouter(
  [
    { path: "/dashboard", element: <Navigate to="/" replace /> },
    { path: "/dashboard/*", element: <RedirectDashboardToRoot /> },
    { path: "/register", element: <Navigate to="/login" replace /> },
    {
      path: "/",
      Component: Layout,
      errorElement: <ErrorBoundary />,
      children: [
        { index: true, element: <Suspense fallback={<PageFallback />}><HomePage /></Suspense> },
        { path: "login", element: <Suspense fallback={<PageFallback />}><LoginPage /></Suspense> },
        { path: "admin", element: <Suspense fallback={<PageFallback />}><AdminPage /></Suspense> },
        { path: "ornekler", element: <Suspense fallback={<PageFallback />}><ExamplesPage /></Suspense> },
        { path: "fiyatlandirma", element: <Suspense fallback={<PageFallback />}><PricingPage /></Suspense> },
        { path: "odeme", element: <Suspense fallback={<PageFallback />}><CheckoutPage /></Suspense> },
        { path: "destek", element: <Suspense fallback={<PageFallback />}><SupportPage /></Suspense> },
        { path: "sss", element: <Suspense fallback={<PageFallback />}><FAQPage /></Suspense> },
        { path: "editor", element: <Navigate to="/gorsel-duzenleme" replace /> },
        { path: "gorsel-duzenleme", element: <Suspense fallback={<PageFallback />}><EditorReplicatePage /></Suspense> },
        { path: "kutuphane", element: <Suspense fallback={<PageFallback />}><LibraryPage /></Suspense> },
        { path: "hesap-ayarlari", element: <Suspense fallback={<PageFallback />}><AccountPage /></Suspense> },
        { path: "hakkimizda", element: <Suspense fallback={<PageFallback />}><AboutPage /></Suspense> },
        { path: "kullanim-kosullari", element: <Suspense fallback={<PageFallback />}><TermsPage /></Suspense> },
        { path: "mesafeli-satis-sozlesmesi", element: <Suspense fallback={<PageFallback />}><DistanceSalesPage /></Suspense> },
        { path: "on-bilgilendirme-formu", element: <Suspense fallback={<PageFallback />}><PreliminaryInfoPage /></Suspense> },
        { path: "iptal-iade-politikasi", element: <Suspense fallback={<PageFallback />}><RefundPolicyPage /></Suspense> },
        { path: "gizlilik", element: <Suspense fallback={<PageFallback />}><PrivacyPage /></Suspense> },
        { path: "cerez-politikasi", element: <Suspense fallback={<PageFallback />}><CookiePolicyPage /></Suspense> },
        { path: "kvkk-aydinlatma-metni", element: <Suspense fallback={<PageFallback />}><KvkkPage /></Suspense> },
      ],
    },
  ],
);
