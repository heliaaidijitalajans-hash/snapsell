export type AdminUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  plan: string;
  credits: number;
  totalConversions: number;
  createdAt?: number | null;
  _memory?: boolean;
};

export type PlanPrices = Record<string, number>;
export type EnterprisePlan = { id: string; isPro?: boolean; [key: string]: unknown };

export type SitePlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  credits?: number;
};

export type DailyStats = {
  today: { visitors: number; conversions: number; signups: number };
  last7Days: Array<{ date: string; visitors: number; conversions: number; signups: number }>;
  totalVisitors?: number;
};

export type ImageEditEntry = {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  outputUrl: string;
  createdAt: number;
};

export type LoginLogEntry = {
  user_id: string;
  email?: string | null;
  display_name?: string | null;
  logged_at: string | null;
  source?: string;
};

export type Team = {
  id: string;
  name: string;
  memberIds: string[];
  enterprisePlanId?: string | null;
  createdAt?: number;
};

export const ADMIN_TOKEN_KEY = "snapsell_admin_token";
export const PLAN_OPTIONS = ["free", "monthly_plan", "monthly_plan_pro", "yearly_plan", "enterprise", "addon"] as const;

export function formatDate(ts: number | null | undefined): string {
  if (ts == null) return "—";
  try {
    return new Date(ts).toLocaleString("tr-TR");
  } catch {
    return "—";
  }
}

export function getStoredAdminToken(): string | null {
  try {
    const t = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    return t && t.trim() ? t : null;
  } catch {
    return null;
  }
}

export function isPremiumPlan(plan: string | undefined | null): boolean {
  const p = (plan || "").toLowerCase();
  return p === "monthly_plan" || p === "monthly_plan_pro" || p === "yearly_plan" || p === "enterprise" || p === "pro";
}

export function isGoogleUser(u: AdminUser): boolean {
  // Heuristic: Google users often have displayName from OAuth; login logs with google are separate.
  // Prefer email domain / presence of displayName without distinguishing reliably — use login source when available.
  return Boolean(u.displayName && u.email);
}
