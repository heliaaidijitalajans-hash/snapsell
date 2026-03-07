import { useLanguage } from "../contexts/LanguageContext";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LOCALES = [
  { code: "tr" as const, label: "Türkçe" },
  { code: "en" as const, label: "English" },
];

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-[#FF5A5F] transition-colors text-sm font-medium"
        aria-label={t("nav.language") || "Dil seçin"}
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                locale === l.code
                  ? "bg-[#FF5A5F]/10 text-[#FF5A5F] font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
