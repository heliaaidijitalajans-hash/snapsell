import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getApiBase } from "../config";
import {
  ADMIN_TOKEN_KEY,
  type AdminUser,
  type DailyStats,
  type EnterprisePlan,
  type ImageEditEntry,
  type LoginLogEntry,
  type PlanPrices,
  type SitePlan,
  type Team,
  getStoredAdminToken,
} from "./types";
import { appendAudit } from "./lib/workspace";
import { useRbac } from "./rbac/RbacContext";

type AdminContextValue = {
  authenticated: boolean | null;
  /** True when signed in via local RBAC only (no server admin token). */
  localOnly: boolean;
  /** Server admin token from /api/admin/login (ADMIN_PASSWORD). Null for local-only RBAC sessions. */
  adminToken: string | null;
  loading: boolean;
  password: string;
  setPassword: (v: string) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginError: string;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;

  users: AdminUser[];
  planPrices: PlanPrices;
  enterprisePlans: EnterprisePlan[];
  sitePlans: SitePlan[];
  dailyStats: DailyStats | null;
  subscribersMonthly: AdminUser[];
  subscribersYearly: AdminUser[];
  teams: Team[];
  imageEdits: ImageEditEntry[];
  loginLogs: LoginLogEntry[];

  userSearch: string;
  setUserSearch: (v: string) => void;
  savingPlan: string | null;
  handlePlanChange: (userId: string, plan: string) => Promise<void>;

  plansEdit: PlanPrices;
  setPlansEdit: React.Dispatch<React.SetStateAction<PlanPrices>>;
  sitePlansEdit: SitePlan[];
  setSitePlansEdit: React.Dispatch<React.SetStateAction<SitePlan[]>>;
  enterprisePlansEdit: string;
  setEnterprisePlansEdit: (v: string) => void;
  savingPlans: boolean;
  resettingPlans: boolean;
  plansSaveMessage: string;
  handleSaveAllPlans: () => Promise<void>;
  handleResetPlansToDefault: () => Promise<void>;
  updateSitePlan: (index: number, field: keyof SitePlan, value: string | string[] | boolean | number) => void;

  teamName: string;
  setTeamName: (v: string) => void;
  savingTeam: boolean;
  handleCreateTeam: () => Promise<void>;
  handleDeleteTeam: (id: string) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const { setSessionFromServerLogin, tryLocalLogin, clearSession, session } = useRbac();
  const [adminToken, setAdminToken] = useState<string | null>(() => getStoredAdminToken());
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [planPrices, setPlanPrices] = useState<PlanPrices>({});
  const [enterprisePlans, setEnterprisePlans] = useState<EnterprisePlan[]>([]);
  const [sitePlans, setSitePlans] = useState<SitePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [plansEdit, setPlansEdit] = useState<PlanPrices>({});
  const [sitePlansEdit, setSitePlansEdit] = useState<SitePlan[]>([]);
  const [enterprisePlansEdit, setEnterprisePlansEdit] = useState("");
  const [savingPlans, setSavingPlans] = useState(false);
  const [resettingPlans, setResettingPlans] = useState(false);
  const [plansSaveMessage, setPlansSaveMessage] = useState("");
  const plansVersionRef = useRef(0);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [subscribersMonthly, setSubscribersMonthly] = useState<AdminUser[]>([]);
  const [subscribersYearly, setSubscribersYearly] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [imageEdits, setImageEdits] = useState<ImageEditEntry[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([]);

  const adminFetch = useCallback(
    async (url: string, opts: RequestInit = {}, overrideToken?: string | null) => {
      const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
      const token = overrideToken !== undefined ? overrideToken : adminToken;
      if (token) headers.Authorization = "Bearer " + token;
      return fetch(getApiBase() + "/api" + url, {
        ...opts,
        credentials: "omit",
        headers,
      });
    },
    [adminToken]
  );

  const checkAuth = useCallback(async () => {
    try {
      const r = await adminFetch("/admin/me");
      return r.ok;
    } catch {
      return false;
    }
  }, [adminFetch]);

  const loadUsers = useCallback(
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/users", {}, overrideToken);
      if (r.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await r.json().catch(() => ({}));
      setUsers(data.users || []);
    },
    [adminFetch]
  );

  const loadPlans = useCallback(
    async (overrideToken?: string | null, versionAtStart?: number) => {
      const r = await adminFetch("/admin/plans", {}, overrideToken);
      if (!r.ok) return;
      if (versionAtStart !== undefined && versionAtStart !== plansVersionRef.current) return;
      const data = await r.json().catch(() => ({}));
      if (versionAtStart !== undefined && versionAtStart !== plansVersionRef.current) return;
      const prices = data.planPrices || {};
      setPlanPrices(prices);
      setPlansEdit(prices);
      setEnterprisePlans(Array.isArray(data.enterprisePlans) ? data.enterprisePlans : []);
      setEnterprisePlansEdit(
        Array.isArray(data.enterprisePlans) ? JSON.stringify(data.enterprisePlans, null, 2) : "[]"
      );
      const site = Array.isArray(data.sitePlans) ? data.sitePlans : [];
      setSitePlans(site);
      const defaultCredits: Record<string, number> = {
        free: 30,
        monthly_plan: 300,
        monthly_plan_pro: 800,
        yearly_plan: 12000,
        enterprise: 0,
        addon: 250,
      };
      setSitePlansEdit(
        site.length
          ? site.map((p: SitePlan) => ({
              ...p,
              features: p.features || [],
              credits: typeof p.credits === "number" ? p.credits : defaultCredits[p.id || ""] ?? 100,
            }))
          : []
      );
    },
    [adminFetch]
  );

  const loadStats = useCallback(
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/stats", {}, overrideToken);
      if (!r.ok) return;
      const data = await r.json().catch(() => ({}));
      setDailyStats({
        today: data.today || { visitors: 0, conversions: 0, signups: 0 },
        last7Days: data.last7Days || [],
        totalVisitors: typeof data.totalVisitors === "number" ? data.totalVisitors : undefined,
      });
    },
    [adminFetch]
  );

  const loadSubscribers = useCallback(
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/subscribers", {}, overrideToken);
      if (!r.ok) return;
      const data = await r.json().catch(() => ({}));
      setSubscribersMonthly(data.monthly || []);
      setSubscribersYearly(data.yearly || []);
    },
    [adminFetch]
  );

  const loadTeams = useCallback(
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/teams", {}, overrideToken);
      if (!r.ok) return;
      const data = await r.json().catch(() => ({}));
      setTeams(data.teams || []);
    },
    [adminFetch]
  );

  const loadImageEdits = useCallback(
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/image-edits", {}, overrideToken);
      if (!r.ok) return;
      const data = await r.json().catch(() => ({}));
      setImageEdits(Array.isArray(data.edits) ? data.edits : []);
    },
    [adminFetch]
  );

  const loadLoginLogs = useCallback(
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/logins", {}, overrideToken);
      if (!r.ok) return;
      const data = await r.json().catch(() => ({}));
      setLoginLogs(Array.isArray(data.logins) ? data.logins : Array.isArray(data.logs) ? data.logs : []);
    },
    [adminFetch]
  );

  useEffect(() => {
    let cancelled = false;
    const plansVer = plansVersionRef.current;
    (async () => {
      try {
        const ok = await checkAuth();
        if (cancelled) return;
        if (ok) {
          setAuthenticated(true);
          setLocalOnly(false);
          setSessionFromServerLogin(loginEmail || undefined);
          await Promise.all([
            loadUsers(),
            loadPlans(undefined, plansVer),
            loadStats(),
            loadSubscribers(),
            loadTeams(),
            loadImageEdits(),
            loadLoginLogs(),
          ]);
        } else if (session) {
          // Restored local RBAC session (no server token)
          setAuthenticated(true);
          setLocalOnly(true);
        } else {
          setAuthenticated(false);
          setLocalOnly(false);
        }
      } catch {
        if (!cancelled) {
          if (session) {
            setAuthenticated(true);
            setLocalOnly(true);
          } else {
            setAuthenticated(false);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once on mount
  }, [checkAuth, loadUsers, loadPlans, loadStats, loadSubscribers, loadTeams, loadImageEdits, loadLoginLogs]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const email = loginEmail.trim();

    // 1) Local administrator (email + password) when email is provided
    if (email) {
      const local = await tryLocalLogin(email, password);
      if (local.ok) {
        setLocalOnly(true);
        setAuthenticated(true);
        setPassword("");
        return;
      }
      // Fall through to server login (Super Admin may use email + master password)
    }

    try {
      const r = await fetch(getApiBase() + "/api/admin/login", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.error) {
        appendAudit({
          admin: email || "unknown",
          action: "Failed login",
          target: "server",
          status: "warning",
          meta: String(data.error),
        });
        setLoginError(email ? "Invalid email or password" : data.error);
        return;
      }
      const token =
        (data.token && String(data.token).trim()) || (password && String(password).trim()) || "";
      if (token) {
        try {
          sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        } catch {
          /* ignore */
        }
        setAdminToken(token);
      }
      setLocalOnly(false);
      setAuthenticated(true);
      setSessionFromServerLogin(email || undefined);
      await Promise.all([
        loadUsers(token || undefined),
        loadPlans(token || undefined),
        loadStats(token || undefined),
        loadSubscribers(token || undefined),
        loadTeams(token || undefined),
        loadImageEdits(token || undefined),
        loadLoginLogs(token || undefined),
      ]);
      setPassword("");
    } catch {
      appendAudit({ admin: email || "unknown", action: "Failed login", target: "server", status: "warning" });
      setLoginError("Bağlantı hatası");
    }
  };

  const handleLogout = async () => {
    try {
      if (!localOnly) await adminFetch("/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearSession();
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setAdminToken(null);
    setLocalOnly(false);
    setAuthenticated(false);
  };

  const handlePlanChange = async (userId: string, plan: string) => {
    setSavingPlan(userId);
    try {
      const r = await adminFetch("/admin/users/" + encodeURIComponent(userId) + "/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, plan, credits: data.credits ?? u.credits } : u))
        );
      }
    } finally {
      setSavingPlan(null);
    }
  };

  const handleSaveAllPlans = async () => {
    setPlansSaveMessage("");
    setSavingPlans(true);
    try {
      let enterpriseParsed: EnterprisePlan[] = [];
      try {
        enterpriseParsed = JSON.parse(enterprisePlansEdit || "[]");
        if (!Array.isArray(enterpriseParsed)) enterpriseParsed = [];
      } catch {
        setPlansSaveMessage("Kurumsal planlar geçerli JSON olmalı.");
        setSavingPlans(false);
        return;
      }
      const r = await adminFetch("/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planPrices: plansEdit,
          sitePlans: sitePlansEdit,
          enterprisePlans: enterpriseParsed,
        }),
      });
      const data = await r.json();
      const success = r.ok && (data.ok === true || data.planPrices != null || Array.isArray(data.sitePlans));
      if (success) {
        if (data.planPrices && typeof data.planPrices === "object") {
          setPlanPrices(data.planPrices);
          setPlansEdit(data.planPrices);
        }
        if (Array.isArray(data.sitePlans)) {
          setSitePlans(data.sitePlans);
          setSitePlansEdit(data.sitePlans);
        }
        if (Array.isArray(data.enterprisePlans)) {
          setEnterprisePlans(data.enterprisePlans);
          setEnterprisePlansEdit(JSON.stringify(data.enterprisePlans, null, 2));
        }
        setPlansSaveMessage("Tüm fiyat planı kaydedildi.");
      } else {
        setPlansSaveMessage(data.error || data.message || "Kaydetme hatası.");
      }
    } catch {
      setPlansSaveMessage("Bağlantı hatası.");
    } finally {
      setSavingPlans(false);
    }
  };

  const handleResetPlansToDefault = async () => {
    if (!confirm("Planlar ve fiyatlar kod içi varsayılana sıfırlanacak. Devam?")) return;
    setPlansSaveMessage("");
    setResettingPlans(true);
    try {
      const r = await adminFetch("/admin/plans/reset", { method: "POST" });
      const data = await r.json().catch(() => ({}));
      const success = r.ok && (data.ok === true || data.planPrices != null || Array.isArray(data.sitePlans));
      if (success) {
        plansVersionRef.current += 1;
        if (data.planPrices && typeof data.planPrices === "object") {
          setPlanPrices(data.planPrices);
          setPlansEdit(data.planPrices);
        }
        if (Array.isArray(data.sitePlans)) {
          setSitePlans(data.sitePlans);
          setSitePlansEdit(data.sitePlans);
        }
        if (Array.isArray(data.enterprisePlans)) {
          setEnterprisePlans(data.enterprisePlans);
          setEnterprisePlansEdit(JSON.stringify(data.enterprisePlans, null, 2));
        }
        setPlansSaveMessage("Planlar varsayılana sıfırlandı. Fiyatlandırma sayfası güncel.");
      } else {
        setPlansSaveMessage(data.error || data.message || "Sıfırlama hatası.");
      }
    } catch (e) {
      setPlansSaveMessage("Bağlantı hatası: " + (e instanceof Error ? e.message : "bilinmeyen"));
    } finally {
      setResettingPlans(false);
    }
  };

  const handleCreateTeam = async () => {
    const name = teamName.trim() || "Yeni Takım";
    setSavingTeam(true);
    try {
      const r = await adminFetch("/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await r.json();
      if (r.ok && data.team) {
        setTeams((prev) => [...prev, data.team]);
        setTeamName("");
        await loadTeams();
      }
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Bu takımı silmek istediğinize emin misiniz?")) return;
    const r = await adminFetch("/admin/teams/" + id, { method: "DELETE" });
    if (r.ok) setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const updateSitePlan = (index: number, field: keyof SitePlan, value: string | string[] | boolean | number) => {
    setSitePlansEdit((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const value: AdminContextValue = {
    authenticated,
    localOnly,
    adminToken,
    loading,
    password,
    setPassword,
    loginEmail,
    setLoginEmail,
    loginError,
    handleLogin,
    handleLogout,
    users,
    planPrices,
    enterprisePlans,
    sitePlans,
    dailyStats,
    subscribersMonthly,
    subscribersYearly,
    teams,
    imageEdits,
    loginLogs,
    userSearch,
    setUserSearch,
    savingPlan,
    handlePlanChange,
    plansEdit,
    setPlansEdit,
    sitePlansEdit,
    setSitePlansEdit,
    enterprisePlansEdit,
    setEnterprisePlansEdit,
    savingPlans,
    resettingPlans,
    plansSaveMessage,
    handleSaveAllPlans,
    handleResetPlansToDefault,
    updateSitePlan,
    teamName,
    setTeamName,
    savingTeam,
    handleCreateTeam,
    handleDeleteTeam,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
