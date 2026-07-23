import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Eye, History, Save } from "lucide-react";
import { Badge, GlassCard, PageHeader, WorkspaceNote, btnGhost, btnPrimary, inputClass } from "../components/ui";
import { appendAudit, type LegalDoc, wsGet, wsSet } from "../lib/workspace";

const DOCS: Omit<LegalDoc, "content" | "updatedAt" | "updatedBy" | "versions" | "status">[] = [
  { id: "terms", title: "Terms of Service", slug: "terms" },
  { id: "privacy", title: "Privacy Policy", slug: "privacy" },
  { id: "cookies", title: "Cookie Policy", slug: "cookies" },
  { id: "refund", title: "Refund Policy", slug: "refund" },
  { id: "ai-usage", title: "AI Usage Policy", slug: "ai-usage" },
  { id: "community", title: "Community Guidelines", slug: "community" },
];

function seedDocs(): LegalDoc[] {
  return DOCS.map((d) => ({
    ...d,
    content: `# ${d.title}\n\nDraft content for ${d.title}. Edit and publish when ready.`,
    status: "draft" as const,
    updatedAt: Date.now(),
    updatedBy: "admin",
    versions: [],
  }));
}

export function AdminLegalPage() {
  const { section } = useParams();
  const [docs, setDocs] = useState<LegalDoc[]>(() => wsGet("legal_docs", seedDocs()));
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    wsSet("legal_docs", docs);
  }, [docs]);

  const active = useMemo(() => {
    if (!section) return null;
    return docs.find((d) => d.id === section || d.slug === section) || null;
  }, [docs, section]);

  const persist = (next: LegalDoc[]) => {
    setDocs(next);
    wsSet("legal_docs", next);
  };

  const updateContent = (content: string) => {
    if (!active) return;
    persist(
      docs.map((d) =>
        d.id === active.id ? { ...d, content, updatedAt: Date.now(), updatedBy: "admin" } : d
      )
    );
  };

  const saveDraft = () => {
    if (!active) return;
    const withVersion = docs.map((d) => {
      if (d.id !== active.id) return d;
      return {
        ...d,
        status: "draft" as const,
        updatedAt: Date.now(),
        versions: [...d.versions, { at: Date.now(), by: "admin", content: d.content }].slice(-20),
      };
    });
    persist(withVersion);
    appendAudit({ admin: "admin", action: "Legal document saved", target: active.title, status: "success" });
    setMsg("Draft saved");
  };

  const publish = () => {
    if (!active) return;
    persist(
      docs.map((d) =>
        d.id === active.id
          ? {
              ...d,
              status: "published" as const,
              updatedAt: Date.now(),
              versions: [...d.versions, { at: Date.now(), by: "admin", content: d.content }].slice(-20),
            }
          : d
      )
    );
    appendAudit({ admin: "admin", action: "Legal document published", target: active.title, status: "success" });
    setMsg("Published (local workspace)");
  };

  const restore = (idx: number) => {
    if (!active) return;
    const v = active.versions[idx];
    if (!v) return;
    updateContent(v.content);
    setMsg("Version restored into editor");
  };

  if (!active) {
    return (
      <div>
        <PageHeader title="Legal Center" subtitle="Manage legal documents with draft, publish and version history." />
        <WorkspaceNote />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <Link key={d.id} to={`/admin/legal/${d.id}`} className="block">
              <GlassCard className="p-5 hover:border-[#FF5A5F]/30 transition-colors h-full">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-white">{d.title}</h3>
                  <Badge tone={d.status === "published" ? "success" : "warning"}>{d.status}</Badge>
                </div>
                <p className="text-xs text-white/40">Last edited {new Date(d.updatedAt).toLocaleString()}</p>
                <p className="text-xs text-white/30 mt-1">By {d.updatedBy}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const current = docs.find((d) => d.id === active.id)!;

  return (
    <div>
      <PageHeader
        title={current.title}
        subtitle={`${current.status} · ${current.content.length} characters · Last editor: ${current.updatedBy}`}
        actions={
          <>
            <button type="button" className={btnGhost()} onClick={() => setPreview((p) => !p)}>
              <Eye className="w-4 h-4" />
              {preview ? "Edit" : "Preview"}
            </button>
            <button type="button" className={btnGhost()} onClick={saveDraft}>
              <Save className="w-4 h-4" />
              Save draft
            </button>
            <button type="button" className={btnPrimary()} onClick={publish}>
              Publish
            </button>
          </>
        }
      />
      <WorkspaceNote />
      {msg && <p className="mb-3 text-sm text-emerald-400">{msg}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="p-5 xl:col-span-2">
          {preview ? (
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-white/80 min-h-[420px]">
              {current.content}
            </div>
          ) : (
            <textarea
              rows={22}
              value={current.content}
              onChange={(e) => updateContent(e.target.value)}
              className={inputClass() + " font-mono min-h-[420px]"}
            />
          )}
          <p className="mt-2 text-xs text-white/35">{current.content.length} characters · Auto-saved locally on change</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[#FF5A5F]" />
            <h3 className="font-semibold text-white">Version history</h3>
          </div>
          {current.versions.length === 0 ? (
            <p className="text-sm text-white/40">No versions yet. Save or publish to create one.</p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {[...current.versions].reverse().map((v, i) => {
                const idx = current.versions.length - 1 - i;
                return (
                  <li key={v.at} className="rounded-xl border border-white/[0.06] p-3">
                    <p className="text-xs text-white/70">{new Date(v.at).toLocaleString()}</p>
                    <p className="text-[11px] text-white/35">By {v.by}</p>
                    <button type="button" className="mt-2 text-xs text-[#FF5A5F] hover:underline" onClick={() => restore(idx)}>
                      Restore
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
