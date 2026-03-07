import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

function renderSectionContent(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const parts: React.ReactNode[] = [];
  let currentList: string[] = [];
  let currentParagraph: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      parts.push(
        <ul key={parts.length} className="list-disc list-inside my-2 space-y-1 ml-2">
          {currentList.map((item, i) => (
            <li key={i}>{item.replace(/^[•\-]\s*/, "")}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      parts.push(
        <p key={parts.length} className="my-2">
          {currentParagraph.join(" ")}
        </p>
      );
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      flushParagraph();
      currentList.push(trimmed);
    } else {
      flushList();
      currentParagraph.push(trimmed);
    }
  }
  flushList();
  flushParagraph();
  return <>{parts}</>;
}

const SECTION_KEYS = [
  { titleKey: "distance.s1Title" as const, bodyKey: "distance.s1" as const },
  { titleKey: "distance.s2Title" as const, bodyKey: "distance.s2" as const },
  { titleKey: "distance.s3Title" as const, bodyKey: "distance.s3" as const },
  { titleKey: "distance.s4Title" as const, bodyKey: "distance.s4" as const },
  { titleKey: "distance.s5Title" as const, bodyKey: "distance.s5" as const },
  { titleKey: "distance.s6Title" as const, bodyKey: "distance.s6" as const },
  { titleKey: "distance.s7Title" as const, bodyKey: "distance.s7" as const },
  { titleKey: "distance.s8Title" as const, bodyKey: "distance.s8" as const },
  { titleKey: "distance.s9Title" as const, bodyKey: "distance.s9" as const },
  { titleKey: "distance.s10Title" as const, bodyKey: "distance.s10" as const },
  { titleKey: "distance.s11Title" as const, bodyKey: "distance.s11" as const },
  { titleKey: "distance.s12Title" as const, bodyKey: "distance.s12" as const },
];

export function DistanceSalesPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{t("distance.title")}</h1>
      <p className="mt-2 text-sm text-gray-500">{t("distance.updated")}</p>

      <div className="mt-8 text-gray-600 space-y-8">
        {SECTION_KEYS.map(({ titleKey, bodyKey }) => {
          const body = t(bodyKey);
          if (!body) return null;
          return (
            <section key={titleKey}>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t(titleKey)}</h2>
              <div className="terms-body">{renderSectionContent(body)}</div>
            </section>
          );
        })}
        <p className="pt-4">
          {t("distance.contact")}{" "}
          <Link to="/destek" className="text-[#FF5A5F] hover:underline">
            {t("distance.contactLink")}
          </Link>{" "}
          {t("distance.contactSuffix")}
        </p>
      </div>
    </div>
  );
}
