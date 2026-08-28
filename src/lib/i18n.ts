import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Supported languages per spec section 10. fa/ar are RTL, all others LTR.
export const SUPPORTED_LANGUAGES = ["en", "fa", "ar", "tr", "fr", "de", "es", "nl", "ru", "ko", "ja", "hi"] as const;
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
      "chat.typing": "Assistant is typing...",
      "nav.home": "Home",
      "nav.search": "Search",
      "nav.marketplace": "Marketplace",
      "nav.realEstate": "Real Estate",
      "nav.businesses": "Businesses",
      "nav.messages": "Messages",
      "nav.notifications": "Notifications",
      "nav.profile": "Profile",
      "capability.home": "Home",
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
      "chat.typing": "دستیار در حال تایپ است...",
      "nav.home": "خانه",
      "nav.search": "جستجو",
      "nav.marketplace": "بازار",
      "nav.realEstate": "املاک",
      "nav.businesses": "کسب‌وکارها",
      "nav.messages": "پیام‌ها",
      "nav.notifications": "اعلان‌ها",
      "nav.profile": "پروفایل",
      "capability.home": "خانه",
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
      "chat.typing": "المساعد يكتب الآن...",
      "nav.home": "الرئيسية",
      "nav.search": "بحث",
      "nav.marketplace": "السوق",
      "nav.realEstate": "العقارات",
      "nav.businesses": "الأعمال",
      "nav.messages": "الرسائل",
      "nav.notifications": "الإشعارات",
      "nav.profile": "الملف الشخصي",
      "capability.home": "الرئيسية",
      "capability.search": "بحث",
      "capability.marketplace": "السوق",
      "capability.realEstate": "العقارات",
      "capability.businesses": "الأعمال",
      "empty.conversations": "لا توجد محادثات بعد.",
      "empty.marketplace": "لم يتم العثور على إعلانات في السوق.",
      "empty.properties": "لم يتم العثور على عقارات.",
      "empty.businesses": "لم يتم العثور على أعمال.",
      "empty.notifications": "لا توجد إشعارات بعد.",
      "config.aiRequired": "لم يتم تكوين مزود الذكاء الاصطناعي.",
      "config.searchRequired": "لم يتم تكوين مزود البحث."
    }
  },
  tr: {
    translation: {
      "app.tagline": "Tek uygulama. Her ihtiyaç. Dünyanın her yerinde.",
      "chat.placeholder": "Mass Diamond'a bir şey sor...",
      "chat.heading": "Size nasıl yardımcı olabilirim?",
      "chat.typing": "Asistan yazıyor...",
      "nav.home": "Ana Sayfa",
      "nav.search": "Ara",
      "nav.marketplace": "Pazar Yeri",
      "nav.realEstate": "Emlak",
      "nav.businesses": "İşletmeler",
      "nav.messages": "Mesajlar",
      "nav.notifications": "Bildirimler",
      "nav.profile": "Profil",
      "capability.home": "Ana Sayfa",
      "capability.search": "Ara",
      "capability.marketplace": "Pazar Yeri",
      "capability.realEstate": "Emlak",
      "capability.businesses": "İşletmeler",
      "empty.conversations": "Henüz sohbet yok.",
      "empty.marketplace": "Pazar yerinde ilan bulunamadı.",
      "empty.properties": "Emlak bulunamadı.",
      "empty.businesses": "İşletme bulunamadı.",
      "empty.notifications": "Henüz bildirim yok.",
      "config.aiRequired": "Yapay zeka sağlayıcısı yapılandırılmamış.",
      "config.searchRequired": "Arama sağlayıcısı yapılandırılmamış."
    }
  },
  fr: {
    translation: {
      "app.tagline": "Une application. Tous les besoins. Partout dans le monde.",
      "chat.placeholder": "Demandez n'importe quoi à Mass Diamond...",
      "chat.heading": "Comment puis-je vous aider ?",
      "chat.typing": "L'assistant écrit...",
      "nav.home": "Accueil",
      "nav.search": "Recherche",
      "nav.marketplace": "Marché",
      "nav.realEstate": "Immobilier",
      "nav.businesses": "Entreprises",
      "nav.messages": "Messages",
      "nav.notifications": "Notifications",
      "nav.profile": "Profil",
      "capability.home": "Accueil",
      "capability.search": "Recherche",
      "capability.marketplace": "Marché",
      "capability.realEstate": "Immobilier",
      "capability.businesses": "Entreprises",
      "empty.conversations": "Pas encore de conversations.",
      "empty.marketplace": "Aucune annonce trouvée sur le marché.",
      "empty.properties": "Aucun bien immobilier trouvé.",
      "empty.businesses": "Aucune entreprise trouvée.",
      "empty.notifications": "Pas encore de notifications.",
      "config.aiRequired": "Le fournisseur d'IA n'est pas configuré.",
      "config.searchRequired": "Le fournisseur de recherche n'est pas configuré."
    }
  },
  de: {
    translation: {
      "app.tagline": "Eine App. Jeder Bedarf. Überall auf der Welt.",
      "chat.placeholder": "Frag Mass Diamond irgendetwas...",
      "chat.heading": "Wie kann ich dir helfen?",
      "chat.typing": "Assistent tippt...",
      "nav.home": "Startseite",
      "nav.search": "Suche",
      "nav.marketplace": "Marktplatz",
      "nav.realEstate": "Immobilien",
      "nav.businesses": "Unternehmen",
      "nav.messages": "Nachrichten",
      "nav.notifications": "Benachrichtigungen",
      "nav.profile": "Profil",
      "capability.home": "Startseite",
      "capability.search": "Suche",
      "capability.marketplace": "Marktplatz",
      "capability.realEstate": "Immobilien",
      "capability.businesses": "Unternehmen",
      "empty.conversations": "Noch keine Unterhaltungen.",
      "empty.marketplace": "Keine Marktplatzanzeigen gefunden.",
      "empty.properties": "Keine Immobilien gefunden.",
      "empty.businesses": "Keine Unternehmen gefunden.",
      "empty.notifications": "Noch keine Benachrichtigungen.",
      "config.aiRequired": "KI-Anbieter ist nicht konfiguriert.",
      "config.searchRequired": "Such-Anbieter ist nicht konfiguriert."
    }
  },
  es: {
    translation: {
      "app.tagline": "Una app. Cada necesidad. En cualquier parte del mundo.",
      "chat.placeholder": "Pregúntale lo que sea a Mass Diamond...",
      "chat.heading": "¿Cómo puedo ayudarte?",
      "chat.typing": "El asistente está escribiendo...",
      "nav.home": "Inicio",
      "nav.search": "Buscar",
      "nav.marketplace": "Mercado",
      "nav.realEstate": "Bienes Raíces",
      "nav.businesses": "Negocios",
      "nav.messages": "Mensajes",
      "nav.notifications": "Notificaciones",
      "nav.profile": "Perfil",
      "capability.home": "Inicio",
      "capability.search": "Buscar",
      "capability.marketplace": "Mercado",
      "capability.realEstate": "Bienes Raíces",
      "capability.businesses": "Negocios",
      "empty.conversations": "Aún no hay conversaciones.",
      "empty.marketplace": "No se encontraron anuncios en el mercado.",
      "empty.properties": "No se encontraron propiedades.",
      "empty.businesses": "No se encontraron negocios.",
      "empty.notifications": "Aún no hay notificaciones.",
      "config.aiRequired": "El proveedor de IA no está configurado.",
      "config.searchRequired": "El proveedor de búsqueda no está configurado."
    }
  },
  nl: {
    translation: {
      "app.tagline": "Eén app. Elke behoefte. Overal ter wereld.",
      "chat.placeholder": "Vraag Mass Diamond iets...",
      "chat.heading": "Hoe kan ik je helpen?",
      "chat.typing": "Assistent is aan het typen...",
      "nav.home": "Start",
      "nav.search": "Zoeken",
      "nav.marketplace": "Marktplaats",
      "nav.realEstate": "Vastgoed",
      "nav.businesses": "Bedrijven",
      "nav.messages": "Berichten",
      "nav.notifications": "Meldingen",
      "nav.profile": "Profiel",
      "capability.home": "Start",
      "capability.search": "Zoeken",
      "capability.marketplace": "Marktplaats",
      "capability.realEstate": "Vastgoed",
      "capability.businesses": "Bedrijven",
      "empty.conversations": "Nog geen gesprekken.",
      "empty.marketplace": "Geen advertenties gevonden.",
      "empty.properties": "Geen woningen gevonden.",
      "empty.businesses": "Geen bedrijven gevonden.",
      "empty.notifications": "Nog geen meldingen.",
      "config.aiRequired": "AI-provider is niet geconfigureerd.",
      "config.searchRequired": "Zoekprovider is niet geconfigureerd."
    }
  },
  ru: {
    translation: {
      "app.tagline": "Одно приложение. Все потребности. В любой точке мира.",
      "chat.placeholder": "Спросите Mass Diamond о чём угодно...",
      "chat.heading": "Чем я могу помочь?",
      "chat.typing": "Ассистент печатает...",
      "nav.home": "Главная",
      "nav.search": "Поиск",
      "nav.marketplace": "Маркетплейс",
      "nav.realEstate": "Недвижимость",
      "nav.businesses": "Бизнес",
      "nav.messages": "Сообщения",
      "nav.notifications": "Уведомления",
      "nav.profile": "Профиль",
      "capability.home": "Главная",
      "capability.search": "Поиск",
      "capability.marketplace": "Маркетплейс",
      "capability.realEstate": "Недвижимость",
      "capability.businesses": "Бизнес",
      "empty.conversations": "Пока нет разговоров.",
      "empty.marketplace": "Объявления не найдены.",
      "empty.properties": "Объекты недвижимости не найдены.",
      "empty.businesses": "Компании не найдены.",
      "empty.notifications": "Пока нет уведомлений.",
      "config.aiRequired": "Поставщик ИИ не настроен.",
      "config.searchRequired": "Поставщик поиска не настроен."
    }
  },
  ko: {
    translation: {
      "app.tagline": "하나의 앱. 모든 요구. 전 세계 어디서나.",
      "chat.placeholder": "Mass Diamond에게 무엇이든 물어보세요...",
      "chat.heading": "무엇을 도와드릴까요?",
      "chat.typing": "어시스턴트가 입력 중입니다...",
      "nav.home": "홈",
      "nav.search": "검색",
      "nav.marketplace": "마켓플레이스",
      "nav.realEstate": "부동산",
      "nav.businesses": "비즈니스",
      "nav.messages": "메시지",
      "nav.notifications": "알림",
      "nav.profile": "프로필",
      "capability.home": "홈",
      "capability.search": "검색",
      "capability.marketplace": "마켓플레이스",
      "capability.realEstate": "부동산",
      "capability.businesses": "비즈니스",
      "empty.conversations": "아직 대화가 없습니다.",
      "empty.marketplace": "마켓플레이스에 등록된 상품이 없습니다.",
      "empty.properties": "등록된 매물이 없습니다.",
      "empty.businesses": "등록된 비즈니스가 없습니다.",
      "empty.notifications": "아직 알림이 없습니다.",
      "config.aiRequired": "AI 제공자가 설정되지 않았습니다.",
      "config.searchRequired": "검색 제공자가 설정되지 않았습니다."
    }
  },
  ja: {
    translation: {
      "app.tagline": "1つのアプリ。あらゆるニーズに。世界中どこでも。",
      "chat.placeholder": "Mass Diamondに何でも聞いてください...",
      "chat.heading": "どのようにお手伝いしましょうか？",
      "chat.typing": "アシスタントが入力中...",
      "nav.home": "ホーム",
      "nav.search": "検索",
      "nav.marketplace": "マーケットプレイス",
      "nav.realEstate": "不動産",
      "nav.businesses": "ビジネス",
      "nav.messages": "メッセージ",
      "nav.notifications": "通知",
      "nav.profile": "プロフィール",
      "capability.home": "ホーム",
      "capability.search": "検索",
      "capability.marketplace": "マーケットプレイス",
      "capability.realEstate": "不動産",
      "capability.businesses": "ビジネス",
      "empty.conversations": "まだ会話がありません。",
      "empty.marketplace": "マーケットプレイスに出品がありません。",
      "empty.properties": "物件が見つかりません。",
      "empty.businesses": "ビジネスが見つかりません。",
      "empty.notifications": "まだ通知がありません。",
      "config.aiRequired": "AIプロバイダーが設定されていません。",
      "config.searchRequired": "検索プロバイダーが設定されていません。"
    }
  },
  hi: {
    translation: {
      "app.tagline": "एक ऐप। हर ज़रूरत। दुनिया में कहीं भी।",
      "chat.placeholder": "Mass Diamond से कुछ भी पूछें...",
      "chat.heading": "मैं आपकी कैसे मदद कर सकता हूँ?",
      "chat.typing": "सहायक टाइप कर रहा है...",
      "nav.home": "होम",
      "nav.search": "खोजें",
      "nav.marketplace": "मार्केटप्लेस",
      "nav.realEstate": "रियल एस्टेट",
      "nav.businesses": "व्यवसाय",
      "nav.messages": "संदेश",
      "nav.notifications": "सूचनाएं",
      "nav.profile": "प्रोफ़ाइल",
      "capability.home": "होम",
      "capability.search": "खोजें",
      "capability.marketplace": "मार्केटप्लेस",
      "capability.realEstate": "रियल एस्टेट",
      "capability.businesses": "व्यवसाय",
      "empty.conversations": "अभी तक कोई बातचीत नहीं।",
      "empty.marketplace": "मार्केटप्लेस में कोई लिस्टिंग नहीं मिली।",
      "empty.properties": "कोई संपत्ति नहीं मिली।",
      "empty.businesses": "कोई व्यवसाय नहीं मिला।",
      "empty.notifications": "अभी तक कोई सूचना नहीं।",
      "config.aiRequired": "AI प्रदाता कॉन्फ़िगर नहीं किया गया है।",
      "config.searchRequired": "खोज प्रदाता कॉन्फ़िगर नहीं किया गया है।"
    }
  }
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

// Detects the language of a single piece of text (e.g. one chat message),
// so direction/alignment can be decided per-message rather than globally.
export function detectMessageLanguage(text: string): string {
  const persianArabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  if (persianArabicPattern.test(text)) {
    return "fa";
  }
  return navigator.language.split("-")[0];
}

export default i18n;
