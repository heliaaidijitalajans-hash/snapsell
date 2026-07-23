import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Loader2, Search, Ban, Trash2, Eye, AlertTriangle } from "lucide-react";
import { Badge, EmptyState, GlassCard, PageHeader, btnGhost, btnPrimary, inputClass } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { useRbac } from "../rbac/RbacContext";
import { PERMISSIONS } from "../rbac/permissions";
import { PLAN_OPTIONS, formatDate, isPremiumPlan, type AdminUser } from "../types";
import { appendAudit } from "../lib/workspace";

type Filter = "all" | "google" | "email" | "premium";

export function AdminUsersPage() {
  const { filter: filterParam } = useParams();
  const isDetail = filterParam && filterParam.startsWith("id-");
  const detailId = isDetail ? filterParam!.slice(3) : null;
  const filter: Filter =
    !isDetail && (filterParam === "google" || filterParam === "email" || filterParam === "premium")
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
  const { can } = useRbac();
  const canEdit = can(PERMISSIONS.EDIT_USERS);
  const canDelete = can(PERMISSIONS.DELETE_USERS);
  const canEditCredits = can(PERMISSIONS.EDIT_CREDITS);

  const [sortBy, setSortBy] = useState<"created" | "conversions" | "name">("created");
  const [actionMsg, setActionMsg] = useState("");

  const googleEmails = useMemo(() => {
    const set = new Set<string>();
    loginLogs.forEach((l) => {
      if (l.email) set.add(l.email.toLowerCase());
    });
    return set;
  }, [loginLogs]);

  const searchLower = userSearch.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = [...users];
    if (filter === "google") list = list.filter((u) => u.email && googleEmails.has(u.email.toLowerCase()));
    else if (filter === "email") list = list.filter((u) => !u.email || !googleEmails.has(u.email.toLowerCase()));
    else if (filter === "premium") list = list.filter((u) => isPremiumPlan(u.plan));
    if (searchLower) {
      list = list.filter(
        (u) =>
          (u.id || "").toLowerCase().includes(searchLower) ||
          (u.email || "").toLowerCase().includes(searchLower) ||
          (u.displayName || "").toLowerCase().includes(searchLower) ||
          (u.plan || "").toLowerCase().includes(searchLower)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "conversions") return (b.totalConversions ?? 0) - (a.totalConversions ?? 0);
      if (sortBy === "name") return (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "");
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
    return list;
  }, [users, filter, searchLower, googleEmails, sortBy]);

  if (detailId) {
    const user = users.find((u) => u.id === detailId || u.id.startsWith(detailId));
    return (
      <UserDetail
        user={user}
        planPrices={planPrices}
        savingPlan={savingPlan}
        onPlanChange={handlePlanChange}
        canEdit={canEdit || canEditCredits}
      />
    );
  }

  const titles: Record<Filter, string> = {
    all: "All Users",
    google: "Google Users",
    email: "Email Users",
    premium: "Premium Users",
  };

  const unsupportedAction = (action: string, target: string) => {
    setActionMsg(`${action} requires a dedicated API endpoint (not available — backend unchanged).`);
    appendAudit({ admin: "admin", action: `${action} attempted`, target, status: "warning" });
  };

  return (
    <div>
      <PageHeader
        title={titles[filter]}
        subtitle="Search, filter, sort and manage plans. Suspend/delete require future API endpoints."
      />
      {actionMsg && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users…"
              className={`${inputClass()} pl-9`}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={inputClass() + " w-auto"}
          >
            <option value="created">Sort: Newest</option>
            <option value="conversions">Sort: Conversions</option>
            <option value="name">Sort: Name</option>
          </select>
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
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="No users found" description="Try another filter or search query." />
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const initial = (u.displayName || u.email || u.id || "?").charAt(0).toUpperCase();
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center text-sm font-semibold">
                          {initial}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/90">{u.displayName ?? "—"}</td>
                      <td className="px-4 py-3 text-white/70">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        {canEdit || canEditCredits ? (
                          <select
                            value={u.plan || "free"}
                            onChange={(e) => {
                              void handlePlanChange(u.id, e.target.value);
                              appendAudit({
                                action: "Changed subscription",
                                target: u.email || u.id,
                                status: "success",
                                meta: e.target.value,
                              });
                            }}
                            disabled={savingPlan === u.id}
                            className="rounded-lg border border-white/[0.1] bg-[#161616] text-white/90 py-1.5 px-2 text-sm outline-none focus:ring-2 focus:ring-[#FF5A5F]/50"
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                                {planPrices[p] != null ? ` ($${planPrices[p]})` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge tone="neutral">{u.plan || "free"}</Badge>
                        )}
                        {savingPlan === u.id && <Loader2 className="inline w-4 h-4 ml-1 animate-spin text-[#FF5A5F]" />}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-white/70">{u.totalConversions ?? 0}</td>
                      <td className="px-4 py-3 tabular-nums text-white/70">{u.credits ?? "—"}</td>
                      <td className="px-4 py-3 text-white/45 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/users/id-${u.id}`}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canEdit && (
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-white/50 hover:text-amber-400"
                              title="Suspend"
                              onClick={() => unsupportedAction("Suspend account", u.email || u.id)}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400"
                              title="Delete"
                              onClick={() => unsupportedAction("Delete account", u.email || u.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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

function UserDetail({
  user,
  planPrices,
  savingPlan,
  onPlanChange,
  canEdit,
}: {
  user?: AdminUser;
  planPrices: Record<string, number>;
  savingPlan: string | null;
  onPlanChange: (id: string, plan: string) => Promise<void>;
  canEdit: boolean;
}) {
  if (!user) {
    return (
      <div>
        <PageHeader title="User Details" />
        <GlassCard>
          <EmptyState title="User not found" description="Return to All Users and try again." />
        </GlassCard>
        <div className="mt-4">
          <Link to="/admin/users" className={btnGhost()}>
            Back to users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={user.displayName || user.email || "User"}
        subtitle="User history and subscription controls."
        actions={
          <Link to="/admin/users" className={btnGhost()}>
            Back
          </Link>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-6 lg:col-span-1">
          <div className="w-16 h-16 rounded-2xl bg-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center text-2xl font-bold mb-4">
            {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
          </div>
          <p className="text-white font-semibold">{user.displayName || "—"}</p>
          <p className="text-white/50 text-sm mt-1">{user.email || "—"}</p>
          <p className="text-xs text-white/30 mt-3 font-mono break-all">{user.id}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={isPremiumPlan(user.plan) ? "accent" : "neutral"}>{user.plan}</Badge>
            {user._memory ? <Badge tone="warning">Memory</Badge> : null}
          </div>
        </GlassCard>
        <GlassCard className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Account</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-white/40">Credits</dt>
              <dd className="text-white font-semibold mt-1">{user.credits ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Conversions</dt>
              <dd className="text-white font-semibold mt-1">{user.totalConversions ?? 0}</dd>
            </div>
            <div>
              <dt className="text-white/40">Created</dt>
              <dd className="text-white font-semibold mt-1">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-white/40">Plan price</dt>
              <dd className="text-white font-semibold mt-1">
                {planPrices[user.plan] != null ? `$${planPrices[user.plan]}` : "—"}
              </dd>
            </div>
          </dl>
          {canEdit ? (
            <div>
              <label className="text-xs text-white/40 block mb-1">Edit subscription</label>
              <select
                value={user.plan || "free"}
                onChange={(e) => {
                  void onPlanChange(user.id, e.target.value);
                  appendAudit({
                    action: "Changed subscription",
                    target: user.email || user.id,
                    status: "success",
                    meta: e.target.value,
                  });
                }}
                disabled={savingPlan === user.id}
                className={inputClass()}
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-white/40">Read-only — you cannot edit subscriptions or credits.</p>
          )}
          <p className="text-xs text-white/35">
            Credits are assigned automatically when plan changes via the existing admin API. Direct credit edit endpoint is not available.
          </p>
          <button type="button" className={btnPrimary()} disabled>
            Edit credits (API required)
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
