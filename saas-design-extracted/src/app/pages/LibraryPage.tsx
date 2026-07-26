import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router";

export type LibraryImage = {
  id: string;
  imageUrl: string;
  createdAt: string | null;
  source?: string;
  prompt?: string;
};

function logSupabaseLibraryError(err: unknown) {
  const e = err as { message?: string; code?: string; details?: string; hint?: string };
  console.warn(
    "Library Supabase error:",
    e.message || err,
    e.code ? `code=${e.code}` : "",
    e.details ? `details=${e.details}` : "",
    e.hint ? `hint=${e.hint}` : ""
  );
}

export function LibraryPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setImages([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadError(null);
      let data: {
        id: string;
        image_url?: string | null;
        created_at?: string | null;
        source?: string | null;
        prompt?: string | null;
      }[] | null = null;
      let error = null;

      const full = await supabase
        .from("images")
        .select("id, image_url, created_at, source, prompt")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      data = full.data;
      error = full.error;

      if (error && !cancelled) {
        logSupabaseLibraryError(error);
        const minimal = await supabase
          .from("images")
          .select("id, image_url, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (!minimal.error) {
          data = minimal.data;
          error = null;
        } else {
          logSupabaseLibraryError(minimal.error);
          error = minimal.error;
        }
      }

      if (cancelled) return;
      if (error) {
        const msg = (error as { message?: string }).message || String(error);
        setLoadError(msg);
        setImages([]);
        setLoading(false);
        return;
      }
      const list: LibraryImage[] = (data || []).map((row) => ({
        id: row.id,
        imageUrl: row.image_url || "",
        createdAt: row.created_at || null,
        source: row.source || "",
        prompt: row.prompt || "",
      }));
      setImages(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("library.title")}</h1>

      {!user ? (
        <p className="text-gray-500 text-center py-16">
          {t("library.signInToView")}
          <Link to="/login" className="text-[#FF5A5F] font-medium ml-1 hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-[#FF5A5F] border-t-transparent rounded-full" />
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
          <p className="font-medium mb-2">{t("library.loadErrorTitle")}</p>
          <p className="text-amber-800/90 mb-2">{t("library.loadErrorHint")}</p>
          <p className="font-mono text-xs text-amber-900/80 break-all">{loadError}</p>
        </div>
      ) : images.length === 0 ? (
        <p className="text-gray-500 text-center py-16">{t("library.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => navigate(`/kutuphane/${img.id}`)}
              className="text-left bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#FF5A5F]/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A5F]/50"
            >
              <div className="aspect-square bg-gray-100">
                {img.imageUrl && (
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {(img.prompt || "").substring(0, 120)}
                  {(img.prompt || "").length > 120 ? "…" : ""}
                </p>
                <p className="mt-2 text-xs font-medium text-[#FF5A5F]">{t("library.openSession")}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <strong>{t("library.note")}</strong> {t("library.noteText")}
      </p>
    </div>
  );
}
