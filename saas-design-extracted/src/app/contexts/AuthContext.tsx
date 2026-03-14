import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { onAuthStateChanged, getRedirectResult, setPersistence, browserLocalPersistence, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
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
  const [loading, setLoading] = useState(true); // Do NOT consider auth ready until onAuthStateChanged has fired

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    // Giriş yapmış kullanıcı varsa her zaman Bearer kullan (sayfa yenilenince eski session ile 3 hak dönmesin)
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: "Bearer " + token };
    }
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
  }, [user, sessionId]);

  const logout = useCallback(async () => {
    await auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Oturumun tarayıcı kapatıldıktan sonra da kalması için persistence'ı uygulama açılışında da ayarla.
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        if (!cancelled) console.warn("Firebase persistence:", err);
      }

      // Redirect ile dönüldüyse sonucu al (popup kullanıyorsak genelde boş döner).
      try {
        const credential = await getRedirectResult(auth);
        if (cancelled) return;
        if (credential?.user) {
          setUser(credential.user);
          setSessionId(null);
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (err) {
        if (!cancelled) console.warn("Firebase redirect result:", err);
      }

      if (cancelled) return;
      let pendingNullTimeout: ReturnType<typeof setTimeout> | null = null;
      unsubRef.current = onAuthStateChanged(auth, async (u) => {
        if (cancelled) return;
        if (pendingNullTimeout) {
          clearTimeout(pendingNullTimeout);
          pendingNullTimeout = null;
        }
        setUser(u || null);
        if (!u) {
          pendingNullTimeout = setTimeout(() => {
            if (cancelled) return;
            pendingNullTimeout = null;
            ensureSession().then((sid) => {
              if (!cancelled) setSessionId(sid || null);
            });
            setLoading(false);
          }, 1200);
        } else {
          setSessionId(null);
          localStorage.removeItem(SESSION_KEY);
          try {
            const token = await u.getIdToken();
            await fetch(`${getApiBase()}/api/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: token }),
            });
          } catch (_) {}
          setLoading(false);
        }
      });
      if (cancelled && unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  const value: AuthContextValue = {
    user,
    sessionId,
    loading,
    getAuthHeaders,
    logout,
  };

  // Do NOT redirect to /login until loading === false. Only redirect if !loading && !user.
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
