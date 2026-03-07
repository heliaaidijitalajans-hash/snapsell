import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function FAQPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = [
    { qKey: "faq.q1", aKey: "faq.a1" },
    { qKey: "faq.q2", aKey: "faq.a2" },
    { qKey: "faq.q3", aKey: "faq.a3" },
  ];
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900">{t("faq.title")}</h1>
      <p className="mt-4 text-lg text-gray-600">{t("faq.subtitle")}</p>
      <div className="mt-12 space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button type="button" onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex justify-between items-center px-6 py-4 text-left font-medium text-gray-900 hover:bg-gray-50">
              {t(faq.qKey)}
              <span className="text-gray-500 text-xl">{openIndex === i ? "−" : "+"}</span>
            </button>
            {openIndex === i && <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-2">{t(faq.aKey)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
