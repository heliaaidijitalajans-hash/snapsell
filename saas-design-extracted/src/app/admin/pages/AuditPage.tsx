import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Badge, EmptyState, GlassCard, PageHeader, inputClass } from "../components/ui";
import { type AuditEntry, wsGet } from "../lib/workspace";

export function AdminAuditPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AuditEntry["status"]>("all");
  const logs = wsGet<AuditEntry[]>("audit_logs", []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.admin.toLowerCase().includes(q) ||
        (l.meta || "").toLowerCase().includes(q)
      );
    });
  }, [logs, query, status]);

  const exportFile = (format: "csv" | "json") => {
    const data = filtered;
    let blob: Blob;
    let name: string;
    if (format === "json") {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      name = "audit-logs.json";
    } else {
      const header = "timestamp,admin,action,target,status,meta\n";
      const rows = data
        .map((l) =>
          [new Date(l.timestamp).toISOString(), l.admin, l.action, l.target, l.status, l.meta || ""]
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
      blob = new Blob([header + rows], { type: "text/csv" });
      name = "audit-logs.csv";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Audit Logs</title></head><body><h1>SnapSell Audit Logs</h1><pre>${JSON.stringify(filtered, null, 2)}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable administrator activity trail. Logs cannot be edited or deleted from this panel."
        actions={
          <>
            <button type="button" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-white/10 text-white/70 hover:bg-white/5" onClick={() => exportFile("csv")}>
              <Download className="w-4 h-4" /> CSV
            </button>
            <button type="button" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-white/10 text-white/70 hover:bg-white/5" onClick={() => exportFile("json")}>
              JSON
            </button>
            <button type="button" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-white/10 text-white/70 hover:bg-white/5" onClick={exportPdf}>
              PDF
            </button>
          </>
        }
      />

      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input className={`${inputClass()} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actions…" />
          </div>
          <select className={inputClass() + " w-auto"} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No audit entries" description="Admin actions (plan changes, content saves, etc.) will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Administrator</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white/80">{l.admin}</td>
                    <td className="px-4 py-3 text-white">{l.action}</td>
                    <td className="px-4 py-3 text-white/60">
                      {l.target}
                      {l.meta ? <span className="text-white/30"> · {l.meta}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={l.status === "success" ? "success" : l.status === "warning" ? "warning" : "neutral"}>
                        {l.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
