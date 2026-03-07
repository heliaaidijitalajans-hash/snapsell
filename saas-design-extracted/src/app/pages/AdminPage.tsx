import { useState, useEffect, useCallback } from "react";
import {
  LogOut,
  Users,
  TrendingUp,
  CreditCard,
  Loader2,
  Shield,
  Search,
  Save,
  LayoutDashboard,
  BarChart3,
  Calendar,
  Building2,
  Plus,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { getApiBase } from "../config";

type User = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  plan: string;
  credits: number;
  totalConversions: number;
  createdAt?: number | null;
  _memory?: boolean;
};

type PlanPrices = Record<string, number>;
type EnterprisePlan = { id: string; isPro?: boolean; [key: string]: unknown };

type SitePlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  /** Plan seçildiğinde kullanıcıya tanımlanacak kredi (dönüşüm hakkı = kredi/10). Admin buradan günceller, ödeme sonrası otomatik uygulanır. */
  credits?: number;
};

function formatDate(ts: number | null | undefined): string {
  if (ts == null) return "—";
  try {
    return new Date(ts).toLocaleString("tr-TR");
  } catch {
    return "—";
  }
}

type Subscriber = User;
type Team = { id: string; name: string; memberIds: string[]; enterprisePlanId?: string | null; createdAt?: number };
type DailyStats = { today: { visitors: number; conversions: number; signups: number }; last7Days: Array<{ date: string; visitors: number; conversions: number; signups: number }> };
type ImageEditEntry = { userId: string; email?: string | null; displayName?: string | null; outputUrl: string; createdAt: number };

const ADMIN_TOKEN_KEY = "snapsell_admin_token";

function getStoredAdminToken(): string | null {
  try {
    const t = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    return t && t.trim() ? t : null;
  } catch {
    return null;
  }
}

