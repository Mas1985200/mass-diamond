import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Supported languages per Mass Diamond specification.
// Persian and Arabic are RTL; all other supported languages are LTR.
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
  "ko",
  "ja",
  "hi",
] as const;

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
      "chat.error": "Failed to send.",
      "chat.retry": "Retry",

      // ChatInput — attachments
      "chat.attach": "Attach",
      "chat.attachPhoto": "Photo",
      "chat.attachVideo": "Video",
      "chat.attachFile": "File",
      "chat.attachAudio": "Audio",
      "chat.attachmentOptions": "Attachment options",
      "chat.selectedAttachments": "Selected attachments",

      // ChatInput — voice input
      "chat.voiceStart": "Start voice input",
      "chat.voiceStop": "Stop voice input",
      "chat.voiceListening": "Listening…",
      "chat.voiceError": "Voice input error. Tap to try again.",
      "chat.voiceTryAgain": "Voice input is unavailable. Try again.",
      "chat.voiceUnsupported":
        "Voice input is not supported in this browser",

      // ChatInput — send
      "chat.send": "Send",

      // Navigation
      "nav.home": "Home",
      "nav.search": "Search",
      "nav.marketplace": "Marketplace",
      "nav.realEstate": "Real Estate",
      "nav.businesses": "Businesses",
      "nav.messages": "Messages",
      "nav.notifications": "Notifications",
      "nav.profile": "Profile",

      // Capabilities
      "capability.home": "Home",
      "capability.search": "Search",
      "capability.marketplace": "Marketplace",
      "capability.realEstate": "Real Estate",
      "capability.businesses": "Businesses",

      // Empty states
      "empty.conversations": "No conversations yet.",
      "empty.marketplace": "No marketplace listings found.",
      "empty.properties": "No properties found.",
      "empty.businesses": "No businesses found.",
      "empty.notifications": "No notifications yet.",

      // Configuration
      "config.aiRequired": "AI provider is not configured.",
      "config.searchRequired": "Search provider is not configured.",
    },
  },

  fa: {
    translation: {
      "app.tagline": "یک اپلیکیشن. همه نیازها. در هر نقطه از جهان.",
      "chat.placeholder": "هر چیزی از Mass Diamond بپرس...",
      "chat.heading": "چطور می‌توانم کمکتان کنم؟",
      "chat.typing": "دستیار در حال تایپ است...",
      "chat.error": "ارسال ناموفق بود.",
      "chat.retry": "تلاش دوباره",

      // ChatInput — attachments
      "chat.attach": "پیوست",
      "chat.attachPhoto": "عکس",
      "chat.attachVideo": "ویدیو",
      "chat.attachFile": "فایل",
      "chat.attachAudio": "صدا",
      "chat.attachmentOptions": "گزینه‌های پیوست",
      "chat.selectedAttachments": "پیوست‌های انتخاب‌شده",

      // ChatInput — voice input
      "chat.voiceStart": "شروع ورودی صوتی",
      "chat.voiceStop": "توقف ورودی صوتی",
      "chat.voiceListening": "در حال شنیدن…",
      "chat.voiceError": "خطا در ورودی صوتی. دوباره امتحان کنید.",
      "chat.voiceTryAgain":
        "ورودی صوتی در دسترس نیست. دوباره امتحان کنید.",
      "chat.voiceUnsupported":
        "ورودی صوتی در این مرورگر پشتیبانی نمی‌شود",

      // ChatInput — send
      "chat.send": "ارسال",

      // Navigation
      "nav.home": "خانه",
      "nav.search": "جستجو",
      "nav.marketplace": "بازار",
      "nav.realEstate": "املاک",
      "nav.businesses": "کسب‌وکارها",
      "nav.messages": "پیام‌ها",
      "nav.notifications": "اعلان‌ها",
      "nav.profile": "پروفایل",

      // Capabilities
      "capability.home": "خانه",
      "capability.search": "جستجو",
      "capability.marketplace": "بازار",
      "capability.realEstate": "املاک",
      "capability.businesses": "کسب‌وکارها",

      // Empty states
      "empty.conversations": "هنوز گفتگویی وجود ندارد.",
      "empty.marketplace": "آگهی‌ای در بازار یافت نشد.",
      "empty.properties": "ملکی یافت نشد.",
      "empty.businesses": "کسب‌وکاری یافت نشد.",
      "empty.notifications": "هنوز اعلانی وجود ندارد.",

      // Configuration
      "config.aiRequired": "سرویس هوش مصنوعی پیکربندی نشده است.",
      "config.searchRequired": "سرویس جستجو پیکربندی نشده است.",
    },
  },

  ar: {
    translation: {
      "app.tagline": "تطبيق واحد. كل الاحتياجات. في أي مكان في العالم.",
      "chat.placeholder": "اسأل Mass Diamond أي شيء...",
      "chat.heading": "كيف يمكنني مساعدتك؟",
      "chat.typing": "المساعد يكتب الآن...",
      "chat.error": "فشل الإرسال.",
      "chat.retry": "إعادة المحاولة",

      // ChatInput — attachments
      "chat.attach": "إرفاق",
      "chat.attachPhoto": "صورة",
      "chat.attachVideo": "فيديو",
      "chat.attachFile": "ملف",
      "chat.attachAudio": "صوت",
      "chat.attachmentOptions": "خيارات المرفقات",
      "chat.selectedAttachments": "المرفقات المحددة",

      // ChatInput — voice input
      "chat.voiceStart": "بدء الإدخال الصوتي",
      "chat.voiceStop": "إيقاف الإدخال الصوتي",
      "chat.voiceListening": "جارٍ الاستماع…",
      "chat.voiceError": "خطأ في الإدخال الصوتي. حاول مرة أخرى.",
      "chat.voiceTryAgain":
        "الإدخال الصوتي غير متاح. حاول مرة أخرى.",
      "chat.voiceUnsupported":
        "الإدخال الصوتي غير مدعوم في هذا المتصفح",

      // ChatInput — send
      "chat.send": "إرسال",

      // Navigation
      "nav.home": "الرئيسية",
      "nav.search": "بحث",
      "nav.marketplace": "السوق",
      "nav.realEstate": "العقارات",
      "nav.businesses": "الأعمال",
      "nav.messages": "الرسائل",
      "nav.notifications": "الإشعارات",
      "nav.profile": "الملف الشخصي",

      // Capabilities
      "capability.home": "الرئيسية",
      "capability.search": "بحث",
      "capability.marketplace": "السوق",
      "capability.realEstate": "العقارات",
      "capability.businesses": "الأعمال",

      // Empty states
      "empty.conversations": "لا توجد محادثات بعد.",
      "empty.marketplace": "لم يتم العثور على إعلانات في السوق.",
      "empty.properties": "لم يتم العثور على عقارات.",
      "empty.businesses": "لم يتم العثور على أعمال.",
      "empty.notifications": "لا توجد إشعارات بعد.",

      // Configuration
      "config.aiRequired":
        "لم يتم تكوين مزود الذكاء الاصطناعي.",
      "config.searchRequired":
        "لم يتم تكوين مزود البحث.",
    },
  },

  tr: {
    translation: {
      "app.tagline": "Tek uygulama. Her ihtiyaç. Dünyanın her yerinde.",
      "chat.placeholder": "Mass Diamond'a bir şey sor...",
      "chat.heading": "Size nasıl yardımcı olabilirim?",
      "chat.typing": "Asistan yazıyor...",
      "chat.error": "Gönderilemedi.",
      "chat.retry": "Tekrar dene",

      // ChatInput — attachments
      "chat.attach": "Ekle",
      "chat.attachPhoto": "Fotoğraf",
      "chat.attachVideo": "Video",
      "chat.attachFile": "Dosya",
      "chat.attachAudio": "Ses",
      "chat.attachmentOptions": "Ek seçenekleri",
      "chat.selectedAttachments": "Seçilen ekler",

      // ChatInput — voice input
      "chat.voiceStart": "Sesli girişi başlat",
      "chat.voiceStop": "Sesli girişi durdur",
      "chat.voiceListening": "Dinleniyor…",
      "chat.voiceError": "Sesli giriş hatası. Tekrar deneyin.",
      "chat.voiceTryAgain":
        "Sesli giriş kullanılamıyor. Tekrar deneyin.",
      "chat.voiceUnsupported":
        "Bu tarayıcıda sesli giriş desteklenmiyor",

      // ChatInput — send
      "chat.send": "Gönder",

      // Navigation
      "nav.home": "Ana Sayfa",
      "nav.search": "Ara",
      "nav.marketplace": "Pazar Yeri",
      "nav.realEstate": "Emlak",
      "nav.businesses": "İşletmeler",
      "nav.messages": "Mesajlar",
      "nav.notifications": "Bildirimler",
      "nav.profile": "Profil",

      // Capabilities
      "capability.home": "Ana Sayfa",
      "capability.search": "Ara",
      "capability.marketplace": "Pazar Yeri",
      "capability.realEstate": "Emlak",
      "capability.businesses": "İşletmeler",

      // Empty states
      "empty.conversations": "Henüz sohbet yok.",
      "empty.marketplace": "Pazar yerinde ilan bulunamadı.",
      "empty.properties": "Emlak bulunamadı.",
      "empty.businesses": "İşletme bulunamadı.",
      "empty.notifications": "Henüz bildirim yok.",

      // Configuration
      "config.aiRequired":
        "Yapay zeka sağlayıcısı yapılandırılmamış.",
      "config.searchRequired":
        "Arama sağlayıcısı yapılandırılmamış.",
    },
  },

  fr: {
    translation: {
      "app.tagline":
        "Une application. Tous les besoins. Partout dans le monde.",
      "chat.placeholder":
        "Demandez n'importe quoi à Mass Diamond...",
      "chat.heading": "Comment puis-je vous aider ?",
      "chat.typing": "L'assistant écrit...",
      "chat.error": "Échec de l'envoi.",
      "chat.retry": "Réessayer",

      // ChatInput — attachments
      "chat.attach": "Joindre",
      "chat.attachPhoto": "Photo",
      "chat.attachVideo": "Vidéo",
      "chat.attachFile": "Fichier",
      "chat.attachAudio": "Audio",
      "chat.attachmentOptions": "Options de pièce jointe",
      "chat.selectedAttachments":
        "Pièces jointes sélectionnées",

      // ChatInput — voice input
      "chat.voiceStart": "Démarrer la saisie vocale",
      "chat.voiceStop": "Arrêter la saisie vocale",
      "chat.voiceListening": "Écoute en cours…",
      "chat.voiceError":
        "Erreur de saisie vocale. Réessayez.",
      "chat.voiceTryAgain":
        "Saisie vocale indisponible. Réessayez.",
      "chat.voiceUnsupported":
        "La saisie vocale n'est pas prise en charge dans ce navigateur",

      // ChatInput — send
      "chat.send": "Envoyer",

      // Navigation
      "nav.home": "Accueil",
      "nav.search": "Recherche",
      "nav.marketplace": "Marché",
      "nav.realEstate": "Immobilier",
      "nav.businesses": "Entreprises",
      "nav.messages": "Messages",
      "nav.notifications": "Notifications",
      "nav.profile": "Profil",

      // Capabilities
      "capability.home": "Accueil",
      "capability.search": "Recherche",
      "capability.marketplace": "Marché",
      "capability.realEstate": "Immobilier",
      "capability.businesses": "Entreprises",

      // Empty states
      "empty.conversations": "Pas encore de conversations.",
      "empty.marketplace":
        "Aucune annonce trouvée sur le marché.",
      "empty.properties": "Aucun bien immobilier trouvé.",
      "empty.businesses": "Aucune entreprise trouvée.",
      "empty.notifications": "Pas encore de notifications.",

      // Configuration
      "config.aiRequired":
        "Le fournisseur d'IA n'est pas configuré.",
      "config.searchRequired":
        "Le fournisseur de recherche n'est pas configuré.",
    },
  },

  de: {
    translation: {
      "app.tagline":
        "Eine App. Jeder Bedarf. Überall auf der Welt.",
      "chat.placeholder":
        "Frag Mass Diamond irgendetwas...",
      "chat.heading": "Wie kann ich dir helfen?",
      "chat.typing": "Assistent tippt...",
      "chat.error": "Senden fehlgeschlagen.",
      "chat.retry": "Erneut versuchen",

      // ChatInput — attachments
      "chat.attach": "Anhängen",
      "chat.attachPhoto": "Foto",
      "chat.attachVideo": "Video",
      "chat.attachFile": "Datei",
      "chat.attachAudio": "Audio",
      "chat.attachmentOptions": "Anhangoptionen",
      "chat.selectedAttachments": "Ausgewählte Anhänge",

      // ChatInput — voice input
      "chat.voiceStart": "Spracheingabe starten",
      "chat.voiceStop": "Spracheingabe stoppen",
      "chat.voiceListening": "Hört zu…",
      "chat.voiceError":
        "Fehler bei der Spracheingabe. Erneut versuchen.",
      "chat.voiceTryAgain":
        "Spracheingabe nicht verfügbar. Erneut versuchen.",
      "chat.voiceUnsupported":
        "Spracheingabe wird in diesem Browser nicht unterstützt",

      // ChatInput — send
      "chat.send": "Senden",

      // Navigation
      "nav.home": "Startseite",
      "nav.search": "Suche",
      "nav.marketplace": "Marktplatz",
      "nav.realEstate": "Immobilien",
      "nav.businesses": "Unternehmen",
      "nav.messages": "Nachrichten",
      "nav.notifications": "Benachrichtigungen",
      "nav.profile": "Profil",

      // Capabilities
      "capability.home": "Startseite",
      "capability.search": "Suche",
      "capability.marketplace": "Marktplatz",
      "capability.realEstate": "Immobilien",
      "capability.businesses": "Unternehmen",

      // Empty states
      "empty.conversations": "Noch keine Unterhaltungen.",
      "empty.marketplace":
        "Keine Marktplatzanzeigen gefunden.",
      "empty.properties": "Keine Immobilien gefunden.",
      "empty.businesses": "Keine Unternehmen gefunden.",
      "empty.notifications": "Noch keine Benachrichtigungen.",

      // Configuration
      "config.aiRequired":
        "KI-Anbieter ist nicht konfiguriert.",
      "config.searchRequired":
        "Such-Anbieter ist nicht konfiguriert.",
    },
  },

  es: {
    translation: {
      "app.tagline":
        "Una app. Cada necesidad. En cualquier parte del mundo.",
      "chat.placeholder":
        "Pregúntale lo que sea a Mass Diamond...",
      "chat.heading": "¿Cómo puedo ayudarte?",
      "chat.typing": "El asistente está escribiendo...",
      "chat.error": "Error al enviar.",
      "chat.retry": "Reintentar",

      // ChatInput — attachments
      "chat.attach": "Adjuntar",
      "chat.attachPhoto": "Foto",
      "chat.attachVideo": "Video",
      "chat.attachFile": "Archivo",
      "chat.attachAudio": "Audio",
      "chat.attachmentOptions": "Opciones de adjunto",
      "chat.selectedAttachments": "Adjuntos seleccionados",

      // ChatInput — voice input
      "chat.voiceStart": "Iniciar entrada de voz",
      "chat.voiceStop": "Detener entrada de voz",
      "chat.voiceListening": "Escuchando…",
      "chat.voiceError":
        "Error de entrada de voz. Inténtalo de nuevo.",
      "chat.voiceTryAgain":
        "Entrada de voz no disponible. Inténtalo de nuevo.",
      "chat.voiceUnsupported":
        "La entrada de voz no es compatible con este navegador",

      // ChatInput — send
      "chat.send": "Enviar",

      // Navigation
      "nav.home": "Inicio",
      "nav.search": "Buscar",
      "nav.marketplace": "Mercado",
      "nav.realEstate": "Bienes Raíces",
      "nav.businesses": "Negocios",
      "nav.messages": "Mensajes",
      "nav.notifications": "Notificaciones",
      "nav.profile": "Perfil",

      // Capabilities
      "capability.home": "Inicio",
      "capability.search": "Buscar",
      "capability.marketplace": "Mercado",
      "capability.realEstate": "Bienes Raíces",
      "capability.businesses": "Negocios",

      // Empty states
      "empty.conversations": "Aún no hay conversaciones.",
      "empty.marketplace":
        "No se encontraron anuncios en el mercado.",
      "empty.properties": "No se encontraron propiedades.",
      "empty.businesses": "No se encontraron negocios.",
      "empty.notifications": "Aún no hay notificaciones.",

      // Configuration
      "config.aiRequired":
        "El proveedor de IA no está configurado.",
      "config.searchRequired":
        "El proveedor de búsqueda no está configurado.",
    },
  },

  nl: {
    translation: {
      "app.tagline":
        "Eén app. Elke behoefte. Overal ter wereld.",
      "chat.placeholder": "Vraag Mass Diamond iets...",
      "chat.heading": "Hoe kan ik je helpen?",
      "chat.typing": "Assistent is aan het typen...",
      "chat.error": "Versturen mislukt.",
      "chat.retry": "Opnieuw proberen",

      // ChatInput — attachments
      "chat.attach": "Bijvoegen",
      "chat.attachPhoto": "Foto",
      "chat.attachVideo": "Video",
      "chat.attachFile": "Bestand",
      "chat.attachAudio": "Audio",
      "chat.attachmentOptions": "Bijlage-opties",
      "chat.selectedAttachments":
        "Geselecteerde bijlagen",

      // ChatInput — voice input
      "chat.voiceStart": "Spraakinvoer starten",
      "chat.voiceStop": "Spraakinvoer stoppen",
      "chat.voiceListening": "Luisteren…",
      "chat.voiceError":
        "Fout bij spraakinvoer. Probeer opnieuw.",
      "chat.voiceTryAgain":
        "Spraakinvoer niet beschikbaar. Probeer opnieuw.",
      "chat.voiceUnsupported":
        "Spraakinvoer wordt niet ondersteund in deze browser",

      // ChatInput — send
      "chat.send": "Verzenden",

      // Navigation
      "nav.home": "Start",
      "nav.search": "Zoeken",
      "nav.marketplace": "Marktplaats",
      "nav.realEstate": "Vastgoed",
      "nav.businesses": "Bedrijven",
      "nav.messages": "Berichten",
      "nav.notifications": "Meldingen",
      "nav.profile": "Profiel",

      // Capabilities
      "capability.home": "Start",
      "capability.search": "Zoeken",
      "capability.marketplace": "Marktplaats",
      "capability.realEstate": "Vastgoed",
      "capability.businesses": "Bedrijven",

      // Empty states
      "empty.conversations": "Nog geen gesprekken.",
      "empty.marketplace": "Geen advertenties gevonden.",
      "empty.properties": "Geen woningen gevonden.",
      "empty.businesses": "Geen bedrijven gevonden.",
      "empty.notifications": "Nog geen meldingen.",

      // Configuration
      "config.aiRequired":
        "AI-provider is niet geconfigureerd.",
      "config.searchRequired":
        "Zoekprovider is niet geconfigureerd.",
    },
  },

  ru: {
    translation: {
      "app.tagline":
        "Одно приложение. Все потребности. В любой точке мира.",
      "chat.placeholder":
        "Спросите Mass Diamond о чём угодно...",
      "chat.heading": "Чем я могу помочь?",
      "chat.typing": "Ассистент печатает...",
      "chat.error": "Не удалось отправить.",
      "chat.retry": "Повторить",

      // ChatInput — attachments
      "chat.attach": "Прикрепить",
      "chat.attachPhoto": "Фото",
      "chat.attachVideo": "Видео",
      "chat.attachFile": "Файл",
      "chat.attachAudio": "Аудио",
      "chat.attachmentOptions": "Параметры вложения",
      "chat.selectedAttachments": "Выбранные вложения",

      // ChatInput — voice input
      "chat.voiceStart": "Начать голосовой ввод",
      "chat.voiceStop": "Остановить голосовой ввод",
      "chat.voiceListening": "Слушаю…",
      "chat.voiceError":
        "Ошибка голосового ввода. Попробуйте снова.",
      "chat.voiceTryAgain":
        "Голосовой ввод недоступен. Попробуйте снова.",
      "chat.voiceUnsupported":
        "Голосовой ввод не поддерживается в этом браузере",

      // ChatInput — send
      "chat.send": "Отправить",

      // Navigation
      "nav.home": "Главная",
      "nav.search": "Поиск",
      "nav.marketplace": "Маркетплейс",
      "nav.realEstate": "Недвижимость",
      "nav.businesses": "Бизнес",
      "nav.messages": "Сообщения",
      "nav.notifications": "Уведомления",
      "nav.profile": "Профиль",

      // Capabilities
      "capability.home": "Главная",
      "capability.search": "Поиск",
      "capability.marketplace": "Маркетплейс",
      "capability.realEstate": "Недвижимость",
      "capability.businesses": "Бизнес",

      // Empty states
      "empty.conversations": "Пока нет разговоров.",
      "empty.marketplace": "Объявления не найдены.",
      "empty.properties":
        "Объекты недвижимости не найдены.",
      "empty.businesses": "Компании не найдены.",
      "empty.notifications": "Пока нет уведомлений.",

      // Configuration
      "config.aiRequired":
        "Поставщик ИИ не настроен.",
      "config.searchRequired":
        "Поставщик поиска не настроен.",
    },
  },

  ko: {
    translation: {
      "app.tagline":
        "하나의 앱. 모든 요구. 전 세계 어디서나.",
      "chat.placeholder":
        "Mass Diamond에게 무엇이든 물어보세요...",
      "chat.heading": "무엇을 도와드릴까요?",
      "chat.typing": "어시스턴트가 입력 중입니다...",
      "chat.error": "전송에 실패했습니다.",
      "chat.retry": "다시 시도",

      // ChatInput — attachments
      "chat.attach": "첨부",
      "chat.attachPhoto": "사진",
      "chat.attachVideo": "동영상",
      "chat.attachFile": "파일",
      "chat.attachAudio": "오디오",
      "chat.attachmentOptions": "첨부 옵션",
      "chat.selectedAttachments":
        "선택된 첨부 파일",

      // ChatInput — voice input
      "chat.voiceStart": "음성 입력 시작",
      "chat.voiceStop": "음성 입력 중지",
      "chat.voiceListening": "듣는 중…",
      "chat.voiceError":
        "음성 입력 오류. 다시 시도하세요.",
      "chat.voiceTryAgain":
        "음성 입력을 사용할 수 없습니다. 다시 시도하세요.",
      "chat.voiceUnsupported":
        "이 브라우저에서는 음성 입력이 지원되지 않습니다",

      // ChatInput — send
      "chat.send": "보내기",

      // Navigation
      "nav.home": "홈",
      "nav.search": "검색",
      "nav.marketplace": "마켓플레이스",
      "nav.realEstate": "부동산",
      "nav.businesses": "비즈니스",
      "nav.messages": "메시지",
      "nav.notifications": "알림",
      "nav.profile": "프로필",

      // Capabilities
      "capability.home": "홈",
      "capability.search": "검색",
      "capability.marketplace": "마켓플레이스",
      "capability.realEstate": "부동산",
      "capability.businesses": "비즈니스",

      // Empty states
      "empty.conversations": "아직 대화가 없습니다.",
      "empty.marketplace":
        "마켓플레이스에 등록된 상품이 없습니다.",
      "empty.properties": "등록된 매물이 없습니다.",
      "empty.businesses": "등록된 비즈니스가 없습니다.",
      "empty.notifications": "아직 알림이 없습니다.",

      // Configuration
      "config.aiRequired":
        "AI 제공자가 설정되지 않았습니다.",
      "config.searchRequired":
        "검색 제공자가 설정되지 않았습니다.",
    },
  },

  ja: {
    translation: {
      "app.tagline":
        "1つのアプリ。あらゆるニーズに。世界中どこでも。",
      "chat.placeholder":
        "Mass Diamondに何でも聞いてください...",
      "chat.heading":
        "どのようにお手伝いしましょうか？",
      "chat.typing": "アシスタントが入力中...",
      "chat.error": "送信に失敗しました。",
      "chat.retry": "再試行",

      // ChatInput — attachments
      "chat.attach": "添付",
      "chat.attachPhoto": "写真",
      "chat.attachVideo": "動画",
      "chat.attachFile": "ファイル",
      "chat.attachAudio": "音声",
      "chat.attachmentOptions": "添付オプション",
      "chat.selectedAttachments":
        "選択された添付ファイル",

      // ChatInput — voice input
      "chat.voiceStart": "音声入力を開始",
      "chat.voiceStop": "音声入力を停止",
      "chat.voiceListening": "聞き取り中…",
      "chat.voiceError":
        "音声入力エラー。もう一度お試しください。",
      "chat.voiceTryAgain":
        "音声入力は利用できません。もう一度お試しください。",
      "chat.voiceUnsupported":
        "このブラウザでは音声入力はサポートされていません",

      // ChatInput — send
      "chat.send": "送信",

      // Navigation
      "nav.home": "ホーム",
      "nav.search": "検索",
      "nav.marketplace": "マーケットプレイス",
      "nav.realEstate": "不動産",
      "nav.businesses": "ビジネス",
      "nav.messages": "メッセージ",
      "nav.notifications": "通知",
      "nav.profile": "プロフィール",

      // Capabilities
      "capability.home": "ホーム",
      "capability.search": "検索",
      "capability.marketplace": "マーケットプレイス",
      "capability.realEstate": "不動産",
      "capability.businesses": "ビジネス",

      // Empty states
      "empty.conversations": "まだ会話がありません。",
      "empty.marketplace":
        "マーケットプレイスに出品がありません。",
      "empty.properties": "物件が見つかりません。",
      "empty.businesses": "ビジネスが見つかりません。",
      "empty.notifications": "まだ通知がありません。",

      // Configuration
      "config.aiRequired":
        "AIプロバイダーが設定されていません。",
      "config.searchRequired":
        "検索プロバイダーが設定されていません。",
    },
  },

  hi: {
    translation: {
      "app.tagline":
        "एक ऐप। हर ज़रूरत। दुनिया में कहीं भी।",
      "chat.placeholder":
        "Mass Diamond से कुछ भी पूछें...",
      "chat.heading":
        "मैं आपकी कैसे मदद कर सकता हूँ?",
      "chat.typing": "सहायक टाइप कर रहा है...",
      "chat.error": "भेजने में विफल।",
      "chat.retry": "पुनः प्रयास करें",

      // ChatInput — attachments
      "chat.attach": "संलग्न करें",
      "chat.attachPhoto": "फ़ोटो",
      "chat.attachVideo": "वीडियो",
      "chat.attachFile": "फ़ाइल",
      "chat.attachAudio": "ऑडियो",
      "chat.attachmentOptions": "अनुलग्नक विकल्प",
      "chat.selectedAttachments":
        "चयनित अनुलग्नक",

      // ChatInput — voice input
      "chat.voiceStart": "आवाज़ इनपुट शुरू करें",
      "chat.voiceStop": "आवाज़ इनपुट रोकें",
      "chat.voiceListening": "सुन रहा है…",
      "chat.voiceError":
        "आवाज़ इनपुट त्रुटि। पुनः प्रयास करें।",
      "chat.voiceTryAgain":
        "आवाज़ इनपुट उपलब्ध नहीं है। पुनः प्रयास करें।",
      "chat.voiceUnsupported":
        "इस ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है",

      // ChatInput — send
      "chat.send": "भेजें",

      // Navigation
      "nav.home": "होम",
      "nav.search": "खोजें",
      "nav.marketplace": "मार्केटप्लेस",
      "nav.realEstate": "रियल एस्टेट",
      "nav.businesses": "व्यवसाय",
      "nav.messages": "संदेश",
      "nav.notifications": "सूचनाएं",
      "nav.profile": "प्रोफ़ाइल",

      // Capabilities
      "capability.home": "होम",
      "capability.search": "खोजें",
      "capability.marketplace": "मार्केटप्लेस",
      "capability.realEstate": "रियल एस्टेट",
      "capability.businesses": "व्यवसाय",

      // Empty states
      "empty.conversations": "अभी तक कोई बातचीत नहीं।",
      "empty.marketplace":
        "मार्केटप्लेस में कोई लिस्टिंग नहीं मिली।",
      "empty.properties": "कोई संपत्ति नहीं मिली।",
      "empty.businesses": "कोई व्यवसाय नहीं मिला।",
      "empty.notifications": "अभी तक कोई सूचना नहीं।",

      // Configuration
      "config.aiRequired":
        "AI प्रदाता कॉन्फ़िगर नहीं किया गया है।",
      "config.searchRequired":
        "खोज प्रदाता कॉन्फ़िगर नहीं किया गया है।",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
  });

// Detect the language of a single piece of text.
// This allows direction/alignment to be decided per message
// rather than globally.
export function detectMessageLanguage(text: string): string {
  const persianArabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;

  if (persianArabicPattern.test(text)) {
    return "fa";
  }

  return navigator.language.split("-")[0];
}

export default i18n;
