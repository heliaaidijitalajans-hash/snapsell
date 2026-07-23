import { useState } from "react";
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
} from "lucide-react";
import { useAdmin } from "./AdminContext";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  children?: { to: string; label: string }[];
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    children: [
      { to: "/admin/users", label: "All Users" },
      { to: "/admin/users/google", label: "Google Sign-ins" },
      { to: "/admin/users/email", label: "Email Users" },
      { to: "/admin/users/premium", label: "Premium Users" },
    ],
  },
  {
    to: "/admin/images",
    label: "AI Images",
    icon: ImageIcon,
    children: [
      { to: "/admin/images", label: "Image History" },
      { to: "/admin/images/generated", label: "Generated Images" },
      { to: "/admin/images/failed", label: "Failed Jobs" },
    ],
  },
  {
    to: "/admin/subscriptions",
    label: "Subscription",
    icon: CreditCard,
    children: [
      { to: "/admin/subscriptions", label: "Plans" },
      { to: "/admin/subscriptions/active", label: "Active Subscribers" },
      { to: "/admin/subscriptions/payments", label: "Payments" },
    ],
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    children: [
      { to: "/admin/analytics", label: "Overview" },
      { to: "/admin/analytics/users", label: "User Analytics" },
      { to: "/admin/analytics/conversions", label: "Conversion Analytics" },
      { to: "/admin/analytics/revenue", label: "Revenue" },
      { to: "/admin/analytics/traffic", label: "Traffic" },
    ],
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
    children: [
      { to: "/admin/settings", label: "System Settings" },
      { to: "/admin/settings/supabase", label: "Supabase" },
      { to: "/admin/settings/api", label: "API Keys" },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    "/admin/users": true,
    "/admin/images": false,
    "/admin/subscriptions": false,
    "/admin/analytics": false,
    "/admin/settings": false,
  });

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV.map((item) => {
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
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
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
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {item.label}
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
                        `block px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? "text-[#FF5A5F] font-medium" : "text-white/50 hover:text-white/80"
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
  const { handleLogout } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0B0B0B]/95 sticky top-0 h-screen">
        <div className="px-5 py-6 flex items-center gap-2.5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-[#FF5A5F]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#FF5A5F]" />
          </div>
          <div>
            <p className="font-bold text-white tracking-tight">SnapSell</p>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">Admin</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="p-4 border-t border-white/[0.06]">
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

      {/* Mobile drawer */}
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
              <div className="p-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/60"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
