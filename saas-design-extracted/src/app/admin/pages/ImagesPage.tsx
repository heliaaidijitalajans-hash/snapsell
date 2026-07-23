import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Search, X } from "lucide-react";
import { GlassCard, PageHeader } from "../components/ui";
import { useAdmin } from "../AdminContext";
import { formatDate } from "../types";

export function AdminImagesPage() {
  const { filter } = useParams();
  const { imageEdits } = useAdmin();
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const list = useMemo(() => {
    let items = imageEdits;
    if (filter === "failed") {
      // No failed-job API — show empty state for parity with nav
      items = [];
    } else if (filter === "generated") {
      items = items.filter((e) => Boolean(e.outputUrl));
    }
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) =>
        (e.email || "").toLowerCase().includes(q) ||
        (e.displayName || "").toLowerCase().includes(q) ||
        (e.userId || "").toLowerCase().includes(q)
    );
  }, [imageEdits, filter, search]);

  const title =
    filter === "failed" ? "Failed Jobs" : filter === "generated" ? "Generated Images" : "Image History";

  return (
    <div>
      <PageHeader title={title} subtitle="Browse AI-generated product images across users." />

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
        <GlassCard className="p-12 text-center">
          <p className="text-white/50">No failed job records available from the current API.</p>
        </GlassCard>
      ) : list.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-white/50">No images found</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {list.map((entry, idx) => (
            <GlassCard key={idx} className="overflow-hidden group" delay={Math.min(idx * 0.02, 0.3)}>
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
              <div className="p-3">
                <p className="text-xs text-white/80 truncate">{entry.displayName || entry.email || entry.userId.slice(0, 12)}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{formatDate(entry.createdAt)}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setPreview(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
