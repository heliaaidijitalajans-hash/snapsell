import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { getFirebaseFirestore } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { Link } from "react-router";

export type LibraryImage = {
  id: string;
  imageUrl: string;
  createdAt: { seconds: number } | null;
  source?: string;
  prompt?: string;
};

export function LibraryPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setImages([]);
      setLoading(false);
      return;
    }

    const db = getFirebaseFirestore();
    const q = query(
      collection(db, "images"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: LibraryImage[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            imageUrl: d.imageUrl || "",
            createdAt: d.createdAt && typeof d.createdAt.seconds === "number" ? { seconds: d.createdAt.seconds } : null,
            source: d.source,
            prompt: d.prompt,
          };
        });
        setImages(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Library Firestore error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

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
