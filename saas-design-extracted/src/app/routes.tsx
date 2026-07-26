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
const LibrarySessionPage = lazy(() =>
  import("./pages/LibrarySessionPage").then((m) => ({ default: m.LibrarySessionPage }))
);
const AccountPage = lazy(() => import("./pages/AccountPage").then((m) => ({ default: m.AccountPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));

const AdminApp = lazy(() => import("./admin/AdminApp").then((m) => ({ default: m.AdminApp })));
const AdminDashboardPage = lazy(() =>
  import("./admin/pages/DashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminUsersPage = lazy(() =>
  import("./admin/pages/UsersPage").then((m) => ({ default: m.AdminUsersPage }))
);
const AdminImagesPage = lazy(() =>
  import("./admin/pages/ImagesPage").then((m) => ({ default: m.AdminImagesPage }))
);
const AdminSubscriptionsPage = lazy(() =>
  import("./admin/pages/SubscriptionsPage").then((m) => ({ default: m.AdminSubscriptionsPage }))
);
const AdminAnalyticsPage = lazy(() =>
  import("./admin/pages/AnalyticsPage").then((m) => ({ default: m.AdminAnalyticsPage }))
);
const AdminSettingsPage = lazy(() =>
  import("./admin/pages/SettingsPage").then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminContentPage = lazy(() =>
  import("./admin/pages/ContentPage").then((m) => ({ default: m.AdminContentPage }))
);
const AdminLegalPage = lazy(() =>
  import("./admin/pages/LegalPage").then((m) => ({ default: m.AdminLegalPage }))
);
const AdminSupportPage = lazy(() =>
  import("./admin/pages/SupportPage").then((m) => ({ default: m.AdminSupportPage }))
);
const AdminAnnouncementsPage = lazy(() =>
  import("./admin/pages/AnnouncementsPage").then((m) => ({ default: m.AdminAnnouncementsPage }))
);
const AdminAuditPage = lazy(() =>
  import("./admin/pages/AuditPage").then((m) => ({ default: m.AdminAuditPage }))
);
const AdminAdministratorsPage = lazy(() =>
  import("./admin/pages/AdministratorsPage").then((m) => ({ default: m.AdministratorsPage }))
);
const AdminTestTransformPage = lazy(() =>
  import("./admin/pages/TestTransformPage").then((m) => ({ default: m.AdminTestTransformPage }))
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] bg-[#0B0B0B]">
      <div className="animate-pulse text-white/40">Yükleniyor…</div>
    </div>
  );
}

function AdminSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter(
  [
    { path: "/dashboard", element: <Navigate to="/" replace /> },
    { path: "/dashboard/*", element: <RedirectDashboardToRoot /> },
    { path: "/register", element: <Navigate to="/login" replace /> },
    {
      path: "/admin",
      element: (
        <AdminSuspense>
          <AdminApp />
        </AdminSuspense>
      ),
      errorElement: <ErrorBoundary />,
      children: [
        { index: true, element: <AdminSuspense><AdminDashboardPage /></AdminSuspense> },
        { path: "test-donusumu", element: <AdminSuspense><AdminTestTransformPage /></AdminSuspense> },
        { path: "users", element: <AdminSuspense><AdminUsersPage /></AdminSuspense> },
        { path: "users/:filter", element: <AdminSuspense><AdminUsersPage /></AdminSuspense> },
        { path: "images", element: <AdminSuspense><AdminImagesPage /></AdminSuspense> },
        { path: "images/:filter", element: <AdminSuspense><AdminImagesPage /></AdminSuspense> },
        { path: "subscriptions", element: <AdminSuspense><AdminSubscriptionsPage /></AdminSuspense> },
        { path: "subscriptions/:section", element: <AdminSuspense><AdminSubscriptionsPage /></AdminSuspense> },
        { path: "analytics", element: <AdminSuspense><AdminAnalyticsPage /></AdminSuspense> },
        { path: "analytics/:section", element: <AdminSuspense><AdminAnalyticsPage /></AdminSuspense> },
        { path: "content", element: <AdminSuspense><AdminContentPage /></AdminSuspense> },
        { path: "content/:section", element: <AdminSuspense><AdminContentPage /></AdminSuspense> },
        { path: "legal", element: <AdminSuspense><AdminLegalPage /></AdminSuspense> },
        { path: "legal/:section", element: <AdminSuspense><AdminLegalPage /></AdminSuspense> },
        { path: "support", element: <AdminSuspense><AdminSupportPage /></AdminSuspense> },
        { path: "support/:section", element: <AdminSuspense><AdminSupportPage /></AdminSuspense> },
        { path: "announcements", element: <AdminSuspense><AdminAnnouncementsPage /></AdminSuspense> },
        { path: "audit", element: <AdminSuspense><AdminAuditPage /></AdminSuspense> },
        { path: "administrators", element: <AdminSuspense><AdminAdministratorsPage /></AdminSuspense> },
        { path: "settings", element: <AdminSuspense><AdminSettingsPage /></AdminSuspense> },
        { path: "settings/:section", element: <AdminSuspense><AdminSettingsPage /></AdminSuspense> },
        { path: "*", element: <Navigate to="/admin" replace /> },
      ],
    },
    {
      path: "/",
      Component: Layout,
      errorElement: <ErrorBoundary />,
      children: [
        { index: true, element: <Suspense fallback={<PageFallback />}><HomePage /></Suspense> },
        { path: "login", element: <Suspense fallback={<PageFallback />}><LoginPage /></Suspense> },
        { path: "ornekler", element: <Suspense fallback={<PageFallback />}><ExamplesPage /></Suspense> },
        { path: "fiyatlandirma", element: <Suspense fallback={<PageFallback />}><PricingPage /></Suspense> },
        { path: "odeme", element: <Navigate to="/fiyatlandirma" replace /> },
        { path: "destek", element: <Suspense fallback={<PageFallback />}><SupportPage /></Suspense> },
        { path: "sss", element: <Suspense fallback={<PageFallback />}><FAQPage /></Suspense> },
        { path: "editor", element: <Navigate to="/gorsel-duzenleme" replace /> },
        { path: "gorsel-duzenleme", element: <Suspense fallback={<PageFallback />}><EditorReplicatePage /></Suspense> },
        { path: "kutuphane", element: <Suspense fallback={<PageFallback />}><LibraryPage /></Suspense> },
        { path: "kutuphane/:imageId", element: <Suspense fallback={<PageFallback />}><LibrarySessionPage /></Suspense> },
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
