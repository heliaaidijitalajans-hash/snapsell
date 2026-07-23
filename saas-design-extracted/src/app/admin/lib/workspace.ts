/**
 * Local admin workspace for modules that have no backend API yet
 * (Content, Legal, Contact, Announcements, Audit, Support drafts).
 * Persists in localStorage only — does not modify server/Supabase.
 */

const PREFIX = "snapsell_admin_ws_";

export function wsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function wsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export type AuditEntry = {
  id: string;
  timestamp: number;
  admin: string;
  action: string;
  target: string;
  status: "success" | "info" | "warning";
  meta?: string;
};

function currentAuditAdmin(): string {
  try {
    const raw = sessionStorage.getItem("snapsell_admin_rbac_session");
    if (!raw) return "admin";
    const s = JSON.parse(raw) as { email?: string; name?: string };
    return s.email || s.name || "admin";
  } catch {
    return "admin";
  }
}

export function appendAudit(
  entry: Omit<AuditEntry, "id" | "timestamp" | "admin"> & { admin?: string; timestamp?: number }
) {
  const list = wsGet<AuditEntry[]>("audit_logs", []);
  const next: AuditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? Date.now(),
    admin: entry.admin || currentAuditAdmin(),
    action: entry.action,
    target: entry.target,
    status: entry.status,
    meta: entry.meta,
  };
  list.unshift(next);
  wsSet("audit_logs", list.slice(0, 2000));
  return next;
}

export type LegalDoc = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  updatedAt: number;
  updatedBy: string;
  versions: { at: number; by: string; content: string }[];
};

export type ContactInfo = {
  companyName: string;
  supportEmail: string;
  salesEmail: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  workingHours: string;
  mapsUrl: string;
  social: Record<string, string>;
  published: boolean;
  updatedAt: number;
};

export type SupportTicket = {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "open" | "waiting" | "resolved" | "closed";
  createdAt: number;
  assignedAdmin: string;
  messages: { at: number; from: string; body: string; internal?: boolean }[];
};

export type Announcement = {
  id: string;
  title: string;
  subtitle: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
  type: "information" | "update" | "promotion" | "maintenance" | "emergency";
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "published" | "archived";
  startDate: string;
  endDate: string;
  audience: string;
  visibility: "banner" | "popup" | "badge";
  updatedAt: number;
};

export type ContentBlock = {
  id: string;
  area: "homepage" | "pricing" | "faq" | "email" | "website" | "app";
  key: string;
  value: string;
  updatedAt: number;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
};
