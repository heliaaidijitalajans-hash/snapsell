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
  { titleKey: "refund.s1Title" as const, bodyKey: "refund.s1" as const },
  { titleKey: "refund.s2Title" as const, bodyKey: "refund.s2" as const },
  { titleKey: "refund.s3Title" as const, bodyKey: "refund.s3" as const },
  { titleKey: "refund.s4Title" as const, bodyKey: "refund.s4" as const },
  { titleKey: "refund.s5Title" as const, bodyKey: "refund.s5" as const },
  { titleKey: "refund.s6Title" as const, bodyKey: "refund.s6" as const },
  { titleKey: "refund.s7Title" as const, bodyKey: "refund.s7" as const },
];

export function RefundPolicyPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{t("refund.title")}</h1>
      <p className="mt-2 text-sm text-gray-500">{t("refund.updated")}</p>

      <div className="mt-8 text-gray-600 space-y-8">
        {SECTION_KEYS.map(({ titleKey, bodyKey }) => {
          const body = t(bodyKey);
          if (!body) return null;
          const title = t(titleKey);
          return (
            <section key={titleKey}>
              {title && <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>}
              <div className="terms-body">{renderSectionContent(body)}</div>
            </section>
          );
        })}
        <p className="pt-4">
          {t("refund.contact")}{" "}
          <Link to="/destek" className="text-[#FF5A5F] hover:underline">
            {t("refund.contactLink")}
          </Link>{" "}
          {t("refund.contactSuffix")}
        </p>
      </div>
    </div>
  );
}
