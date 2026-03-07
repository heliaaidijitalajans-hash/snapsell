import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const API = typeof window !== "undefined" ? window.location.origin : "";
const PRODUCTS_KEY = "snapsell_products";
const MAX_LIBRARY_ITEMS = 20;

type ProductItem = {
  imageUrl?: string;
  enhancedImageUrl?: string | null;
  seo?: string;
  price?: string;
};

function sanitizeLibraryList(list: ProductItem[]): ProductItem[] {
  return list
    .map((p) => ({
      ...p,
      imageUrl: p.imageUrl && !String(p.imageUrl).startsWith("data:") ? p.imageUrl : undefined,
    }))
    .slice(0, MAX_LIBRARY_ITEMS);
}

export function LibraryPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      let list: ProductItem[] = raw ? JSON.parse(raw) : [];
      list = sanitizeLibraryList(list);
      setProducts(list);
      try {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
      } catch (_) {}
    } catch (_) {
      try {
        localStorage.removeItem(PRODUCTS_KEY);
      } catch (_) {}
      setProducts([]);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("library.title")}</h1>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          {t("library.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => {
            const imgSrc = p.enhancedImageUrl
              ? API + p.enhancedImageUrl
              : p.imageUrl || "";
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="aspect-square bg-gray-100">
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {(p.seo || "").substring(0, 120)}…
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <strong>{t("library.note")}</strong> {t("library.noteText")}
      </p>
    </div>
  );
}
