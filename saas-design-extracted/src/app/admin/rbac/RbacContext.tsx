import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { appendAudit, wsGet, wsSet } from "../lib/workspace";
import {
  ALL_PERMISSIONS,
  type Permission,
  type RoleId,
  hashPassword,
  resolvePermissions,
  hasPermission as checkHas,
} from "./permissions";

const SESSION_KEY = "snapsell_admin_rbac_session";

export type Administrator = {
  id: string;
  name: string;
  email: string;
  /** SHA-256 hex (local accounts). Empty for bootstrap Super Admin from server login. */
  passwordHash: string;
  roles: RoleId[];
  /** Extra permissions beyond roles. */
  permissions: Permission[];
  disabled: boolean;
  createdAt: number;
  lastLoginAt: number | null;
  lastActiveAt: number | null;
  /** Server-authenticated Super Admin (cannot be deleted by others). */
  isBootstrapSuper?: boolean;
};

export type AdminSession = {
  adminId: string;
  email: string;
  name: string;
  roles: RoleId[];
  permissions: Permission[];
};

type RbacContextValue = {
  session: AdminSession | null;
  administrators: Administrator[];
  permissions: Permission[];
  can: (permission: Permission | Permission[]) => boolean;
  setSessionFromServerLogin: (emailHint?: string) => void;
  tryLocalLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  clearSession: () => void;
  touchActive: () => void;
  createAdministrator: (input: {
    name: string;
    email: string;
    password: string;
    roles: RoleId[];
    permissions?: Permission[];
  }) => Promise<{ ok: boolean; error?: string }>;
  updateAdministrator: (
    id: string,
    patch: Partial<Pick<Administrator, "name" | "email" | "roles" | "permissions" | "disabled">>
  ) => { ok: boolean; error?: string };
  resetAdministratorPassword: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAdministrator: (id: string) => { ok: boolean; error?: string };
};

const RbacContext = createContext<RbacContextValue | null>(null);

const BOOTSTRAP_ID = "bootstrap_super_admin";

function defaultAdmins(): Administrator[] {
  return [
    {
      id: BOOTSTRAP_ID,
      name: "Super Admin",
      email: "super@snapsell.admin",
      passwordHash: "",
      roles: ["super_admin"],
      permissions: [],
      disabled: false,
      createdAt: Date.now(),
      lastLoginAt: null,
      lastActiveAt: null,
      isBootstrapSuper: true,
    },
  ];
}

function loadAdmins(): Administrator[] {
  const list = wsGet<Administrator[]>("administrators", defaultAdmins());
  if (!list.some((a) => a.isBootstrapSuper)) {
    return [...defaultAdmins(), ...list];
  }
  return list;
}

function saveAdmins(list: Administrator[]) {
  wsSet("administrators", list);
}

function loadSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

