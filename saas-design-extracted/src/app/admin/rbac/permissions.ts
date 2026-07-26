/**
 * Extensible RBAC catalog for SnapSell Admin.
 * Add new permissions here — roles and UI guards pick them up automatically.
 */

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_USERS: "view_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  EDIT_CREDITS: "edit_credits",
  VIEW_IMAGES: "view_images",
  MANAGE_IMAGES: "manage_images",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_PLANS: "manage_plans",
  VIEW_SUBSCRIPTIONS: "view_subscriptions",
  EDIT_CONTENT: "edit_content",
  EDIT_LEGAL: "edit_legal",
  MANAGE_ANNOUNCEMENTS: "manage_announcements",
  MANAGE_CONTACT: "manage_contact",
  REPLY_SUPPORT: "reply_support",
  MANAGE_FAQ: "manage_faq",
  VIEW_AUDIT: "view_audit",
  MANAGE_API_KEYS: "manage_api_keys",
  MANAGE_SMTP: "manage_smtp",
  MAINTENANCE_MODE: "maintenance_mode",
  FEATURE_FLAGS: "feature_flags",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_ADMINS: "manage_admins",
  ASSIGN_PERMISSIONS: "assign_permissions",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.VIEW_DASHBOARD]: "View Dashboard",
  [PERMISSIONS.VIEW_USERS]: "View Users",
  [PERMISSIONS.EDIT_USERS]: "Edit Users",
  [PERMISSIONS.DELETE_USERS]: "Delete Users",
  [PERMISSIONS.EDIT_CREDITS]: "Edit Credits",
  [PERMISSIONS.VIEW_IMAGES]: "View AI Images",
  [PERMISSIONS.MANAGE_IMAGES]: "Manage AI Images",
  [PERMISSIONS.VIEW_ANALYTICS]: "View Analytics",
  [PERMISSIONS.MANAGE_PLANS]: "Manage Plans",
  [PERMISSIONS.VIEW_SUBSCRIPTIONS]: "View Subscriptions",
  [PERMISSIONS.EDIT_CONTENT]: "Edit Content",
  [PERMISSIONS.EDIT_LEGAL]: "Edit Legal Documents",
  [PERMISSIONS.MANAGE_ANNOUNCEMENTS]: "Manage Announcements",
  [PERMISSIONS.MANAGE_CONTACT]: "Manage Contact Information",
  [PERMISSIONS.REPLY_SUPPORT]: "Reply Support Tickets",
  [PERMISSIONS.MANAGE_FAQ]: "Manage FAQs",
  [PERMISSIONS.VIEW_AUDIT]: "View Audit Logs",
  [PERMISSIONS.MANAGE_API_KEYS]: "Manage API Keys",
  [PERMISSIONS.MANAGE_SMTP]: "Manage SMTP",
  [PERMISSIONS.MAINTENANCE_MODE]: "Maintenance Mode",
  [PERMISSIONS.FEATURE_FLAGS]: "Feature Flags",
  [PERMISSIONS.MANAGE_SETTINGS]: "Manage System Settings",
  [PERMISSIONS.MANAGE_ADMINS]: "Manage Administrators",
  [PERMISSIONS.ASSIGN_PERMISSIONS]: "Assign Permissions",
};

export type RoleId = "super_admin" | "admin" | "support" | "analyst" | "content_editor";

export const ROLE_META: Record<RoleId, { label: string; description: string }> = {
  super_admin: {
    label: "Super Admin",
    description: "Full access. Manage administrators, permissions, audit and system credentials.",
  },
  admin: {
    label: "Admin",
    description: "Users, subscriptions, AI images, announcements. No Super Admin or secrets.",
  },
  support: {
    label: "Support",
    description: "Support center, tickets, FAQs. Read-only user profiles.",
  },
  analyst: {
    label: "Analyst",
    description: "Read-only dashboard, analytics and reports.",
  },
  content_editor: {
    label: "Content Editor",
    description: "Homepage, pricing, FAQ, legal, contact and announcements.",
  },
};

