import { useState } from "react";
import { useParams } from "react-router";
import { Database, Flag, KeyRound, Mail, Settings, Shield, Wrench } from "lucide-react";
import { GlassCard, PageHeader, WorkspaceNote, btnPrimary } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { formatDate } from "../types";
import { appendAudit, wsGet, wsSet } from "../lib/workspace";

export function AdminSettingsPage() {
  const { section } = useParams();
  const { loginLogs, users, dailyStats } = useAdmin();

  if (section === "supabase") {
    return (
      <div>
        <PageHeader title="Supabase" subtitle="Connection is managed by server environment variables." />
        <GlassCard className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-[#FF5A5F]" />
            <p className="text-white font-medium">Database</p>
          </div>
          <p className="text-sm text-white/50">
            Users, login logs and image edits load via existing admin APIs. Credentials stay on the server.
          </p>
          <p className="text-sm text-white/40">Loaded users: {users.length}</p>
        </GlassCard>
      </div>
    );
  }

  if (section === "api") {
    return (
      <div>
        <PageHeader title="API Keys" subtitle="Secrets remain server-side." />
        <GlassCard className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-[#FF5A5F]" />
            <p className="text-white font-medium">Server secrets</p>
          </div>
          <p className="text-sm text-white/50">
            PhotoRoom, Lemon Squeezy, OpenAI and Supabase keys are configured via environment variables and are not editable here.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (section === "smtp") {
    return (
      <div>
        <PageHeader title="SMTP" subtitle="Outbound email configuration (server-side)." />
        <WorkspaceNote />
        <GlassCard className="p-6 space-y-3">
          <Mail className="w-5 h-5 text-[#FF5A5F]" />
          <p className="text-sm text-white/50">SMTP host/user/password must stay in server env. No client-side key storage.</p>
        </GlassCard>
      </div>
    );
  }

  if (section === "oauth") {
    return (
      <div>
        <PageHeader title="OAuth" subtitle="Google sign-in and providers." />
        <GlassCard className="p-6 space-y-3">
          <Shield className="w-5 h-5 text-[#FF5A5F]" />
          <p className="text-sm text-white/50">OAuth client IDs are configured in Supabase Auth / server env. Login logs below prove Google sign-ins are working.</p>
          <p className="text-sm text-white/40">Recent logins: {loginLogs.length}</p>
        </GlassCard>
      </div>
    );
  }

  if (section === "flags" || section === "maintenance") {
    return <FlagsAndMaintenance mode={section} />;
  }

  return (
    <div>
      <PageHeader title="Application Settings" subtitle="System overview and login activity." />
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-[#FF5A5F]" />
          <h3 className="font-semibold text-white">System overview</h3>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-white/40">Users</dt>
            <dd className="text-white font-semibold mt-1">{users.length}</dd>
          </div>
          <div>
            <dt className="text-white/40">Today visitors</dt>
            <dd className="text-white font-semibold mt-1">{dailyStats?.today?.visitors ?? 0}</dd>
          </div>
          <div>
            <dt className="text-white/40">Total visitors</dt>
            <dd className="text-white font-semibold mt-1">{dailyStats?.totalVisitors ?? 0}</dd>
          </div>
        </dl>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h3 className="font-semibold text-white">Login records</h3>
          <p className="text-xs text-white/40 mt-1">Google / email sign-ins (last 500)</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#141414]">
              <tr className="text-left text-white/40">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-white/40">
                    No login records
                  </td>
                </tr>
              ) : (
                loginLogs.map((log, idx) => (
                  <tr key={idx} className="border-t border-white/[0.04]">
                    <td className="px-3 py-2 text-white/70 whitespace-nowrap">
                      {log.logged_at ? formatDate(new Date(log.logged_at).getTime()) : "—"}
                    </td>
                    <td className="px-3 py-2 text-white/80">{log.email || "—"}</td>
                    <td className="px-3 py-2 text-white/60">{log.display_name || "—"}</td>
                    <td className="px-3 py-2 text-white/40">{log.source === "db" ? "Database" : "File"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function FlagsAndMaintenance({ mode }: { mode: "flags" | "maintenance" }) {
  const [flags, setFlags] = useState(() =>
    wsGet("feature_flags", {
      maintenanceMode: false,
      newEditor: true,
      priceAnalysis: true,
      announcements: true,
    })
  );

  const save = () => {
    wsSet("feature_flags", flags);
    appendAudit({
      action: mode === "maintenance" ? "Maintenance mode enabled" : "Feature flags updated",
      target: "settings",
      status: "success",
      meta: JSON.stringify(flags),
    });
  };

  return (
    <div>
      <PageHeader
        title={mode === "maintenance" ? "Maintenance Mode" : "Feature Flags"}
        subtitle="Local admin flags until a settings API exists."
        actions={
          <button type="button" className={btnPrimary()} onClick={save}>
            Save
          </button>
        }
      />
      <WorkspaceNote />
      <GlassCard className="p-6 space-y-4">
        {mode === "maintenance" ? (
          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={flags.maintenanceMode}
              onChange={(e) => setFlags({ ...flags, maintenanceMode: e.target.checked })}
            />
            <Wrench className="w-4 h-4 text-[#FF5A5F]" />
            Enable maintenance mode (local flag)
          </label>
        ) : (
          Object.entries(flags)
            .filter(([k]) => k !== "maintenanceMode")
            .map(([k, v]) => (
              <label key={k} className="flex items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={Boolean(v)}
                  onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })}
                />
                <Flag className="w-4 h-4 text-[#FF5A5F]" />
                {k}
              </label>
            ))
        )}
      </GlassCard>
    </div>
  );
}
