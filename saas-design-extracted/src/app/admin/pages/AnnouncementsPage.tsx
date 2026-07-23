import { useEffect, useState } from "react";
import { Archive, Eye, Megaphone, Plus, Trash2 } from "lucide-react";
import { Badge, EmptyState, GlassCard, PageHeader, WorkspaceNote, btnGhost, btnPrimary, inputClass } from "../components/ui";
import { appendAudit, type Announcement, wsGet, wsSet } from "../lib/workspace";

export function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>(() => wsGet("announcements", []));
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    wsSet("announcements", items);
  }, [items]);

  const create = () => {
    const a: Announcement = {
      id: `ann_${Date.now()}`,
      title: "New announcement",
      subtitle: "",
      message: "",
      buttonText: "Learn more",
      buttonUrl: "/",
      type: "information",
      priority: "medium",
      status: "draft",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      audience: "all",
      visibility: "banner",
      updatedAt: Date.now(),
    };
    setItems((prev) => [a, ...prev]);
    setEditing(a);
  };

  const save = (a: Announcement) => {
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...a, updatedAt: Date.now() } : x)));
    setEditing({ ...a, updatedAt: Date.now() });
    appendAudit({ admin: "admin", action: "Announcement saved", target: a.title, status: "success" });
  };

  const setStatus = (id: string, status: Announcement["status"]) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status, updatedAt: Date.now() } : x)));
    appendAudit({
      admin: "admin",
      action: status === "published" ? "Announcement published" : `Announcement ${status}`,
      target: id,
      status: "success",
    });
  };

  return (
    <div>
      <PageHeader
        title="Announcement Center"
        subtitle="Banners, popups and badges for website & mobile."
        actions={
          <button type="button" className={btnPrimary()} onClick={create}>
            <Plus className="w-4 h-4" /> New announcement
          </button>
        }
      />
      <WorkspaceNote />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <GlassCard className="xl:col-span-2 overflow-hidden">
          {items.length === 0 ? (
            <EmptyState title="No announcements" description="Create your first banner or popup." icon={Megaphone} />
          ) : (
            <ul className="divide-y divide-white/[0.04] max-h-[680px] overflow-y-auto">
              {items.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(a);
                      setPreview(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-white/[0.04] ${editing?.id === a.id ? "bg-white/[0.06]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">{a.title}</span>
                      <Badge tone={a.status === "published" ? "success" : a.status === "archived" ? "neutral" : "warning"}>
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40 mt-1 capitalize">
                      {a.type} · {a.priority} · {a.visibility}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="xl:col-span-3 p-5">
          {!editing ? (
            <EmptyState title="Select or create an announcement" />
          ) : preview ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 p-6">
                <p className="text-xs uppercase tracking-wider text-[#FF5A5F] font-semibold">{editing.type}</p>
                <h3 className="text-xl font-bold text-white mt-2">{editing.title}</h3>
                {editing.subtitle && <p className="text-white/60 mt-1">{editing.subtitle}</p>}
                <p className="text-white/80 mt-4 whitespace-pre-wrap">{editing.message}</p>
                {editing.buttonText && (
                  <a href={editing.buttonUrl || "#"} className={`${btnPrimary()} mt-4 inline-flex`}>
                    {editing.buttonText}
                  </a>
                )}
              </div>
              <button type="button" className={btnGhost()} onClick={() => setPreview(false)}>
                Back to editor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(
                [
                  ["title", "Title"],
                  ["subtitle", "Subtitle"],
                  ["buttonText", "Button Text"],
                  ["buttonUrl", "Button URL"],
                  ["audience", "Target Audience"],
                  ["startDate", "Start Date"],
                  ["endDate", "End Date"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-white/40 block mb-1">{label}</label>
                  <input
                    className={inputClass()}
                    type={key.includes("Date") ? "date" : "text"}
                    value={String(editing[key] ?? "")}
                    onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-white/40 block mb-1">Message</label>
                <textarea
                  rows={4}
                  className={inputClass()}
                  value={editing.message}
                  onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  className={inputClass()}
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as Announcement["type"] })}
                >
                  {["information", "update", "promotion", "maintenance", "emergency"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass()}
                  value={editing.priority}
                  onChange={(e) => setEditing({ ...editing, priority: e.target.value as Announcement["priority"] })}
                >
                  {["low", "medium", "high", "critical"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass()}
                  value={editing.visibility}
                  onChange={(e) => setEditing({ ...editing, visibility: e.target.value as Announcement["visibility"] })}
                >
                  {["banner", "popup", "badge"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" className={btnGhost()} onClick={() => save(editing)}>
                  Save draft
                </button>
                <button type="button" className={btnGhost()} onClick={() => setPreview(true)}>
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button
                  type="button"
                  className={btnPrimary()}
                  onClick={() => {
                    save({ ...editing, status: "published" });
                    setStatus(editing.id, "published");
                  }}
                >
                  Publish
                </button>
                <button type="button" className={btnGhost()} onClick={() => setStatus(editing.id, "archived")}>
                  <Archive className="w-4 h-4" /> Archive
                </button>
                <button
                  type="button"
                  className={btnGhost()}
                  onClick={() => {
                    setItems((prev) => prev.filter((x) => x.id !== editing.id));
                    setEditing(null);
                    appendAudit({ admin: "admin", action: "Announcement deleted", target: editing.title, status: "warning" });
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
