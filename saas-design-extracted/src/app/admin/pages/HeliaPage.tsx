import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2, Sparkles } from "lucide-react";
import { GlassCard, PageHeader, WorkspaceNote } from "../components/ui";
import { RequirePermission } from "../components/RequirePermission";
import { PERMISSIONS } from "../rbac/permissions";
import { getApiBase } from "../../config";
import { getStoredAdminToken } from "../types";
import { appendAudit } from "../lib/workspace";

type Msg = { role: "user" | "assistant" | "error"; text: string };
type Status = { configured: boolean; hasApiKey: boolean; hasBaseUrl: boolean };

const HISTORY_KEY = "snapsell_helia_chat_history_v1";

async function heliaApi(path: string, opts: RequestInit = {}) {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers.Authorization = "Bearer " + token;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 50000);
  try {
    const r = await fetch(getApiBase() + "/api/admin/helia" + path, {
      ...opts,
      credentials: "include",
      headers,
      signal: controller.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = new Error((data && data.error) || "Helia isteği başarısız oldu.");
      (err as Error & { status?: number; code?: string }).status = r.status;
      (err as Error & { status?: number; code?: string }).code = data?.code;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function loadHistory(): Msg[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m: Msg) =>
          m &&
          (m.role === "user" || m.role === "assistant" || m.role === "error") &&
          typeof m.text === "string"
      )
      .slice(-100);
  } catch {
    return [];
  }
}

function saveHistory(msgs: Msg[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-100)));
  } catch {
    /* ignore */
  }
}

export function AdminHeliaPage() {
  const [messages, setMessages] = useState<Msg[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveHistory(messages.filter((m) => m.role !== "error"));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await heliaApi("/status", { method: "GET" });
        if (!cancelled) {
          setStatus({
            configured: Boolean(data.configured),
            hasApiKey: Boolean(data.hasApiKey),
            hasBaseUrl: Boolean(data.hasBaseUrl),
          });
        }
      } catch {
        if (!cancelled) setStatus({ configured: false, hasApiKey: false, hasBaseUrl: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setBusy(true);
    try {
      const data = await heliaApi("/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      const reply = typeof data.reply === "string" ? data.reply : "";
      if (!reply) throw new Error("Helia boş yanıt döndürdü.");
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      appendAudit({ action: "Helia chat", target: "helia", status: "success" });
      setStatus((s) => (s ? { ...s, configured: true } : { configured: true, hasApiKey: true, hasBaseUrl: true }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bir hata oluştu. Lütfen tekrar deneyin.";
      const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code || "") : "";
      setMessages((prev) => [...prev, { role: "error", text: code ? `${msg} (${code})` : msg }]);
      appendAudit({ action: "Helia chat failed", target: "helia", status: "warning", meta: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequirePermission permission={PERMISSIONS.USE_HELIA}>
      <div className="space-y-6">
        <PageHeader
          title="Helia AI"
          subtitle="Admin sohbet — istekler Railway üzerinden gider; API anahtarı sunucuda kalır."
        />

        <WorkspaceNote>
          Yapılandırma: Railway ortam değişkenleri <code className="text-amber-100/90">HELIA_API_KEY</code> ve{" "}
          <code className="text-amber-100/90">HELIA_BASE_URL</code>. Handle gerekmez.
        </WorkspaceNote>

        <div className="flex flex-wrap gap-3">
          <StatusPill
            on={Boolean(status?.configured)}
            label="API bağlantısı"
            value={status == null ? "…" : status.configured ? "hazır" : "yapılandırılmadı"}
          />
          <StatusPill
            on={Boolean(status?.hasApiKey)}
            label="API Key"
            value={status == null ? "…" : status.hasApiKey ? "sunucuda bağlı" : "sunucuda yok"}
          />
        </div>

        <GlassCard className="overflow-hidden flex flex-col min-h-[420px] max-h-[min(620px,70vh)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !busy && (
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-white/35 text-sm gap-2">
                <Sparkles className="w-8 h-8 text-[#FF5A5F]/50" />
                Sohbet burada görünecek…
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  m.role === "user"
                    ? "ml-auto bg-[#FF5A5F] text-white"
                    : m.role === "error"
                      ? "bg-red-500/10 border border-red-500/25 text-red-200"
                      : "bg-white/[0.06] border border-white/[0.08] text-white/90"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-white/45 bg-white/[0.04] border border-white/[0.06] italic">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Yanıt bekleniyor…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/[0.06] p-3 flex flex-col sm:flex-row gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={busy}
              rows={2}
              placeholder="Helia’ya mesaj yazın…"
              className="flex-1 resize-none rounded-xl border border-white/[0.1] bg-[#121212] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#FF5A5F]/40 disabled:opacity-50"
            />
            <div className="flex gap-2 sm:flex-col">
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !input.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gönder
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  saveHistory([]);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/[0.12] text-white/60 hover:bg-white/[0.05]"
              >
                <Trash2 className="w-4 h-4" />
                Temizle
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </RequirePermission>
  );
}

function StatusPill({ on, label, value }: { on: boolean; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white/70">
      <span className={`w-2 h-2 rounded-full ${on ? "bg-emerald-400" : "bg-red-400"}`} />
      {label}: <strong className="text-white/90 font-medium">{value}</strong>
    </div>
  );
}
