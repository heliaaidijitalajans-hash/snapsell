import { useMemo, useState } from "react";
import {
  UserCog,
  Plus,
  Pencil,
  Ban,
  Trash2,
  KeyRound,
  Shield,
  Check,
  X,
} from "lucide-react";
import { GlassCard, PageHeader, EmptyState, WorkspaceNote } from "../components/ui";
import { RequirePermission } from "../components/RequirePermission";
import { useRbac } from "../rbac/RbacContext";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_META,
  type Permission,
  type RoleId,
} from "../rbac/permissions";

const ROLE_IDS = Object.keys(ROLE_META) as RoleId[];

function fmt(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function AdminForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: {
    name: string;
    email: string;
    roles: RoleId[];
    permissions: Permission[];
    password?: string;
  };
  onCancel: () => void;
  onSave: (data: {
    name: string;
    email: string;
    password: string;
    roles: RoleId[];
    permissions: Permission[];
  }) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<RoleId[]>(initial?.roles || ["support"]);
  const [permissions, setPermissions] = useState<Permission[]>(initial?.permissions || []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial);

  const toggleRole = (r: RoleId) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const togglePerm = (p: Permission) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <GlassCard className="p-5 space-y-4 border-[#FF5A5F]/20">
      <h3 className="text-white font-medium flex items-center gap-2">
        <UserCog className="w-4 h-4 text-[#FF5A5F]" />
        {isEdit ? "Edit Administrator" : "Create Administrator"}
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="px-3 py-2 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          disabled={isEdit && initial?.email === "super@snapsell.admin"}
          className="px-3 py-2 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40 disabled:opacity-50"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? "Leave blank to keep password" : "Password (min 6)"}
          type="password"
          className="px-3 py-2 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white outline-none focus:ring-2 focus:ring-[#FF5A5F]/40 sm:col-span-2"
        />
      </div>

      <div>
        <p className="text-xs text-white/40 mb-2">Roles</p>
        <div className="flex flex-wrap gap-2">
          {ROLE_IDS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                roles.includes(r)
                  ? "bg-[#FF5A5F]/20 border-[#FF5A5F]/40 text-[#FF5A5F]"
                  : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white"
              }`}
            >
              {ROLE_META[r].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-white/40 mb-2">Individual permissions (additive)</p>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.06] p-2 grid sm:grid-cols-2 gap-1">
          {ALL_PERMISSIONS.map((p) => (
            <label
              key={p}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs text-white/70"
            >
              <input
                type="checkbox"
                checked={permissions.includes(p)}
                onChange={() => togglePerm(p)}
                className="rounded border-white/20"
              />
              {PERMISSION_LABELS[p]}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white border border-white/[0.08]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            void (async () => {
              setError("");
              setSaving(true);
              try {
                await onSave({ name, email, password, roles, permissions });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed");
              } finally {
                setSaving(false);
              }
            })();
          }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </GlassCard>
  );
}

export function AdministratorsPage() {
  const {
    administrators,
    session,
    createAdministrator,
    updateAdministrator,
    resetAdministratorPassword,
    deleteAdministrator,
  } = useRbac();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [msg, setMsg] = useState("");

  const editing = useMemo(
    () => administrators.find((a) => a.id === editId) || null,
    [administrators, editId]
  );

  return (
    <RequirePermission permission="manage_admins">
      <div className="space-y-6">
        <PageHeader
          title="Administrators"
          description="Create admins, assign roles and granular permissions. Extensible for future modules."
          actions={
            mode === "list" ? (
              <button
                type="button"
                onClick={() => setMode("create")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A5F] text-white text-sm font-medium hover:bg-[#FF5A5F]/90"
              >
                <Plus className="w-4 h-4" />
                Create Administrator
              </button>
            ) : null
          }
        />

        <WorkspaceNote>
          Role checks run in the admin UI before every page render. Server master login always maps to Super
          Admin. Additional administrators authenticate locally until a multi-admin API is available.
        </WorkspaceNote>

        {msg && (
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" /> {msg}
          </p>
        )}

        {mode === "create" && (
          <AdminForm
            onCancel={() => setMode("list")}
            onSave={async (data) => {
              const res = await createAdministrator(data);
              if (!res.ok) throw new Error(res.error);
              setMode("list");
              setMsg(`Created ${data.email}`);
            }}
          />
        )}

        {mode === "edit" && editing && (
          <AdminForm
            initial={{
              name: editing.name,
              email: editing.email,
              roles: editing.roles,
              permissions: editing.permissions,
            }}
            onCancel={() => {
              setMode("list");
              setEditId(null);
            }}
            onSave={async (data) => {
              const res = updateAdministrator(editing.id, {
                name: data.name,
                email: data.email,
                roles: data.roles,
                permissions: data.permissions,
              });
              if (!res.ok) throw new Error(res.error);
              if (data.password) {
                const pw = await resetAdministratorPassword(editing.id, data.password);
                if (!pw.ok) throw new Error(pw.error);
              }
              setMode("list");
              setEditId(null);
              setMsg(`Updated ${data.email}`);
            }}
          />
        )}

        {mode === "list" && (
          <GlassCard className="overflow-hidden">
            {administrators.length === 0 ? (
              <EmptyState title="No administrators" description="Create the first admin account." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-white/40 text-xs">
                      <th className="px-4 py-3 font-medium">Administrator</th>
                      <th className="px-4 py-3 font-medium">Roles</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Login</th>
                      <th className="px-4 py-3 font-medium">Last Active</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {administrators.map((a) => (
                      <tr key={a.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#FF5A5F]/15 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-[#FF5A5F]" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{a.name}</p>
                              <p className="text-white/40 text-xs">{a.email}</p>
                              {a.isBootstrapSuper && (
                                <span className="text-[10px] text-amber-400/80">Bootstrap Super Admin</span>
                              )}
                              {session?.adminId === a.id && (
                                <span className="text-[10px] text-emerald-400/80 ml-1">You</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {a.roles.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.06] text-white/70"
                              >
                                {ROLE_META[r]?.label || r}
                              </span>
                            ))}
                            {a.permissions.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-300">
                                +{a.permissions.length} perms
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {a.disabled ? (
                            <span className="text-red-400 text-xs">Disabled</span>
                          ) : (
                            <span className="text-emerald-400 text-xs">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(a.lastLoginAt)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(a.lastActiveAt)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(a.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => {
                                setEditId(a.id);
                                setMode("edit");
                                setMsg("");
                              }}
                              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06]"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Reset password"
                              onClick={() => {
                                setResetId(a.id);
                                setResetPw("");
                              }}
                              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06]"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title={a.disabled ? "Enable" : "Disable"}
                              onClick={() => {
                                const res = updateAdministrator(a.id, { disabled: !a.disabled });
                                setMsg(res.ok ? (a.disabled ? "Enabled" : "Disabled") : res.error || "Failed");
                              }}
                              className="p-2 rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/[0.06]"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => {
                                if (!confirm(`Delete ${a.email}?`)) return;
                                const res = deleteAdministrator(a.id);
                                setMsg(res.ok ? "Deleted" : res.error || "Failed");
                              }}
                              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/[0.06]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        )}

        {resetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <GlassCard className="w-full max-w-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Reset Password</h3>
                <button type="button" onClick={() => setResetId(null)} className="text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="password"
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                placeholder="New password (min 6)"
                className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const res = await resetAdministratorPassword(resetId, resetPw);
                    setMsg(res.ok ? "Password reset" : res.error || "Failed");
                    if (res.ok) setResetId(null);
                  })();
                }}
                className="w-full py-2.5 rounded-xl bg-[#FF5A5F] text-white text-sm font-medium"
              >
                Reset
              </button>
            </GlassCard>
          </div>
        )}

        <GlassCard className="p-5">
          <h3 className="text-white font-medium mb-3">Default roles</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLE_IDS.map((r) => (
              <div key={r} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-sm text-white font-medium">{ROLE_META[r].label}</p>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">{ROLE_META[r].description}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </RequirePermission>
  );
}
