import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

export function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900">{t("about.title")}</h1>

      <div className="mt-8 prose prose-gray max-w-none">
        <p className="text-lg text-gray-600">{t("about.p1")}</p>
        <p className="text-gray-600">{t("about.p2")}</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-10">{t("about.missionTitle")}</h2>
        <p className="text-gray-600">{t("about.mission")}</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-10">{t("about.contactTitle")}</h2>
        <p className="text-gray-600">
          {t("about.contact")}{" "}
          <Link to="/destek" className="text-[#FF5A5F] hover:underline">{t("about.contactLink")}</Link> {t("about.contactSuffix")}
        </p>
      </div>
    </div>
  );
}
