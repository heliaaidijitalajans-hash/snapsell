import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  FileText,
  Scale,
  Headphones,
  Megaphone,
  ScrollText,
  UserCog,
  FlaskConical,
} from "lucide-react";
import { useAdmin } from "./AdminContext";
import { useRbac } from "./rbac/RbacContext";
import { permissionForPath, ROLE_META } from "./rbac/permissions";
import { RequirePermission } from "./components/RequirePermission";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  children?: { to: string; label: string }[];
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/test-donusumu", label: "Test Dönüşümü", icon: FlaskConical },
  {
    to: "/admin/users",
    label: "User Management",
    icon: Users,
    children: [
      { to: "/admin/users", label: "All Users" },
      { to: "/admin/users/premium", label: "Premium Users" },
      { to: "/admin/users/google", label: "Google Users" },
      { to: "/admin/users/email", label: "Email Users" },
    ],
  },
  {
    to: "/admin/images",
    label: "AI Images",
    icon: ImageIcon,
    children: [
      { to: "/admin/images/generated", label: "Generated Images" },
      { to: "/admin/images", label: "History" },
      { to: "/admin/images/failed", label: "Failed Jobs" },
    ],
  },
  {
    to: "/admin/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
    children: [
      { to: "/admin/subscriptions", label: "Plans" },
      { to: "/admin/subscriptions/credits", label: "Credits" },
      { to: "/admin/subscriptions/coupons", label: "Coupons" },
      { to: "/admin/subscriptions/payments", label: "Revenue" },
      { to: "/admin/subscriptions/active", label: "Subscribers" },
    ],
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    children: [
      { to: "/admin/analytics", label: "Overview" },
      { to: "/admin/analytics/revenue", label: "Revenue" },
      { to: "/admin/analytics/traffic", label: "Traffic" },
      { to: "/admin/analytics/conversions", label: "Generations" },
      { to: "/admin/analytics/users", label: "Daily Users" },
    ],
  },
  {
    to: "/admin/content",
    label: "Content Management",
    icon: FileText,
    children: [
      { to: "/admin/content", label: "Overview" },
      { to: "/admin/content/homepage", label: "Homepage" },
      { to: "/admin/content/pricing", label: "Pricing" },
      { to: "/admin/content/faq", label: "FAQ" },
      { to: "/admin/content/email", label: "Email Templates" },
      { to: "/admin/content/website", label: "Website Texts" },
      { to: "/admin/content/app", label: "App Texts" },
    ],
  },
  {
    to: "/admin/legal",
    label: "Legal Center",
    icon: Scale,
    children: [
      { to: "/admin/legal", label: "All Documents" },
      { to: "/admin/legal/terms", label: "Terms of Service" },
      { to: "/admin/legal/privacy", label: "Privacy Policy" },
      { to: "/admin/legal/cookies", label: "Cookie Policy" },
      { to: "/admin/legal/refund", label: "Refund Policy" },
      { to: "/admin/legal/ai-usage", label: "AI Usage Policy" },
      { to: "/admin/legal/community", label: "Community Guidelines" },
    ],
  },
  {
    to: "/admin/support",
    label: "Contact & Support",
    icon: Headphones,
    children: [
      { to: "/admin/support", label: "Contact Information" },
      { to: "/admin/support/inbox", label: "Support Inbox" },
      { to: "/admin/support/faq", label: "FAQ Management" },
      { to: "/admin/support/social", label: "Social Media" },
    ],
  },
  {
    to: "/admin/announcements",
    label: "Announcement Center",
    icon: Megaphone,
  },
  {
    to: "/admin/audit",
    label: "Audit Logs",
    icon: ScrollText,
  },
  {
    to: "/admin/administrators",
    label: "Administrators",
    icon: UserCog,
  },
  {
    to: "/admin/settings",
    label: "System Settings",
    icon: Settings,
    children: [
      { to: "/admin/settings", label: "Application" },
      { to: "/admin/settings/supabase", label: "Supabase" },
      { to: "/admin/settings/smtp", label: "SMTP" },
      { to: "/admin/settings/oauth", label: "OAuth" },
      { to: "/admin/settings/api", label: "API Keys" },
      { to: "/admin/settings/flags", label: "Feature Flags" },
      { to: "/admin/settings/maintenance", label: "Maintenance Mode" },
    ],
  },
];

function canSeePath(can: (p: import("./rbac/permissions").Permission | import("./rbac/permissions").Permission[]) => boolean, path: string) {
  const needed = permissionForPath(path);
  if (!needed) return true;
  return can(needed);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useRbac();
  const [open, setOpen] = useState<Record<string, boolean>>({
    "/admin/users": true,
  });

  const visibleNav = useMemo(() => {
    return NAV.map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((c) => canSeePath(can, c.to));
        if (children.length === 0 && !canSeePath(can, item.to)) return null;
        return { ...item, children: children.length ? children : undefined };
      }
      return canSeePath(can, item.to) ? item : null;
    }).filter(Boolean) as NavItem[];
  }, [can]);

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const hasChildren = Boolean(item.children?.length);
        const isGroupOpen = open[item.to];

        return (
          <div key={item.to}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setOpen((p) => ({ ...p, [item.to]: !p[item.to] }))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left truncate">{item.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isGroupOpen ? "rotate-180" : ""}`} />
              </button>
            ) : (
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#FF5A5F]/15 text-[#FF5A5F]"
                      : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )}

            <AnimatePresence initial={false}>
              {hasChildren && isGroupOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ml-3 pl-3 border-l border-white/[0.08]"
                >
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.to + child.label}
                      to={child.to}
                      end={child.to === item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-[13px] transition-colors ${
                          isActive ? "text-[#FF5A5F] font-medium" : "text-white/45 hover:text-white/80"
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell() {
  const { handleLogout, localOnly } = useAdmin();
  const { session } = useRbac();
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLabel = session?.roles.map((r) => ROLE_META[r]?.label || r).join(", ") || "Admin";

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0B0B0B] sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-[#FF5A5F]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#FF5A5F]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white tracking-tight">SnapSell</p>
            <p className="text-[11px] text-white/40 uppercase tracking-wider truncate">{roleLabel}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarNav />
        </div>
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          {session && (
            <p className="px-3 text-[11px] text-white/35 truncate" title={session.email}>
              {session.name || session.email}
              {localOnly ? " · local" : ""}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-[#0B0B0B] border-r border-white/[0.08] lg:hidden"
            >
              <div className="px-5 py-5 flex items-center justify-between border-b border-white/[0.06]">
                <span className="font-bold text-[#FF5A5F]">SnapSell Admin</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#0B0B0B]/90 backdrop-blur-md">
          <button type="button" onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white">Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <RequirePermission>
            <Outlet />
          </RequirePermission>
        </main>
      </div>
    </div>
  );
}
