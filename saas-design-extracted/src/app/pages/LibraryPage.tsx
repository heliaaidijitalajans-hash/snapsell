import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Link } from "react-router";

export type LibraryImage = {
  id: string;
  imageUrl: string;
  createdAt: string | null;
  source?: string;
  prompt?: string;
};

export function LibraryPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setImages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("images")
        .select("id, image_url, created_at, source, prompt")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn("Library Supabase error:", error);
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
      ) : images.length === 0 ? (
        <p className="text-gray-500 text-center py-16">{t("library.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
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
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <strong>{t("library.note")}</strong> {t("library.noteText")}
      </p>
    </div>
  );
}
