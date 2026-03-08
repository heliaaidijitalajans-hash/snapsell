import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";
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

async function ensureSession(): Promise<string> {
  let sid = localStorage.getItem(SESSION_KEY);
  if (sid) return sid;
  try {
    const res = await fetch(`${getApiBase()}/register`, { method: "POST" });
    const d = await apiJson<{ sessionId?: string }>(res).catch(() => ({}));
    if (d && d.sessionId) {
      localStorage.setItem(SESSION_KEY, d.sessionId);
      return d.sessionId;
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
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (u) {
      const token = await u.getIdToken();
      return { Authorization: "Bearer " + token };
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
    const auth = getFirebaseAuth();
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (!u) {
        const sid = await ensureSession();
        setSessionId(sid || null);
      } else {
        setSessionId(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value: AuthContextValue = {
    user,
    sessionId,
    loading,
    getAuthHeaders,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