function saveSession(session: AdminSession | null) {
  try {
    if (!session) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function useRbac() {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbac must be used within RbacProvider");
  return ctx;
}

/** Optional: pages that may render outside provider during lazy load. */
export function useRbacOptional() {
  return useContext(RbacContext);
}

export function RbacProvider({ children }: { children: ReactNode }) {
  const [administrators, setAdministrators] = useState<Administrator[]>(() => loadAdmins());
  const [session, setSession] = useState<AdminSession | null>(() => loadSession());

  useEffect(() => {
    saveAdmins(administrators);
  }, [administrators]);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const permissions = useMemo(() => {
    if (!session) return [];
    const admin = administrators.find((a) => a.id === session.adminId);
    if (admin) return resolvePermissions(admin.roles, admin.permissions);
    return resolvePermissions(session.roles, session.permissions || []);
  }, [session, administrators]);

  const can = useCallback(
    (permission: Permission | Permission[]) => checkHas(permissions, permission),
    [permissions]
  );

  const buildSession = (admin: Administrator): AdminSession => ({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    roles: admin.roles,
    permissions: resolvePermissions(admin.roles, admin.permissions),
  });

  const setSessionFromServerLogin = useCallback((emailHint?: string) => {
    setAdministrators((prev) => {
      const next = [...prev];
      let superAdmin = next.find((a) => a.isBootstrapSuper);
      if (!superAdmin) {
        superAdmin = defaultAdmins()[0];
        next.unshift(superAdmin);
      }
      const now = Date.now();
      superAdmin = {
        ...superAdmin,
        email: emailHint || superAdmin.email,
        lastLoginAt: now,
        lastActiveAt: now,
        roles: ["super_admin"],
        permissions: [],
        disabled: false,
      };
      const idx = next.findIndex((a) => a.id === superAdmin!.id);
      if (idx >= 0) next[idx] = superAdmin;
      else next.unshift(superAdmin);

      const sess = buildSession(superAdmin);
      setSession(sess);
      appendAudit({
        admin: superAdmin.email,
        action: "Admin login",
        target: "server",
        status: "success",
        meta: "super_admin",
      });
      return next;
    });
  }, []);

  const tryLocalLogin = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const admin = administrators.find((a) => a.email.toLowerCase() === normalized);
    if (!admin) {
      appendAudit({ admin: normalized || "unknown", action: "Failed login", target: "local", status: "warning" });
      return { ok: false, error: "Invalid email or password" };
    }
    if (admin.disabled) {
      appendAudit({ admin: admin.email, action: "Failed login", target: "disabled", status: "warning" });
      return { ok: false, error: "This administrator is disabled" };
    }
    if (admin.isBootstrapSuper && !admin.passwordHash) {
      return {
        ok: false,
        error: "Use the master admin password (server login) for Super Admin, or set a local password first.",
      };
    }
    const hash = await hashPassword(password);
    if (hash !== admin.passwordHash) {
      appendAudit({ admin: admin.email, action: "Failed login", target: "local", status: "warning" });
      return { ok: false, error: "Invalid email or password" };
    }
    const now = Date.now();
    setAdministrators((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, lastLoginAt: now, lastActiveAt: now } : a))
    );
    const sess = buildSession({ ...admin, lastLoginAt: now, lastActiveAt: now });
    setSession(sess);
    appendAudit({
      admin: admin.email,
      action: "Admin login",
      target: "local",
      status: "success",
      meta: admin.roles.join(","),
    });
    return { ok: true };
  }, [administrators]);

  const clearSession = useCallback(() => {
    if (session) {
      appendAudit({ admin: session.email, action: "Admin logout", target: "session", status: "info" });
    }
    setSession(null);
  }, [session]);

  const touchActive = useCallback(() => {
    if (!session) return;
    setAdministrators((prev) =>
      prev.map((a) => (a.id === session.adminId ? { ...a, lastActiveAt: Date.now() } : a))
    );
  }, [session]);

  const createAdministrator = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      roles: RoleId[];
      permissions?: Permission[];
    }) => {
      if (!can("manage_admins")) return { ok: false, error: "Access denied" };
      const email = input.email.trim().toLowerCase();
      if (!email || !input.password || input.password.length < 6) {
        return { ok: false, error: "Valid email and password (min 6) required" };
      }
      if (administrators.some((a) => a.email.toLowerCase() === email)) {
        return { ok: false, error: "Email already exists" };
      }
      if (input.roles.includes("super_admin") && !session?.roles.includes("super_admin")) {
        return { ok: false, error: "Only Super Admin can create Super Admins" };
      }
      const passwordHash = await hashPassword(input.password);
      const admin: Administrator = {
        id: `adm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: input.name.trim() || email,
        email,
        passwordHash,
        roles: input.roles.length ? input.roles : ["support"],
        permissions: input.permissions || [],
        disabled: false,
        createdAt: Date.now(),
        lastLoginAt: null,
        lastActiveAt: null,
      };
      setAdministrators((prev) => [...prev, admin]);
      appendAudit({
        admin: session?.email || "admin",
        action: "Admin created",
        target: email,
        status: "success",
        meta: admin.roles.join(","),
      });
      return { ok: true };
    },
    [administrators, can, session]
  );

  const updateAdministrator = useCallback(
    (id: string, patch: Partial<Pick<Administrator, "name" | "email" | "roles" | "permissions" | "disabled">>) => {
      if (!can("manage_admins") && !can("assign_permissions")) {
        return { ok: false, error: "Access denied" };
      }
      const target = administrators.find((a) => a.id === id);
      if (!target) return { ok: false, error: "Not found" };
      if (target.isBootstrapSuper && patch.disabled) {
        return { ok: false, error: "Cannot disable bootstrap Super Admin" };
      }
      if (target.roles.includes("super_admin") && !session?.roles.includes("super_admin")) {
        return { ok: false, error: "Cannot modify Super Admins" };
      }
      if (patch.roles?.includes("super_admin") && !session?.roles.includes("super_admin")) {
        return { ok: false, error: "Cannot assign Super Admin role" };
      }
      setAdministrators((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          return {
            ...a,
            ...patch,
            email: patch.email ? patch.email.trim().toLowerCase() : a.email,
          };
        })
      );
      appendAudit({
        admin: session?.email || "admin",
        action: patch.roles ? "Role changed" : patch.permissions ? "Permission updated" : "Administrator updated",
        target: target.email,
        status: "success",
        meta: JSON.stringify(patch),
      });
      // Refresh session if editing self
      if (session?.adminId === id) {
        const updated = { ...target, ...patch };
        setSession(
          buildSession({
            ...updated,
            roles: patch.roles || target.roles,
            permissions: patch.permissions ?? target.permissions,
          } as Administrator)
        );
      }
      return { ok: true };
    },
    [administrators, can, session]
  );

  const resetAdministratorPassword = useCallback(
    async (id: string, password: string) => {
      if (!can("manage_admins")) return { ok: false, error: "Access denied" };
      if (password.length < 6) return { ok: false, error: "Password min 6 characters" };
      const target = administrators.find((a) => a.id === id);
      if (!target) return { ok: false, error: "Not found" };
      if (target.roles.includes("super_admin") && !session?.roles.includes("super_admin") && !target.isBootstrapSuper) {
        return { ok: false, error: "Cannot reset Super Admin password" };
      }
      const passwordHash = await hashPassword(password);
      setAdministrators((prev) => prev.map((a) => (a.id === id ? { ...a, passwordHash } : a)));
      appendAudit({
        admin: session?.email || "admin",
        action: "Administrator password reset",
        target: target.email,
        status: "success",
      });
      return { ok: true };
    },
    [administrators, can, session]
  );

  const deleteAdministrator = useCallback(
    (id: string) => {
      if (!can("manage_admins")) return { ok: false, error: "Access denied" };
      const target = administrators.find((a) => a.id === id);
      if (!target) return { ok: false, error: "Not found" };
      if (target.isBootstrapSuper) return { ok: false, error: "Cannot delete bootstrap Super Admin" };
      if (target.roles.includes("super_admin") && !session?.roles.includes("super_admin")) {
        return { ok: false, error: "Cannot delete Super Admins" };
      }
      if (session?.adminId === id) return { ok: false, error: "Cannot delete yourself" };
      setAdministrators((prev) => prev.filter((a) => a.id !== id));
      appendAudit({
        admin: session?.email || "admin",
        action: "Administrator deleted",
        target: target.email,
        status: "warning",
      });
      return { ok: true };
    },
    [administrators, can, session]
  );

  const value: RbacContextValue = {
    session,
    administrators,
    permissions,
    can,
    setSessionFromServerLogin,
    tryLocalLogin,
    clearSession,
    touchActive,
    createAdministrator,
    updateAdministrator,
    resetAdministratorPassword,
    deleteAdministrator,
  };

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export { ALL_PERMISSIONS };
