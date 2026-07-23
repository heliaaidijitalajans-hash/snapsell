import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import { Badge, EmptyState, GlassCard, PageHeader, WorkspaceNote, btnGhost, btnPrimary, inputClass } from "../components/ui";
import {
  appendAudit,
  type ContactInfo,
  type FaqItem,
  type SupportTicket,
  wsGet,
  wsSet,
} from "../lib/workspace";

const DEFAULT_CONTACT: ContactInfo = {
  companyName: "SnapSell",
  supportEmail: "support@snapsell.website",
  salesEmail: "sales@snapsell.website",
  phone: "",
  whatsapp: "",
  website: "https://www.snapsell.website",
  address: "",
  workingHours: "Mon–Fri 09:00–18:00",
  mapsUrl: "",
  social: { instagram: "", facebook: "", linkedin: "", x: "", tiktok: "", discord: "", youtube: "" },
  published: false,
  updatedAt: Date.now(),
};

export function AdminSupportPage() {
  const { section } = useParams();

  if (section === "inbox") return <SupportInbox />;
  if (section === "faq") return <FaqManagement />;
  if (section === "social") return <SocialEditor />;
  return <ContactEditor />;
}

function ContactEditor() {
  const [info, setInfo] = useState<ContactInfo>(() => wsGet("contact_info", DEFAULT_CONTACT));
  const [msg, setMsg] = useState("");

  const save = (publish = false) => {
    const next = { ...info, published: publish || info.published, updatedAt: Date.now() };
    setInfo(next);
    wsSet("contact_info", next);
    appendAudit({
      admin: "admin",
      action: publish ? "Contact information published" : "Contact information updated",
      target: next.companyName,
      status: "success",
    });
    setMsg(publish ? "Published (local workspace)" : "Saved");
  };

  const field = (key: keyof ContactInfo, label: string) => (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <input
        className={inputClass()}
        value={String(info[key] ?? "")}
        onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Contact Information"
        subtitle="Company contact details used across website and app."
        actions={
          <>
            <button type="button" className={btnGhost()} onClick={() => save(false)}>
              <Save className="w-4 h-4" /> Save
            </button>
            <button type="button" className={btnPrimary()} onClick={() => save(true)}>
              Publish
            </button>
          </>
        }
      />
      <WorkspaceNote />
      {msg && <p className="mb-3 text-sm text-emerald-400">{msg}</p>}
      <GlassCard className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("companyName", "Company Name")}
        {field("supportEmail", "Support Email")}
        {field("salesEmail", "Sales Email")}
        {field("phone", "Phone")}
        {field("whatsapp", "WhatsApp")}
        {field("website", "Website")}
        {field("address", "Business Address")}
        {field("workingHours", "Working Hours")}
        {field("mapsUrl", "Google Maps URL")}
      </GlassCard>
    </div>
  );
}

