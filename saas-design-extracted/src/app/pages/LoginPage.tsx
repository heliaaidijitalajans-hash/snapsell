import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { signIn, signUp, syncUserRowWithBackend } from "../lib/supabaseAuth";

export function LoginPage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Only redirect after auth is ready. Do NOT redirect to /login until loading === false.
  // Only redirect to home when !loading && user.
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoadingAction(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session?.access_token) {
          console.log("👤 Creating Supabase user");
          await syncUserRowWithBackend();
          console.log("✅ User created");
        }
      } else {
        const { error: loginError } = await signIn({ email, password });
        if (loginError) throw loginError;
        console.log("👤 Creating Supabase user");
        await syncUserRowWithBackend();
        console.log("✅ User created");
      }
    } catch (e: unknown) {
      const err = e && typeof e === "object" && "message" in e ? (e as { message: string }) : null;
      setError(err?.message || "İşlem başarısız.");
    } finally {
      setLoadingAction(false);
    }
  }

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t("nav.login")}</h1>
        <p className="text-gray-600 text-center text-sm mb-6">{isSignup ? t("nav.register") : t("nav.login")}</p>
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        )}
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
          onClick={() => setIsSignup((v) => !v)}
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
