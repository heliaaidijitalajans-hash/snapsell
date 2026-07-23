import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { RotateCcw, Search, Trash2, X } from "lucide-react";
import { EmptyState, GlassCard, PageHeader, btnGhost } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { formatDate } from "../types";
import { appendAudit } from "../lib/workspace";

export function AdminImagesPage() {
  const { filter } = useParams();
  const { imageEdits } = useAdmin();
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [msg, setMsg] = useState("");

  const list = useMemo(() => {
    let items = imageEdits.map((e, idx) => ({ ...e, _idx: idx })).filter((e) => !hidden.has(e._idx));
    if (filter === "failed") items = [];
    else if (filter === "generated") items = items.filter((e) => Boolean(e.outputUrl));
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) =>
        (e.email || "").toLowerCase().includes(q) ||
        (e.displayName || "").toLowerCase().includes(q) ||
        (e.userId || "").toLowerCase().includes(q)
    );
  }, [imageEdits, filter, search, hidden]);

  const title =
    filter === "failed" ? "Failed Jobs" : filter === "generated" ? "Generated Images" : "Image History";

  return (
    <div>
      <PageHeader title={title} subtitle="Preview, search and manage AI image history." />
      {msg && <p className="mb-3 text-sm text-amber-300">{msg}</p>}

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF5A5F]/50"
        />
      </div>

      {filter === "failed" ? (
        <GlassCard>
          <EmptyState
            title="No failed jobs"
            description="Failed-job tracking requires a dedicated API. Retry controls will wire when available."
          />
          <div className="pb-8 flex justify-center">
            <button
              type="button"
              className={btnGhost()}
              onClick={() => {
                setMsg("Retry API not available (backend unchanged).");
                appendAudit({ admin: "admin", action: "Retry failed generation attempted", target: "images", status: "warning" });
              }}
            >
              <RotateCcw className="w-4 h-4" /> Retry (API required)
            </button>
          </div>
        </GlassCard>
      ) : list.length === 0 ? (
        <GlassCard>
          <EmptyState title="No images found" />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {list.map((entry) => (
            <GlassCard key={entry._idx} className="overflow-hidden group" delay={Math.min(entry._idx * 0.01, 0.25)}>
              <button
                type="button"
                className="w-full aspect-square bg-black/40 flex items-center justify-center"
                onClick={() => entry.outputUrl && setPreview(entry.outputUrl)}
              >
                {entry.outputUrl ? (
                  <img
                    src={entry.outputUrl}
                    alt=""
                    className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-xs text-white/30">No preview</span>
                )}
              </button>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-white/80 truncate">{entry.displayName || entry.email || entry.userId.slice(0, 12)}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{formatDate(entry.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  title="Hide locally (no delete API)"
                  onClick={() => {
                    setHidden((prev) => new Set(prev).add(entry._idx));
                    appendAudit({
                      admin: "admin",
                      action: "Image hidden in admin UI",
                      target: entry.email || entry.userId,
                      status: "warning",
                    });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <button type="button" className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setPreview(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={preview} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
