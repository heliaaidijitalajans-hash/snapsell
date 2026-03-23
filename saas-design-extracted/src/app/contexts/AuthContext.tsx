import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { signOut as supabaseSignOut } from "../lib/supabaseAuth";
import { getApiBase, apiJson } from "../config";
import { authLog } from "../../lib/authConfig";
import { AuthLoadingScreen } from "../components/AuthLoadingScreen";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  sessionId: string | null;
  loading: boolean;
  /** İlk getSession tamamlandı mı (OAuth dönüşü sonrası dahil) */
  initialized: boolean;
  getAuthHeaders: () => Promise<Record<string, string>>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "snapsell_session";

type RegisterResponse = { sessionId?: string; data?: { sessionId?: string }; success?: boolean };

async function ensureSession(): Promise<string> {
  let sid = localStorage.getItem(SESSION_KEY);
  if (sid) return sid;
  try {
    const res = await fetch(`${getApiBase()}/api/register`, { method: "POST" });
    const d = await apiJson<RegisterResponse>(res).catch((): RegisterResponse => ({}));
    const sessionId = (d?.data?.sessionId ?? d?.sessionId) || "";
    if (sessionId) {
      localStorage.setItem(SESSION_KEY, sessionId);
      return sessionId;
    }
  } catch (_) {}
  return "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null
  );
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (isSupabaseConfigured) {
      let { data } = await supabase.auth.getSession();
      authLog("getAuthHeaders → getSession", {
        hasSession: !!data.session,
        userId: data.session?.user?.id ?? null,
      });
      let token = data.session?.access_token || "";
      if (!token) {
        try {
          const { data: ref } = await supabase.auth.refreshSession();
          token = ref.session?.access_token || "";
          authLog("getAuthHeaders → refreshSession", { hasToken: !!token });
        } catch (_) {}
      }
      if (token) return { Authorization: "Bearer " + token };
    }
    let sid = sessionId || localStorage.getItem(SESSION_KEY);
    if (!sid) sid = await ensureSession();
    if (sid) {
      setSessionId(sid);
      return { "X-Session-Id": sid };
    }
    return {};
  }, [sessionId]);

  const logout = useCallback(async () => {
    await supabaseSignOut();
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setUser(null);
    setSession(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;
    const safetyTimer = globalThis.setTimeout(() => {
      if (!cancelled) {
        authLog("safety timeout — clearing loading");
        setLoading(false);
        setInitialized(true);
      }
    }, 12000);

    if (!isSupabaseConfigured) {
      globalThis.clearTimeout(safetyTimer);
      setLoading(false);
      setInitialized(true);
      return;
    }

    async function applySession(next: Session | null) {
      setSession(next);
      const nextUser = next?.user ?? null;
      setUser(nextUser);
      authLog("applySession", { userId: nextUser?.id ?? null, email: nextUser?.email ?? null });

      if (isSupabaseConfigured && next?.access_token) {
        try {
          const { data: userData, error: userErr } = await supabase.auth.getUser();
          authLog("getUser()", { id: userData.user?.id, error: userErr?.message ?? null });
        } catch (e) {
          authLog("getUser() exception", e);
        }
      }

      if (!nextUser) {
        const sid = await ensureSession();
        if (!cancelled) setSessionId(sid || null);
      } else {
        setSessionId(null);
        localStorage.removeItem(SESSION_KEY);
        try {
          const token = next?.access_token;
          if (token) {
            await fetch(`${getApiBase()}/api/auth/supabase`, {
              method: "POST",
              headers: { Authorization: "Bearer " + token },
            });
          }
        } catch (_) {}
      }
      if (!cancelled) {
        setLoading(false);
        setInitialized(true);
      }
    }

    void (async () => {
      if (typeof window !== "undefined") {
        const search = window.location.search || "";
        if (search.includes("code=")) {
          authLog("OAuth PKCE: exchangeCodeForSession …");
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
            if (error) authLog("exchangeCodeForSession error", error.message);
          } catch (e) {
            authLog("exchangeCodeForSession failed", e);
          }
        }
      }

      const { data, error } = await supabase.auth.getSession();
      authLog("init getSession", {
        error: error?.message ?? null,
        hasSession: !!data.session,
        userId: data.session?.user?.id ?? null,
      });
      if (cancelled) return;
      await applySession(data.session ?? null);
      globalThis.clearTimeout(safetyTimer);

      const { data: subData } = supabase.auth.onAuthStateChange((event, sess) => {
        authLog("AUTH EVENT:", event, { userId: sess?.user?.id ?? null });
        if (cancelled) return;
        globalThis.clearTimeout(safetyTimer);
        void applySession(sess);
      });
      subscription = subData.subscription;
    })();

    return () => {
      cancelled = true;
      globalThis.clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    sessionId,
    loading,
    initialized,
    getAuthHeaders,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
