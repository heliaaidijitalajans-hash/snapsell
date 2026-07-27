import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { signIn, signUp, syncUserRowWithBackend } from "../lib/supabaseAuth";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export function LoginPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // AuthProvider oturum yüklenene kadar bu sayfayı göstermez; user varsa ana sayfaya.
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
    setLoadingAction(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session?.access_token) {
          setSuccessInfo(t("auth.signupHasSession"));
          await syncUserRowWithBackend();
          navigate("/", { replace: true });
        } else if (data.user && !data.session) {
          setSuccessInfo(t("auth.signupCheckEmail"));
        } else {
          setSuccessInfo(t("auth.signupCheckEmail"));
        }
      } else {
        const { error: loginError } = await signIn({ email, password });
        if (loginError) throw loginError;
        await syncUserRowWithBackend();
        navigate("/", { replace: true });
      }
    } catch (e: unknown) {
      let msg = "İşlem başarısız.";
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        msg =
          "Supabase veya API’ye bağlanılamadı. Aynı sitede /api kullanıyorsanız VITE_API_BASE_URL boş bırakın; VITE_SUPABASE_* değerlerini kontrol edin.";
      } else if (e && typeof e === "object" && "message" in e) {
        msg = String((e as { message: string }).message) || msg;
      }
      setError(msg);
    } finally {
      setLoadingAction(false);
    }
  }

  if (user) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t("nav.login")}</h1>
        <p className="text-gray-600 text-center text-sm mb-6">{isSignup ? t("nav.register") : t("nav.login")}</p>

        {successInfo && (
          <p className="mb-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">{successInfo}</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        )}

        {/* Birincil: Google — her zaman en üstte */}
        <GoogleSignInButton variant="login" onError={setError} disabled={loadingAction} />

        <p className="my-4 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex-1 h-px bg-gray-200" />
          {t("auth.orDivider")}
          <span className="flex-1 h-px bg-gray-200" />
        </p>

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
            minLength={6}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700"
          />
          <button
            type="submit"
            disabled={loadingAction}
            className="w-full px-4 py-3 rounded-xl bg-[#FF5A5F] text-white hover:bg-[#FF5A5F]/90 disabled:opacity-50"
          >
            {loadingAction ? "…" : (isSignup ? "Kayıt ol" : "Giriş yap")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setIsSignup((v) => !v);
            setSuccessInfo(null);
            setError(null);
          }}
          className="mt-3 w-full text-sm text-[#FF5A5F] hover:underline"
        >
          {isSignup ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
        </button>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/" className="text-[#FF5A5F] hover:underline">Ana sayfaya dön</Link>
        </p>
      </div>
    </div>
  );
}
