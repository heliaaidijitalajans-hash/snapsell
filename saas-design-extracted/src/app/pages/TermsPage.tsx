import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

function renderTermsContent(text: string) {
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

export function TermsPage() {
  const { t } = useLanguage();
  const sections = [
    { titleKey: "terms.s1Title" as const, bodyKey: "terms.s1" as const },
    { titleKey: "terms.s2Title" as const, bodyKey: "terms.s2" as const },
    { titleKey: "terms.s3Title" as const, bodyKey: "terms.s3" as const },
    { titleKey: "terms.s4Title" as const, bodyKey: "terms.s4" as const },
    { titleKey: "terms.s5Title" as const, bodyKey: "terms.s5" as const },
    { titleKey: "terms.s6Title" as const, bodyKey: "terms.s6" as const },
    { titleKey: "terms.s7Title" as const, bodyKey: "terms.s7" as const },
    { titleKey: "terms.s8Title" as const, bodyKey: "terms.s8" as const },
    { titleKey: "terms.s9Title" as const, bodyKey: "terms.s9" as const },
    { titleKey: "terms.s10Title" as const, bodyKey: "terms.s10" as const },
    { titleKey: "terms.s11Title" as const, bodyKey: "terms.s11" as const },
    { titleKey: "terms.s12Title" as const, bodyKey: "terms.s12" as const },
    { titleKey: "terms.s13Title" as const, bodyKey: "terms.s13" as const },
    { titleKey: "terms.s14Title" as const, bodyKey: "terms.s14" as const },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{t("terms.title")}</h1>
      <p className="mt-2 text-sm text-gray-500">{t("terms.updated")}</p>

      <div className="mt-8 text-gray-600 space-y-8">
        {sections.map(({ titleKey, bodyKey }) => {
          const body = t(bodyKey);
          if (!body) return null;
          return (
            <section key={titleKey}>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t(titleKey)}</h2>
              <div className="terms-body">{renderTermsContent(body)}</div>
            </section>
          );
        })}
        <p className="pt-4">
          {t("terms.contact")}{" "}
          <Link to="/destek" className="text-[#FF5A5F] hover:underline">
            {t("terms.contactLink")}
          </Link>{" "}
          {t("terms.contactSuffix")}
        </p>
      </div>
    </div>
  );
}
