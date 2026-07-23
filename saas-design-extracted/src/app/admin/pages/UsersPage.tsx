import { useMemo } from "react";
import { useParams } from "react-router";
import { Loader2, Search } from "lucide-react";
import { GlassCard, PageHeader } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { PLAN_OPTIONS, formatDate, isPremiumPlan } from "../types";

type Filter = "all" | "google" | "email" | "premium";

export function AdminUsersPage() {
  const { filter: filterParam } = useParams();
  const filter: Filter =
    filterParam === "google" || filterParam === "email" || filterParam === "premium"
      ? filterParam
      : "all";

  const {
    users,
    userSearch,
    setUserSearch,
    planPrices,
    savingPlan,
    handlePlanChange,
    loginLogs,
  } = useAdmin();

  const googleEmails = useMemo(() => {
    const set = new Set<string>();
    loginLogs.forEach((l) => {
      if (l.email) set.add(l.email.toLowerCase());
    });
    return set;
  }, [loginLogs]);

  const searchLower = userSearch.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = users;
    if (filter === "google") {
      list = list.filter((u) => u.email && googleEmails.has(u.email.toLowerCase()));
    } else if (filter === "email") {
      list = list.filter((u) => !u.email || !googleEmails.has(u.email.toLowerCase()));
    } else if (filter === "premium") {
      list = list.filter((u) => isPremiumPlan(u.plan));
    }
    if (!searchLower) return list;
    return list.filter(
      (u) =>
        (u.id || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.displayName || "").toLowerCase().includes(searchLower) ||
        (u.plan || "").toLowerCase().includes(searchLower)
    );
  }, [users, filter, searchLower, googleEmails]);

  const titles: Record<Filter, string> = {
    all: "All Users",
    google: "Google Sign-ins",
    email: "Email Users",
    premium: "Premium Users",
  };

  return (
    <div>
      <PageHeader title={titles[filter]} subtitle="Search, filter and manage user plans." />

      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by ID, email, name or plan…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF5A5F]/50"
            />
          </div>
          <span className="text-sm text-white/40">{filtered.length} users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/[0.06]">
                <th className="px-4 py-3 font-medium">Avatar</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Conversions</th>
                <th className="px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/40">
                    {searchLower ? "No matching users" : "No users yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const initial = (u.displayName || u.email || u.id || "?").charAt(0).toUpperCase();
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center text-sm font-semibold">
                          {initial}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/90">{u.displayName ?? "—"}</td>
                      <td className="px-4 py-3 text-white/70">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.plan || "free"}
                          onChange={(e) => void handlePlanChange(u.id, e.target.value)}
                          disabled={savingPlan === u.id}
                          className="rounded-lg border border-white/[0.1] bg-[#161616] text-white/90 py-1.5 px-2 text-sm focus:ring-2 focus:ring-[#FF5A5F]/50 outline-none"
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                              {planPrices[p] != null ? ` ($${planPrices[p]})` : ""}
                            </option>
                          ))}
                        </select>
                        {savingPlan === u.id && (
                          <Loader2 className="inline-block w-4 h-4 ml-1 animate-spin text-[#FF5A5F]" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/70 tabular-nums">{u.totalConversions ?? 0}</td>
                      <td className="px-4 py-3 text-white/50 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        Credits: {u.credits ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
