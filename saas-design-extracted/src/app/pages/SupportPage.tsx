import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";

export function SupportPage() {
  const { t } = useLanguage();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900">{t("support.title")}</h1>
      <p className="mt-4 text-lg text-gray-600 uppercase tracking-wide">{t("support.subtitle")}</p>
      <div className="mt-12 space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("support.email")}</h2>
          <p className="text-gray-600 mb-3">{t("support.emailDesc")}</p>
          <a
            href="https://mail.google.com/mail/?view=cm&to=Snapsell.destek@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/50 focus:ring-offset-2"
          >
            Snapsell.destek@gmail.com — {t("support.emailWrite")}
          </a>
        </section>
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("footer.whatsappTitle")}</h2>
          <a
            href="https://wa.me/905011102818"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white bg-[#25D366] hover:bg-[#20bd5a] font-medium focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:ring-offset-2"
          >
            0501 110 28 18
          </a>
          <p className="text-gray-500 text-sm mt-3">{t("footer.whatsappHint")}</p>
        </section>
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("support.faq")}</h2>
          <Link to="/sss" className="inline-flex px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#FF5A5F]/90">{t("support.faqLink")}</Link>
        </section>
      </div>
    </div>
  );
}