export function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(() => getStoredAdminToken());
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
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
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [subscribersMonthly, setSubscribersMonthly] = useState<Subscriber[]>([]);
  const [subscribersYearly, setSubscribersYearly] = useState<Subscriber[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [imageEdits, setImageEdits] = useState<ImageEditEntry[]>([]);

  const adminFetch = useCallback(
    async (url: string, opts: RequestInit = {}, overrideToken?: string | null) => {
      const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
      const token = overrideToken !== undefined ? overrideToken : adminToken;
      if (token) headers.Authorization = "Bearer " + token;
      return fetch(getApiBase() + url, {
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
    async (overrideToken?: string | null) => {
      const r = await adminFetch("/admin/plans", {}, overrideToken);
      if (!r.ok) return;
      const data = await r.json().catch(() => ({}));
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
              credits:
                typeof p.credits === "number" ? p.credits : defaultCredits[p.id || ""] ?? 100,
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await checkAuth();
        if (cancelled) return;
        setAuthenticated(ok);
        if (ok) {
          await Promise.all([loadUsers(), loadPlans(), loadStats(), loadSubscribers(), loadTeams(), loadImageEdits()]);
        }
      } catch (_) {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkAuth, loadUsers, loadPlans, loadStats, loadSubscribers, loadTeams, loadImageEdits]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const r = await fetch(getApiBase() + "/admin/login", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.error) {
        setLoginError(data.error);
        return;
      }
      const token =
        (data.token && String(data.token).trim()) || (password && String(password).trim()) || "";
      if (token) {
        try {
          sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        } catch (_) {}
        setAdminToken(token);
      }
      setAuthenticated(true);
      await Promise.all([
        loadUsers(token || undefined),
        loadPlans(token || undefined),
        loadStats(token || undefined),
        loadSubscribers(token || undefined),
        loadTeams(token || undefined),
        loadImageEdits(token || undefined),
      ]);
    } catch {
      setLoginError("Bağlantı hatası");
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch("/admin/logout", { method: "POST" });
    } catch (_) {}
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch (_) {}
    setAdminToken(null);
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
      if (r.ok && data.ok) {
        setPlanPrices(data.planPrices || plansEdit);
        setPlansEdit(data.planPrices || plansEdit);
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
        setPlansSaveMessage("Kaydetme hatası.");
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
      if (r.ok && data.ok) {
        if (data.planPrices) setPlanPrices(data.planPrices);
        if (data.planPrices) setPlansEdit(data.planPrices);
        if (Array.isArray(data.sitePlans)) {
          setSitePlans(data.sitePlans);
          setSitePlansEdit(data.sitePlans);
        }
        setPlansSaveMessage("Planlar varsayılana sıfırlandı. Fiyatlandırma sayfası güncel.");
      } else {
        const msg = data.error || data.message || "Sıfırlama hatası.";
        setPlansSaveMessage(msg);
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

  const planOptions = ["free", "monthly_plan", "monthly_plan_pro", "yearly_plan", "enterprise", "addon"];
  const totalConversions = users.reduce((s, u) => s + (u.totalConversions ?? 0), 0);
  const uniquePlans = new Set(users.map((u) => u.plan).filter(Boolean)).size;

  const searchLower = userSearch.trim().toLowerCase();
  const filteredUsers = searchLower
    ? users.filter(
        (u) =>
          (u.id || "").toLowerCase().includes(searchLower) ||
          (u.email || "").toLowerCase().includes(searchLower) ||
          (u.displayName || "").toLowerCase().includes(searchLower) ||
          (u.plan || "").toLowerCase().includes(searchLower)
      )
    : users;

  if (loading || authenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5A5F] animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-[#FF5A5F]" />
            <h2 className="text-xl font-bold text-gray-900">Admin Girişi</h2>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none mb-2"
              required
            />
            {loginError && <p className="text-sm text-red-500 mb-2">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition"
            >
              Giriş
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Yönetici Paneli</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
        >
          <LogOut className="w-4 h-4" /> Çıkış
        </button>
      </div>

      {/* ——— Panel 1: Özet ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[#FF5A5F]" />
          <h2 className="font-semibold text-gray-800">Özet</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#FF5A5F]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#FF5A5F]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Dönüşüm</p>
              <p className="text-2xl font-bold text-gray-900">{totalConversions}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#FF5A5F]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Farklı Planlar</p>
              <p className="text-2xl font-bold text-gray-900">{uniquePlans}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Panel 2: Günlük istatistikler ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#FF5A5F]" />
          <h2 className="font-semibold text-gray-800">Günlük istatistikler</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">Bugünkü dönüşüm, ziyaretçi ve yeni abone sayıları.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">Günlük ziyaretçi</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats?.today?.visitors ?? 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">Günlük dönüşüm</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats?.today?.conversions ?? 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">Yeni abone (bugün)</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats?.today?.signups ?? 0}</p>
            </div>
          </div>
          {dailyStats?.last7Days && dailyStats.last7Days.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Son 7 gün</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="pb-2">Tarih</th>
                      <th className="pb-2">Ziyaretçi</th>
                      <th className="pb-2">Dönüşüm</th>
                      <th className="pb-2">Yeni kayıt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.last7Days.map((d) => (
                      <tr key={d.date} className="border-t border-gray-100">
                        <td className="py-2">{d.date}</td>
                        <td className="py-2">{d.visitors ?? 0}</td>
                        <td className="py-2">{d.conversions ?? 0}</td>
                        <td className="py-2">{d.signups ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ——— Panel 3: Aylık / Yıllık aboneler ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#FF5A5F]" />
          <h2 className="font-semibold text-gray-800">Aylık ve yıllık aboneler</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Aylık aboneler ({subscribersMonthly.length})</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-600">E-posta / Ad</th>
                      <th className="text-left px-3 py-2 text-gray-600">Plan</th>
                      <th className="text-left px-3 py-2 text-gray-600">Kalan dönüşüm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribersMonthly.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-gray-500">Aylık abone yok</td>
                      </tr>
                    ) : (
                      subscribersMonthly.map((u) => (
                        <tr key={u.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">{u.email || u.displayName || u.id.slice(0, 12)}</td>
                          <td className="px-3 py-2">{u.plan}</td>
                          <td className="px-3 py-2">{u.credits ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Yıllık aboneler ({subscribersYearly.length})</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-600">E-posta / Ad</th>
                      <th className="text-left px-3 py-2 text-gray-600">Plan</th>
                      <th className="text-left px-3 py-2 text-gray-600">Kalan dönüşüm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribersYearly.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-gray-500">Yıllık abone yok</td>
                      </tr>
                    ) : (
                      subscribersYearly.map((u) => (
                        <tr key={u.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">{u.email || u.displayName || u.id.slice(0, 12)}</td>
                          <td className="px-3 py-2">{u.plan}</td>
                          <td className="px-3 py-2">{u.credits ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Panel 4: Kurumsal takımlar ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#FF5A5F]" />
          <h2 className="font-semibold text-gray-800">Kurumsal takımlar</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">Kurumsal müşteriler için takım oluşturun; üye ID'leri ekleyin.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Takım adı"
              className="rounded border border-gray-300 px-3 py-2 text-sm w-48"
            />
            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={savingTeam}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50"
            >
              {savingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Takım oluştur
            </button>
          </div>
          <div className="space-y-3">
            {teams.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz takım yok.</p>
            ) : (
              teams.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{t.name}</span>
                    <span className="text-gray-500 text-sm ml-2">(ID: {t.id})</span>
                    {t.memberIds && t.memberIds.length > 0 && (
                      <span className="text-gray-500 text-sm ml-2">— {t.memberIds.length} üye</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTeam(t.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Takımı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ——— Panel: Görsel düzenlemeler (hangi kullanıcı hangi görseli düzenledi) ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#FF5A5F]" />
          <h2 className="font-semibold text-gray-800">Görsel düzenlemeler</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">Hangi kullanıcıların hangi görselleri düzenlediği (son 5000 kayıt).</p>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">Kullanıcı</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">E-posta</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">Tarih</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-medium whitespace-nowrap">Düzenlenen görsel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {imageEdits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">Henüz görsel düzenleme kaydı yok</td>
                  </tr>
                ) : (
                  imageEdits.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-gray-800">{entry.displayName || entry.userId.slice(0, 12) || "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{entry.email ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                      <td className="px-3 py-2">
                        {entry.outputUrl ? (
                          <a href={entry.outputUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#FF5A5F] hover:underline" title="Yeni sekmede aç">
                            <img src={entry.outputUrl} alt="" className="w-12 h-12 object-contain rounded border border-gray-200 bg-gray-50" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            <span>Görüntüle</span>
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ——— Panel 5: Fiyat güncellemesi ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Fiyat Planı Yönetimi</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sitede görünen planlar, backend fiyatları ve kurumsal planlar. Değişiklikler tüm sitede geçerli olur.
          </p>
        </div>
        <div className="p-4 space-y-8">
          {/* 3.1 Sitede görünen planlar */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sitede görünen planlar (Fiyatlandırma sayfası)</h3>
            <div className="space-y-4">
              {sitePlansEdit.map((plan, idx) => (
                <div key={plan.id || idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      placeholder="Plan ID"
                      value={plan.id}
                      onChange={(e) => updateSitePlan(idx, "id", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Plan adı"
                      value={plan.name}
                      onChange={(e) => updateSitePlan(idx, "name", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Fiyat (görünen)"
                      value={plan.price}
                      onChange={(e) => updateSitePlan(idx, "price", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Dönem (ay/yıl)"
                      value={plan.period}
                      onChange={(e) => updateSitePlan(idx, "period", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Kredi (dönüşüm hakkı = kredi ÷ 10)</label>
                      <input
                        type="number"
                        min={0}
                        value={plan.credits ?? ""}
                        onChange={(e) =>
                          updateSitePlan(
                            idx,
                            "credits",
                            e.target.value === "" ? 0 : Math.max(0, Number(e.target.value))
                          )
                        }
                        placeholder="Örn. 1000"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <input
                      placeholder="Açıklama"
                      value={plan.description}
                      onChange={(e) => updateSitePlan(idx, "description", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                    />
                    <input
                      placeholder="Buton metni (cta)"
                      value={plan.cta}
                      onChange={(e) => updateSitePlan(idx, "cta", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Link (href)"
                      value={plan.href}
                      onChange={(e) => updateSitePlan(idx, "href", e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={!!plan.highlighted}
                        onChange={(e) => updateSitePlan(idx, "highlighted", e.target.checked)}
                      />
                      Öne çıkan plan
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Özellikler (her satırda bir madde)</label>
                    <textarea
                      rows={3}
                      value={(plan.features || []).join("\n")}
                      onChange={(e) =>
                        updateSitePlan(
                          idx,
                          "features",
                          e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3.2 Backend plan fiyatları */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Backend plan fiyatları (₺)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {planOptions.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 w-32 shrink-0">{key}</label>
                  <input
                    type="number"
                    min={0}
                    value={plansEdit[key] ?? ""}
                    onChange={(e) =>
                      setPlansEdit((prev) => ({
                        ...prev,
                        [key]: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span className="text-gray-500 text-sm">₺</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3.3 Kurumsal planlar */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Kurumsal planlar (JSON)</h3>
            <textarea
              rows={6}
              value={enterprisePlansEdit}
              onChange={(e) => setEnterprisePlansEdit(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
              placeholder='[{"id": "enterprise_1", "isPro": true}, ...]'
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSaveAllPlans}
              disabled={savingPlans || resettingPlans}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50"
            >
              {savingPlans ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Tüm fiyat planını kaydet
            </button>
            <button
              type="button"
              onClick={handleResetPlansToDefault}
              disabled={savingPlans || resettingPlans}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {resettingPlans ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Planları varsayılana sıfırla
            </button>
            {plansSaveMessage && (
              <span
                className={`text-sm ${
                  plansSaveMessage.includes("hatası") || plansSaveMessage.includes("geçerli")
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {plansSaveMessage}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ——— Panel 6: Kullanıcı Yönetimi ——— */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-gray-500">Tüm kullanıcı bilgileri ve plan ataması.</p>
          <div className="relative flex-1 min-w-[200px] max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="ID, e-posta, ad veya plana göre ara..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F] outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">ID</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">E-posta</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Ad</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Plan</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Kalan dönüşüm</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Dönüşüm</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Kayıt tarihi</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Bellek</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {userSearch.trim() ? "Eşleşen kullanıcı yok" : "Henüz kullanıcı yok"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[120px] truncate" title={u.id}>
                      {u.id}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{u.displayName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.plan || "free"}
                        onChange={(e) => handlePlanChange(u.id, e.target.value)}
                        disabled={savingPlan === u.id}
                        className="rounded border border-gray-300 text-gray-700 py-1.5 px-2 text-sm focus:ring-2 focus:ring-[#FF5A5F] focus:border-[#FF5A5F]"
                      >
                        {planOptions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                            {planPrices[p] != null ? ` (${planPrices[p]} ₺)` : ""}
                          </option>
                        ))}
                      </select>
                      {savingPlan === u.id && (
                        <Loader2 className="inline-block w-4 h-4 ml-1 animate-spin text-[#FF5A5F]" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.credits ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{u.totalConversions ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{u._memory ? "Evet" : "Hayır"}</td>
                    <td className="px-4 py-3 text-gray-500">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
