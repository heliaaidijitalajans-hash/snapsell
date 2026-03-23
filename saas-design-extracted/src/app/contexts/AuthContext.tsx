import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { signOut as supabaseSignOut } from "../lib/supabaseAuth";
import { getApiBase, apiJson } from "../config";

type AuthContextValue = {
  user: User | null;
  sessionId: string | null;
  loading: boolean;
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
  } catch (_) {
    // ag hatasi veya sunucu ulasilamaz - sessizce bos session
  }
  return "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null
  );
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || "";
    if (token) return { Authorization: "Bearer " + token };
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
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safetyTimer = globalThis.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      globalThis.clearTimeout(safetyTimer);
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        const sid = await ensureSession();
        if (!cancelled) setSessionId(sid || null);
      } else {
        setSessionId(null);
        localStorage.removeItem(SESSION_KEY);
        try {
          const token = session?.access_token;
          if (token) {
            await fetch(`${getApiBase()}/api/auth/supabase`, {
              method: "POST",
              headers: { Authorization: "Bearer " + token },
            });
          }
        } catch (_) {}
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      globalThis.clearTimeout(safetyTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    sessionId,
    loading,
    getAuthHeaders,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