export const ROLE_PERMISSIONS: Record<RoleId, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.EDIT_CREDITS,
    PERMISSIONS.VIEW_IMAGES,
    PERMISSIONS.MANAGE_IMAGES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_PLANS,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_CONTACT,
    PERMISSIONS.REPLY_SUPPORT,
    PERMISSIONS.MANAGE_FAQ,
    PERMISSIONS.VIEW_AUDIT,
  ],
  support: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.REPLY_SUPPORT,
    PERMISSIONS.MANAGE_FAQ,
    PERMISSIONS.MANAGE_CONTACT,
  ],
  analyst: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  content_editor: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.EDIT_LEGAL,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_CONTACT,
    PERMISSIONS.MANAGE_FAQ,
  ],
};

/** Path prefix → permission required to open the page. */
export const ROUTE_PERMISSIONS: { match: (path: string) => boolean; permission: Permission }[] = [
  { match: (p) => p === "/admin" || p === "/admin/", permission: PERMISSIONS.VIEW_DASHBOARD },
  { match: (p) => p.startsWith("/admin/test-donusumu"), permission: PERMISSIONS.MANAGE_IMAGES },
  { match: (p) => p.startsWith("/admin/users"), permission: PERMISSIONS.VIEW_USERS },
  { match: (p) => p.startsWith("/admin/images"), permission: PERMISSIONS.VIEW_IMAGES },
  { match: (p) => p.startsWith("/admin/subscriptions"), permission: PERMISSIONS.VIEW_SUBSCRIPTIONS },
  { match: (p) => p.startsWith("/admin/analytics"), permission: PERMISSIONS.VIEW_ANALYTICS },
  { match: (p) => p.startsWith("/admin/content"), permission: PERMISSIONS.EDIT_CONTENT },
  { match: (p) => p.startsWith("/admin/legal"), permission: PERMISSIONS.EDIT_LEGAL },
  {
    match: (p) => p.startsWith("/admin/support/inbox") || p.startsWith("/admin/support/faq"),
    permission: PERMISSIONS.REPLY_SUPPORT,
  },
  { match: (p) => p.startsWith("/admin/support"), permission: PERMISSIONS.MANAGE_CONTACT },
  { match: (p) => p.startsWith("/admin/announcements"), permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS },
  { match: (p) => p.startsWith("/admin/audit"), permission: PERMISSIONS.VIEW_AUDIT },
  { match: (p) => p.startsWith("/admin/administrators"), permission: PERMISSIONS.MANAGE_ADMINS },
  { match: (p) => p.startsWith("/admin/settings/api"), permission: PERMISSIONS.MANAGE_API_KEYS },
  { match: (p) => p.startsWith("/admin/settings/smtp"), permission: PERMISSIONS.MANAGE_SMTP },
  { match: (p) => p.startsWith("/admin/settings/flags"), permission: PERMISSIONS.FEATURE_FLAGS },
  { match: (p) => p.startsWith("/admin/settings/maintenance"), permission: PERMISSIONS.MAINTENANCE_MODE },
  { match: (p) => p.startsWith("/admin/settings"), permission: PERMISSIONS.MANAGE_SETTINGS },
];

export function permissionForPath(pathname: string): Permission | null {
  const rule = ROUTE_PERMISSIONS.find((r) => r.match(pathname));
  return rule?.permission ?? null;
}

export function resolvePermissions(roles: RoleId[], extra: Permission[] = []): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] || []) set.add(p);
  }
  for (const p of extra) set.add(p);
  return [...set];
}

export function hasPermission(granted: readonly Permission[], needed: Permission | Permission[]): boolean {
  const need = Array.isArray(needed) ? needed : [needed];
  if (granted.includes(PERMISSIONS.MANAGE_ADMINS) && granted.length === ALL_PERMISSIONS.length) {
    // Super-style full set
  }
  return need.every((p) => granted.includes(p));
}

/** Simple non-crypto hash for local admin passwords (not for server auth). */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(`snapsell:${password}`);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback
  let h = 0;
  for (let i = 0; i < password.length; i++) h = (h * 31 + password.charCodeAt(i)) | 0;
  return `fallback_${h}`;
}