function SocialEditor() {
  const [info, setInfo] = useState<ContactInfo>(() => wsGet("contact_info", DEFAULT_CONTACT));
  const socialKeys = ["instagram", "facebook", "linkedin", "x", "tiktok", "discord", "youtube"];

  return (
    <div>
      <PageHeader
        title="Social Media"
        subtitle="Links shown in footer and contact pages."
        actions={
          <button
            type="button"
            className={btnPrimary()}
            onClick={() => {
              wsSet("contact_info", { ...info, updatedAt: Date.now() });
              appendAudit({ admin: "admin", action: "Social media updated", target: "contact", status: "success" });
            }}
          >
            Save
          </button>
        }
      />
      <WorkspaceNote />
      <GlassCard className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {socialKeys.map((k) => (
          <div key={k}>
            <label className="block text-xs text-white/40 mb-1 capitalize">{k}</label>
            <input
              className={inputClass()}
              value={info.social[k] || ""}
              onChange={(e) => setInfo({ ...info, social: { ...info.social, [k]: e.target.value } })}
            />
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function SupportInbox() {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => wsGet("support_tickets", []));
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);

  useEffect(() => {
    wsSet("support_tickets", tickets);
  }, [tickets]);

  const seedDemo = () => {
    const t: SupportTicket = {
      id: `TCK-${Date.now().toString().slice(-6)}`,
      name: "Demo User",
      email: "demo@example.com",
      subject: "Question about credits",
      category: "Billing",
      priority: "medium",
      status: "new",
      createdAt: Date.now(),
      assignedAdmin: "Unassigned",
      messages: [{ at: Date.now(), from: "demo@example.com", body: "How do credits renew?" }],
    };
    setTickets((prev) => [t, ...prev]);
  };

  const active = tickets.find((t) => t.id === selected);

  const sendReply = () => {
    if (!active || !reply.trim()) return;
    const next = tickets.map((t) =>
      t.id !== active.id
        ? t
        : {
            ...t,
            status: t.status === "new" ? ("open" as const) : t.status,
            messages: [...t.messages, { at: Date.now(), from: "admin", body: reply.trim(), internal }],
          }
    );
    setTickets(next);
    appendAudit({ admin: "admin", action: "Support ticket replied", target: active.id, status: "success" });
    setReply("");
  };

  return (
    <div>
      <PageHeader
        title="Support Inbox"
        subtitle="Tickets from website & mobile. Realtime/email delivery needs future API."
        actions={
          <button type="button" className={btnGhost()} onClick={seedDemo}>
            <Plus className="w-4 h-4" /> Demo ticket
          </button>
        }
      />
      <WorkspaceNote />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <GlassCard className="xl:col-span-2 overflow-hidden">
          {tickets.length === 0 ? (
            <EmptyState title="No tickets" description="Create a demo ticket or connect support intake API later." />
          ) : (
            <ul className="divide-y divide-white/[0.04] max-h-[640px] overflow-y-auto">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-white/[0.04] ${selected === t.id ? "bg-white/[0.06]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">{t.subject}</span>
                      <Badge tone={t.priority === "urgent" || t.priority === "high" ? "danger" : "neutral"}>{t.status}</Badge>
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      {t.id} · {t.email}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
        <GlassCard className="xl:col-span-3 p-5">
          {!active ? (
            <EmptyState title="Select a ticket" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="font-semibold text-white flex-1">{active.subject}</h3>
                <select
                  className={inputClass() + " w-auto"}
                  value={active.status}
                  onChange={(e) =>
                    setTickets((prev) =>
                      prev.map((t) =>
                        t.id === active.id ? { ...t, status: e.target.value as SupportTicket["status"] } : t
                      )
                    )
                  }
                >
                  {["new", "open", "waiting", "resolved", "closed"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass() + " w-auto"}
                  value={active.priority}
                  onChange={(e) =>
                    setTickets((prev) =>
                      prev.map((t) =>
                        t.id === active.id ? { ...t, priority: e.target.value as SupportTicket["priority"] } : t
                      )
                    )
                  }
                >
                  {["low", "medium", "high", "urgent"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {active.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 text-sm ${m.internal ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/[0.04]"}`}
                  >
                    <p className="text-[11px] text-white/40 mb-1">
                      {m.from} · {new Date(m.at).toLocaleString()}
                      {m.internal ? " · Internal note" : ""}
                    </p>
                    <p className="text-white/80 whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
              <textarea rows={3} className={inputClass()} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-white/50 flex items-center gap-2">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
                <button type="button" className={btnPrimary()} onClick={sendReply}>
                  Send reply
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function FaqManagement() {
  const [items, setItems] = useState<FaqItem[]>(() =>
    wsGet("faq_items", [
      { id: "f1", question: "What is SnapSell?", answer: "AI product photo platform.", order: 0, published: true },
    ])
  );

  useEffect(() => {
    wsSet("faq_items", items);
  }, [items]);

  const add = () => {
    setItems((prev) => [
      ...prev,
      { id: `f_${Date.now()}`, question: "New question", answer: "", order: prev.length, published: false },
    ]);
  };

  return (
    <div>
      <PageHeader
        title="FAQ Management"
        subtitle="Create, edit, reorder and publish FAQs."
        actions={
          <button type="button" className={btnPrimary()} onClick={add}>
            <Plus className="w-4 h-4" /> Create
          </button>
        }
      />
      <WorkspaceNote />
      <div className="space-y-3">
        {items
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => (
            <GlassCard key={item.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30 w-6">{idx + 1}</span>
                <input
                  className={inputClass()}
                  value={item.question}
                  onChange={(e) =>
                    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, question: e.target.value } : x)))
                  }
                />
                <label className="text-xs text-white/50 flex items-center gap-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={item.published}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, published: e.target.checked } : x))
                      )
                    }
                  />
                  Publish
                </label>
                <button
                  type="button"
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={2}
                className={inputClass()}
                value={item.answer}
                onChange={(e) =>
                  setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, answer: e.target.value } : x)))
                }
              />
            </GlassCard>
          ))}
      </div>
    </div>
  );
}
