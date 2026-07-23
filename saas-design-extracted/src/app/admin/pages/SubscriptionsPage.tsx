import { useParams } from "react-router";
import { Loader2, Plus, Save, Trash2, Building2 } from "lucide-react";
import { GlassCard, PageHeader, StatCard } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { PLAN_OPTIONS } from "../types";
import { CreditCard, DollarSign, Users } from "lucide-react";

export function AdminSubscriptionsPage() {
  const { section } = useParams();
  const {
    sitePlansEdit,
    updateSitePlan,
    plansEdit,
    setPlansEdit,
    enterprisePlansEdit,
    setEnterprisePlansEdit,
    savingPlans,
    resettingPlans,
    plansSaveMessage,
    handleSaveAllPlans,
    handleResetPlansToDefault,
    subscribersMonthly,
    subscribersYearly,
    planPrices,
    teams,
    teamName,
    setTeamName,
    savingTeam,
    handleCreateTeam,
    handleDeleteTeam,
  } = useAdmin();

  const monthlyRevenue = subscribersMonthly.reduce((s, u) => s + (planPrices[u.plan] ?? 0), 0);
  const annualRevenue = subscribersYearly.reduce((s, u) => s + (planPrices[u.plan] ?? 0), 0);
  const activeCount = subscribersMonthly.length + subscribersYearly.length;

  if (section === "active") {
    return (
      <div>
        <PageHeader title="Active Subscribers" subtitle="Monthly and yearly paid subscribers." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="font-semibold text-white">Monthly ({subscribersMonthly.length})</h3>
            </div>
            <SubscriberTable rows={subscribersMonthly} />
          </GlassCard>
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="font-semibold text-white">Yearly ({subscribersYearly.length})</h3>
            </div>
            <SubscriberTable rows={subscribersYearly} />
          </GlassCard>
        </div>
      </div>
    );
  }

  if (section === "payments") {
    return (
      <div>
        <PageHeader title="Revenue" subtitle="Estimated recurring revenue from active plans." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Monthly revenue (est.)" value={`$${monthlyRevenue}`} icon={DollarSign} />
          <StatCard label="Annual revenue (est.)" value={`$${annualRevenue}`} icon={CreditCard} delay={0.05} />
          <StatCard label="Active subscribers" value={activeCount} icon={Users} delay={0.1} accent />
        </div>
        <GlassCard className="p-6">
          <p className="text-sm text-white/50">
            Payment processing runs via Lemon Squeezy. Amounts shown are estimates from assigned plan prices × active subscribers.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (section === "credits") {
    return (
      <div>
        <PageHeader title="Credits" subtitle="Plan credit allocations from site plans (editable under Plans)." />
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/[0.06]">
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {sitePlansEdit.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.04]">
                  <td className="px-4 py-3 text-white">{p.name}</td>
                  <td className="px-4 py-3 text-white/70 tabular-nums">{p.credits ?? "—"}</td>
                  <td className="px-4 py-3 text-white/70">${p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    );
  }

  if (section === "coupons") {
    return (
      <div>
        <PageHeader title="Coupons" subtitle="Coupon engine requires a dedicated API — UI ready for future wiring." />
        <GlassCard className="p-8 text-center">
          <p className="text-white/50 text-sm">No coupon API exists yet. Backend was intentionally left unchanged.</p>
        </GlassCard>
      </div>
    );
  }

  // Plans (default)
  return (
    <div>
      <PageHeader title="Plans" subtitle="Edit site plans, backend prices, enterprise JSON and teams." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Monthly revenue (est.)" value={`$${monthlyRevenue}`} icon={DollarSign} />
        <StatCard label="Annual revenue (est.)" value={`$${annualRevenue}`} icon={CreditCard} delay={0.05} />
        <StatCard label="Active subscribers" value={activeCount} icon={Users} delay={0.1} accent />
      </div>

      <GlassCard className="p-5 mb-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Site plans (pricing page)</h3>
          <div className="space-y-4">
            {sitePlansEdit.map((plan, idx) => (
              <div key={plan.id || idx} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["id", "Plan ID"],
                      ["name", "Plan name"],
                      ["price", "Price"],
                      ["period", "Period"],
                      ["cta", "CTA"],
                      ["href", "Link"],
                    ] as const
                  ).map(([field, ph]) => (
                    <input
                      key={field}
                      placeholder={ph}
                      value={String(plan[field] ?? "")}
                      onChange={(e) => updateSitePlan(idx, field, e.target.value)}
                      className="rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
                    />
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/40 mb-1">Credits</label>
                    <input
                      type="number"
                      min={0}
                      value={plan.credits ?? ""}
                      onChange={(e) =>
                        updateSitePlan(idx, "credits", e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))
                      }
                      className="w-full rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
                    />
                  </div>
                  <input
                    placeholder="Description"
                    value={plan.description}
                    onChange={(e) => updateSitePlan(idx, "description", e.target.value)}
                    className="rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm text-white sm:col-span-2 outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
                  />
                  <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!plan.highlighted}
                      onChange={(e) => updateSitePlan(idx, "highlighted", e.target.checked)}
                    />
                    Highlighted plan
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Features (one per line)</label>
                  <textarea
                    rows={3}
                    value={(plan.features || []).join("\n")}
                    onChange={(e) =>
                      updateSitePlan(
                        idx,
                        "features",
                        e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    className="w-full rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Backend plan prices (USD)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PLAN_OPTIONS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-sm text-white/60 w-36 shrink-0 truncate">{key}</label>
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
                  className="flex-1 rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
                />
                <span className="text-white/40 text-sm">$</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Enterprise plans (JSON)</h3>
          <textarea
            rows={6}
            value={enterprisePlansEdit}
            onChange={(e) => setEnterprisePlansEdit(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => void handleSaveAllPlans()}
            disabled={savingPlans || resettingPlans}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50"
          >
            {savingPlans ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save all plans
          </button>
          <button
            type="button"
            onClick={() => void handleResetPlansToDefault()}
            disabled={savingPlans || resettingPlans}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/[0.12] text-white/70 hover:bg-white/[0.05] disabled:opacity-50"
          >
            {resettingPlans ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Reset to defaults
          </button>
          {plansSaveMessage && (
            <span
              className={`text-sm ${
                plansSaveMessage.includes("hatası") || plansSaveMessage.includes("geçerli") || plansSaveMessage.includes("error")
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {plansSaveMessage}
            </span>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[#FF5A5F]" />
          <h3 className="font-semibold text-white">Enterprise teams</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            className="rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2 text-sm text-white w-48 outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
          />
          <button
            type="button"
            onClick={() => void handleCreateTeam()}
            disabled={savingTeam}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50"
          >
            {savingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create team
          </button>
        </div>
        <div className="space-y-2">
          {teams.length === 0 ? (
            <p className="text-sm text-white/40">No teams yet.</p>
          ) : (
            teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]"
              >
                <div>
                  <span className="font-medium text-white">{t.name}</span>
                  <span className="text-white/40 text-sm ml-2">(ID: {t.id})</span>
                  {t.memberIds?.length ? (
                    <span className="text-white/40 text-sm ml-2">— {t.memberIds.length} members</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteTeam(t.id)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function SubscriberTable({
  rows,
}: {
  rows: { id: string; email?: string | null; displayName?: string | null; plan: string; credits: number }[];
}) {
  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[#141414]">
          <tr className="text-left text-white/40">
            <th className="px-3 py-2 font-medium">Email / Name</th>
            <th className="px-3 py-2 font-medium">Plan</th>
            <th className="px-3 py-2 font-medium">Credits</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-white/40">
                No subscribers
              </td>
            </tr>
          ) : (
            rows.map((u) => (
              <tr key={u.id} className="border-t border-white/[0.04]">
                <td className="px-3 py-2 text-white/80">{u.email || u.displayName || u.id.slice(0, 12)}</td>
                <td className="px-3 py-2 text-white/60">{u.plan}</td>
                <td className="px-3 py-2 text-white/60">{u.credits ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
