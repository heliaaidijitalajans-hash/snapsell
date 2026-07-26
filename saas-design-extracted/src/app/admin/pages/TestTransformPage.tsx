import { EditorReplicatePage } from "../../pages/EditorReplicatePage";
import { useAdmin } from "../AdminContext";
import { PageHeader } from "../components/ui";

/**
 * Admin entry point into the production transformation system.
 * Renders the exact same EditorReplicatePage used at /gorsel-duzenleme.
 * Unlimited access via Admin Panel auth (X-Admin-Token) — production users unaffected.
 */
export function AdminTestTransformPage() {
  const { authenticated, adminToken, localOnly } = useAdmin();
  const isAdminAuthed = authenticated === true;
  const hasServerAdminToken = Boolean(adminToken);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 border-b border-white/[0.06] bg-[#0B0B0B] text-white">
        <PageHeader
          title="Test Dönüşümü"
          subtitle="Production görsel düzenleme akışı — plan, kredi ve limit kontrolleri Admin Panel oturumu ile bypass edilir. Müşteri kredileri / abonelikler etkilenmez."
        />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200">
            Test Mode · Unlimited
          </span>
          {isAdminAuthed && hasServerAdminToken ? (
            <span className="text-white/50">Admin Panel sunucu oturumu aktif — sınırsız test.</span>
          ) : isAdminAuthed && localOnly ? (
            <span className="text-amber-200/90">
              Yerel admin oturumu: UI açık. Sınırsız API bypass için Admin Panel’e master password (sunucu) ile giriş yapın.
            </span>
          ) : (
            <span className="text-white/50">Admin oturumu gerekli.</span>
          )}
        </div>
      </div>

      {/* Reset admin shell text-white so production editor colors match /gorsel-duzenleme */}
      <div className="bg-gray-50 text-gray-900 min-h-[70vh]">
        {isAdminAuthed ? (
          <EditorReplicatePage adminTestMode adminToken={adminToken} />
        ) : (
          <p className="p-8 text-center text-gray-500">Admin girişi gerekli.</p>
        )}
      </div>
    </div>
  );
}
