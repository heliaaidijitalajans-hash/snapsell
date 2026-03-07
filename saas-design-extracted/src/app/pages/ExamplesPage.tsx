import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

const EXAMPLE_IMAGES = [
  { file: "ornek1.png", altKey: "examples.alt1" },
  { file: "ornek2.png", altKey: "examples.alt2" },
  { file: "ornek3.png", altKey: "examples.alt3" },
  { file: "ornek4.png", altKey: "examples.alt4" },
  { file: "ornek5.png", altKey: "examples.alt5" },
  { file: "ornek6.png", altKey: "examples.alt6" },
  { file: "ornek7.png", altKey: "examples.alt7" },
] as const;

export function ExamplesPage() {
  const { t } = useLanguage();
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t("examples.title")}</h1>
      <p className="text-gray-600 mb-10">{t("examples.subtitle")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {EXAMPLE_IMAGES.map(({ file, altKey }) => (
          <div key={file} className="flex justify-center items-start bg-gray-50/50 rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[200px]">
            <img
              src={`${baseUrl}images/examples/${file}`}
              alt={t(altKey)}
              className="w-full h-auto max-h-[420px] object-contain"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/gorsel-duzenleme"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition"
        >
          {t("examples.ctaTry")}
        </Link>
        <Link
          to="/fiyatlandirma"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-[#FF5A5F] bg-gray-100 hover:bg-gray-200 transition"
        >
          {t("examples.ctaPricing")}
        </Link>
      </div>
    </div>
  );
}
