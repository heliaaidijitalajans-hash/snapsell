import { Link } from "react-router";
import { EditorReplicatePage } from "../../pages/EditorReplicatePage";
import { useAuth } from "../../contexts/AuthContext";
import { PageHeader } from "../components/ui";

/**
 * Admin entry point into the production transformation system.
 * Renders the exact same EditorReplicatePage used at /gorsel-duzenleme.
 * No duplicated upload/pipeline/result/price UI.
 *
 * Test mode: when the browser Supabase session is ADMIN_EMAIL, the existing
 * server path skips credit deduction and conversion counters (unchanged APIs).
 */
export function AdminTestTransformPage() {
  const { user } = useAuth();

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-white/[0.06] bg-[#0B0B0B] text-white">
        <PageHeader
          title="Test Dönüşümü"
          subtitle="Production görsel düzenleme akışı — aynı bileşenler, hook’lar ve API’ler. Test için SnapSell’de ADMIN_EMAIL oturumu açık olmalı (kredi düşmez)."
        />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200">
            Test Mode
          </span>
          {user?.email ? (
            <span className="text-white/50">
              SnapSell oturumu: <span className="text-white/80">{user.email}</span>
            </span>
          ) : (
            <span className="text-white/50">
              SnapSell oturumu yok.{" "}
              <Link to="/login" className="text-[#FF5A5F] hover:underline">
                Giriş yap
              </Link>{" "}
              (ADMIN_EMAIL) — aksi halde ücretsiz hak / kredi kuralları geçerli olur.
            </span>
          )}
        </div>
      </div>

      {/* Reset admin shell text-white so production editor colors match /gorsel-duzenleme */}
      <div className="bg-gray-50 text-gray-900 min-h-[70vh]">
        <EditorReplicatePage />
      </div>
    </div>
  );
}
