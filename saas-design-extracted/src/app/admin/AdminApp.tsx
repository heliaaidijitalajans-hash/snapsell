import { Loader2, Shield } from "lucide-react";
import { Outlet } from "react-router";
import { AdminProvider, useAdmin } from "./AdminContext";
import { AdminShell } from "./AdminShell";

function AdminLogin() {
  const { password, setPassword, loginError, handleLogin } = useAdmin();
  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-8 h-8 text-[#FF5A5F]" />
          <h2 className="text-xl font-bold text-white">Admin Login</h2>
        </div>
        <form onSubmit={(e) => void handleLogin(e)}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#121212] text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#FF5A5F]/50 outline-none mb-2"
            required
          />
          {loginError && <p className="text-sm text-red-400 mb-2">{loginError}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminGate() {
  const { loading, authenticated } = useAdmin();

  if (loading || authenticated === null) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5A5F] animate-spin" />
      </div>
    );
  }

  if (!authenticated) return <AdminLogin />;

  return <AdminShell />;
}

/** Root layout for /admin — auth gate + shell. Child routes render via Outlet. */
export function AdminApp() {
  return (
    <AdminProvider>
      <AdminGate />
    </AdminProvider>
  );
}

/** Passthrough for nested route elements that need admin context (already provided by parent). */
export function AdminOutlet() {
  return <Outlet />;
}
