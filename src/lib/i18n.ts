import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Supported languages.
// fa/ar are RTL. All other supported languages are LTR.
export const SUPPORTED_LANGUAGES = [
  "en",
  "fa",
  "ar",
  "tr",
  "fr",
  "de",
  "es",
  "nl",
  "ru",
  "zh",
  "ko",
  "ja",
  "hi"
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ["fa", "ar"];

export function isRtl(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Detect the language of an individual message.
 *
 * Important:
 * - Local only
 * - No API call
 * - Fast
 * - TypeScript-safe
 * - Works per message
 * - Used later by ChatMessage for RTL/LTR
 *
 * Script-based languages such as Persian, Arabic, Russian,
 * Chinese, Japanese, Korean and Hindi can be detected reliably
 * from Unicode ranges.
 *
 * Latin-script languages use lightweight lexical signals.
 * If there is not enough evidence, the browser language is used
 * only when it is one of the supported languages. Otherwise English
 * is used as the final fallback.
 */
export function detectMessageLanguage(
  text: string
): SupportedLanguage {
  const normalized = text.trim();

  if (!normalized) {
    return "en";
  }

  // ------------------------------------------------------------
  // Persian
  // ------------------------------------------------------------

  // Persian-specific characters that are uncommon in standard Arabic.
  if (/[\u067E\u0686\u0698\u06AF]/.test(normalized)) {
    return "fa";
  }

  // Additional Persian orthographic characters.
  if (/[\u06CC\u06A9\u06C0\u06C1]/.test(normalized)) {
    return "fa";
  }

  // ------------------------------------------------------------
  // Arabic
  // ------------------------------------------------------------

  if (/[\u0600-\u06FF\u0750-\u077F]/.test(normalized)) {
    return "ar";
  }

  // ------------------------------------------------------------
  // Korean
  // ------------------------------------------------------------

  if (
    /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]/.test(
      normalized
    )
  ) {
    return "ko";
  }

  // ------------------------------------------------------------
  // Japanese
  // ------------------------------------------------------------

  // Hiragana or Katakana is a strong Japanese signal.
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(normalized)) {
    return "ja";
  }

  // ------------------------------------------------------------
  // Chinese
  // ------------------------------------------------------------

  // Han characters without Japanese kana are treated as Chinese.
  if (/[\u3400-\u4DBF\u4E00-\u9FFF]/.test(normalized)) {
    return "zh";
  }

  // ------------------------------------------------------------
  // Hindi / Devanagari
  // ------------------------------------------------------------

  if (/[\u0900-\u097F]/.test(normalized)) {
    return "hi";
  }

  // ------------------------------------------------------------
  // Russian / Cyrillic
  // ------------------------------------------------------------

  if (/[\u0400-\u04FF]/.test(normalized)) {
    return "ru";
  }

  // ------------------------------------------------------------
  // Latin-script language detection
  // ------------------------------------------------------------

  const lower = normalized.toLocaleLowerCase();

  const scores: Record<SupportedLanguage, number> = {
    en: 0,
    fa: 0,
    ar: 0,
    tr: 0,
    fr: 0,
    de: 0,
    es: 0,
    nl: 0,
    ru: 0,
    zh: 0,
    ko: 0,
    ja: 0,
    hi: 0
  };

  const languagePatterns: Record<
    "en" | "tr" | "fr" | "de" | "es" | "nl",
    RegExp[]
  > = {
    en: [
      /\bthe\b/,
      /\band\b/,
      /\bis\b/,
      /\bare\b/,
      /\bthis\b/,
      /\bthat\b/,
      /\bwhat\b/,
      /\bhow\b/,
      /\bwhere\b/,
      /\bwhen\b/,
      /\bwhy\b/,
      /\bcan\b/,
      /\bcould\b/,
      /\bplease\b/,
      /\bwith\b/,
      /\bfrom\b/,
      /\bfor\b/,
      /\byou\b/,
      /\byour\b/
    ],

    tr: [
      /\bve\b/,
      /\bbir\b/,
      /\bbu\b/,
      /\bben\b/,
      /\bsen\b/,
      /\bbiz\b/,
      /\bsiz\b/,
      /\bnasıl\b/,
      /\bne\b/,
      /\bnerede\b/,
      /\bnereden\b/,
      /\bneden\b/,
      /\bile\b/,
      /\biçin\b/,
      /\bdeğil\b/,
      /\bvar\b/,
      /\byok\b/,
      /\bteşekkür\b/,
      /\bmerhaba\b/
    ],

    fr: [
      /\bje\b/,
      /\bj'ai\b/,
      /\bj’ai\b/,
      /\btu\b/,
      /\bvous\b/,
      /\bnous\b/,
      /\ble\b/,
      /\bles\b/,
      /\bun\b/,
      /\bune\b/,
      /\bet\b/,
      /\best\b/,
      /\bavec\b/,
      /\bpour\b/,
      /\bcomment\b/,
      /\bquoi\b/,
      /\bqui\b/,
      /\bmerci\b/,
      /\bbonjour\b/
    ],

    de: [
      /\bder\b/,
      /\bdie\b/,
      /\bdas\b/,
      /\bein\b/,
      /\beine\b/,
      /\beiner\b/,
      /\bund\b/,
      /\bist\b/,
      /\bnicht\b/,
      /\bmit\b/,
      /\bfür\b/,
      /\bwie\b/,
      /\bwas\b/,
      /\bwer\b/,
      /\bich\b/,
      /\bdu\b/,
      /\bdanke\b/,
      /\bhallo\b/,
      /\bbitte\b/
    ],

    es: [
      /\bel\b/,
      /\bla\b/,
      /\blos\b/,
      /\blas\b/,
      /\bun\b/,
      /\buna\b/,
      /\bunos\b/,
      /\bunas\b/,
      /\by\b/,
      /\bes\b/,
      /\bson\b/,
      /\bcon\b/,
      /\bpara\b/,
      /\bcómo\b/,
      /\bqué\b/,
      /\bqué\b/,
      /\bquién\b/,
      /\bgracias\b/,
      /\bhola\b/
    ],

    nl: [
      /\bde\b/,
      /\bhet\b/,
      /\been\b/,
      /\ben\b/,
      /\bis\b/,
      /\bmet\b/,
      /\bvoor\b/,
      /\bvan\b/,
      /\bhoe\b/,
      /\bwat\b/,
      /\bwaar\b/,
      /\bwie\b/,
      /\bniet\b/,
      /\bdank\b/,
      /\bbedankt\b/,
      /\bhallo\b/
    ]
  };

  for (const language of Object.keys(languagePatterns) as Array<
    keyof typeof languagePatterns
  >) {
    for (const pattern of languagePatterns[language]) {
      if (pattern.test(lower)) {
        scores[language] += 1;
      }
    }
  }

  // Strong language-specific signals.

  // Spanish punctuation.
  if (/[¿¡]/.test(normalized)) {
    scores.es += 4;
  }

  // French contractions and vocabulary.
  if (
    /\b(je|j'ai|j’ai|vous|nous|avec|pour|comment|bonjour|merci)\b/i.test(
      normalized
    )
  ) {
    scores.fr += 3;
  }

  // German vocabulary and umlaut/ß.
  if (
    /[äöüßÄÖÜẞ]/.test(normalized) ||
    /\b(ich|nicht|danke|hallo|bitte|für)\b/i.test(normalized)
  ) {
    scores.de += 3;
  }

  // Turkish-specific characters and vocabulary.
  if (
    /[çğıİöşüÇĞIÖŞÜ]/.test(normalized) ||
    /\b(ben|sen|merhaba|teşekkür|teşekkürler|nasıl)\b/i.test(normalized)
  ) {
    scores.tr += 4;
  }

  // Dutch-specific signals.
  if (
    /\b(het|een|voor|van|waar|niet|bedankt)\b/i.test(normalized)
  ) {
    scores.nl += 3;
  }

  // English-specific signals.
  if (
    /\b(the|this|that|you|your|what|how|where|please|could|would)\b/i.test(
      normalized
    )
  ) {
    scores.en += 3;
  }

  // Spanish-specific signals.
  if (
    /\b(para|cómo|qué|quién|gracias|hola|con|una|unos|unas)\b/i.test(
      normalized
    )
  ) {
    scores.es += 3;
  }

  // ------------------------------------------------------------
  // Find the strongest language
  // ------------------------------------------------------------

  let bestLanguage: SupportedLanguage = "en";
  let bestScore = 0;

  for (const language of SUPPORTED_LANGUAGES) {
    if (scores[language] > bestScore) {
      bestLanguage = language;
      bestScore = scores[language];
    }
  }

  // ------------------------------------------------------------
  // Fallback
  // ------------------------------------------------------------

  if (bestScore === 0) {
    const browserLanguage =
      typeof navigator !== "undefined"
        ? navigator.language.split("-")[0].toLowerCase()
        : "en";

    if (
      SUPPORTED_LANGUAGES.includes(
        browserLanguage as SupportedLanguage
      )
    ) {
      return browserLanguage as SupportedLanguage;
    }

    return "en";
  }

  return bestLanguage;
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

  zh: {
    translation: {
      "app.tagline": "一个应用，满足所有需求，世界各地随时可用。",
      "chat.placeholder": "向 Mass Diamond 提问任何问题...",
      "chat.heading": "我可以怎样帮助您？",
      "nav.home": "首页",
      "nav.search": "搜索",
      "nav.marketplace": "市场",
      "nav.realEstate": "房地产",
      "nav.businesses": "商家",
      "nav.messages": "消息",
      "nav.notifications": "通知",
      "nav.profile": "个人资料",
      "capability.home": "首页",
      "capability.search": "搜索",
      "capability.marketplace": "市场",
      "capability.realEstate": "房地产",
      "capability.businesses": "商家",
      "empty.conversations": "暂无对话。",
      "empty.marketplace": "未找到市场商品。",
      "empty.properties": "未找到房产。",
      "empty.businesses": "未找到商家。",
      "empty.notifications": "暂无通知。",
      "config.aiRequired": "AI 服务尚未配置。",
      "config.searchRequired": "搜索服务尚未配置。"
    }
  },

  ko: {
    translation: {
      "app.tagline": "하나의 앱. 모든 요구. 전 세계 어디서나.",
      "chat.placeholder": "Mass Diamond에게 무엇이든 물어보세요...",
      "chat.heading": "무엇을 도와드릴까요?",
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
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
