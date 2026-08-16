import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Supported languages per spec section 10. fa/ar are RTL, all others LTR.
export const SUPPORTED_LANGUAGES = ["en", "fa", "ar", "tr", "fr", "de", "es", "nl"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ["fa", "ar"];

export function isRtl(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang as SupportedLanguage);
}

const resources = {
  en: {
    translation: {
      "app.tagline": "One app. Every need. Anywhere in the world.",
      "chat.placeholder": "Ask Mass Diamond anything...",
      "chat.heading": "How can I help you?",
      "nav.home": "Home",
      "nav.search": "Search",
      "nav.marketplace": "Marketplace",
      "nav.realEstate": "Real Estate",
      "nav.businesses": "Businesses",
      "nav.messages": "Messages",
      "nav.notifications": "Notifications",
      "nav.profile": "Profile",
      "capability.search": "Search",
      "capability.marketplace": "Marketplace",
      "capability.realEstate": "Real Estate",
      "capability.businesses": "Businesses",
      "empty.conversations": "No conversations yet.",
      "empty.marketplace": "No marketplace listings found.",
      "empty.properties": "No properties found.",
      "empty.businesses": "No businesses found.",
      "empty.notifications": "No notifications yet.",
      "config.aiRequired": "AI provider is not configured.",
      "config.searchRequired": "Search provider is not configured."
    }
  },
  fa: {
    translation: {
      "app.tagline": "یک اپلیکیشن. همه نیازها. در هر نقطه از جهان.",
      "chat.placeholder": "هر چیزی از Mass Diamond بپرس...",
      "chat.heading": "چطور می‌توانم کمکتان کنم؟",
      "nav.home": "خانه",
      "nav.search": "جستجو",
      "nav.marketplace": "بازار",
      "nav.realEstate": "املاک",
      "nav.businesses": "کسب‌وکارها",
      "capability.search": "جستجو",
      "capability.marketplace": "بازار",
      "capability.realEstate": "املاک",
      "capability.businesses": "کسب‌وکارها",
      "empty.conversations": "هنوز گفتگویی وجود ندارد.",
      "empty.marketplace": "آگهی‌ای در بازار یافت نشد.",
      "empty.properties": "ملکی یافت نشد.",
      "empty.businesses": "کسب‌وکاری یافت نشد.",
      "empty.notifications": "هنوز اعلانی وجود ندارد.",
      "config.aiRequired": "سرویس هوش مصنوعی پیکربندی نشده است.",
      "config.searchRequired": "سرویس جستجو پیکربندی نشده است."
    }
  },
  ar: {
    translation: {
      "app.tagline": "تطبيق واحد. كل الاحتياجات. في أي مكان في العالم.",
      "chat.placeholder": "اسأل Mass Diamond أي شيء...",
      "chat.heading": "كيف يمكنني مساعدتك؟",
      "nav.home": "الرئيسية",
      "nav.search": "بحث",
      "nav.marketplace": "السوق",
      "nav.realEstate": "العقارات",
      "nav.businesses": "الأعمال",
      "empty.conversations": "لا توجد محادثات بعد.",
      "config.aiRequired": "لم يتم تكوين مزود الذكاء الاصطناعي."
    }
  },
  tr: { translation: { "app.tagline": "Tek uygulama. Her ihtiyaç. Dünyanın her yerinde.", "nav.home": "Ana Sayfa" } },
  fr: { translation: { "app.tagline": "Une application. Tous les besoins. Partout dans le monde.", "nav.home": "Accueil" } },
  de: { translation: { "app.tagline": "Eine App. Jeder Bedarf. Überall auf der Welt.", "nav.home": "Startseite" } },
  es: { translation: { "app.tagline": "Una app. Cada necesidad. En cualquier parte del mundo.", "nav.home": "Inicio" } },
  nl: { translation: { "app.tagline": "Eén app. Elke behoefte. Overal ter wereld.", "nav.home": "Start" } }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false }
  });

export default i18n;
