// ==========================================================
// Mass Diamond — Capability Router
// Production-ready capability detection and routing.
// ==========================================================

/**
 * Central capability definitions for Mass Diamond.
 *
 * The router is intentionally provider-agnostic.
 * It decides WHAT the user wants, not HOW the request is executed.
 */

export const CAPABILITIES = [
  "GENERAL_CHAT",
  "SEARCH",
  "VISION",
  "IMAGE",
  "VOICE",
  "VIDEO",
  "EDUCATION",
  "TRADE",
  "MARKETPLACE",
  "REAL_ESTATE",
  "BUSINESS",
  "ADVERTISING",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export type SupportedLanguage =
  | "en"
  | "fa"
  | "ar"
  | "tr"
  | "fr"
  | "de"
  | "es"
  | "nl"
  | "ru"
  | "ko"
  | "ja"
  | "hi";

export interface RouterInput {
  message: string;

  /**
   * Optional explicit capability requested by the client.
   * Explicit routing always has priority over automatic detection.
   */
  capability?: Capability | string | null;

  /**
   * Optional language supplied by the client.
   */
  language?: string | null;

  /**
   * Optional attachments.
   */
  attachments?: RouterAttachment[];

  /**
   * Optional conversation context.
   * Only a small amount should be used for routing.
   */
  previousMessages?: RouterMessage[];

  /**
   * Optional metadata supplied by the frontend.
   */
  metadata?: Record<string, unknown>;
}

export interface RouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RouterAttachment {
  type:
    | "image"
    | "audio"
    | "video"
    | "file"
    | "document"
    | "unknown";

  mimeType?: string | null;
  name?: string | null;
  url?: string | null;
}

export interface CapabilityDetection {
  capability: Capability;
  confidence: number;
  reason: string;
  explicit: boolean;
}

/**
 * Normalized result used by the AI chat layer.
 */
export interface RoutingResult extends CapabilityDetection {
  language: SupportedLanguage;
}

/* ==========================================================
 * Constants
 * ========================================================== */

const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const SUPPORTED_LANGUAGES = new Set<SupportedLanguage>([
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
]);

/**
 * Capability aliases.
 *
 * These make the router tolerant of values coming from older
 * frontend versions or different clients.
 */
const CAPABILITY_ALIASES: Record<string, Capability> = {
  general: "GENERAL_CHAT",
  chat: "GENERAL_CHAT",
  general_chat: "GENERAL_CHAT",
  ai: "GENERAL_CHAT",

  search: "SEARCH",
  web: "SEARCH",
  web_search: "SEARCH",
  internet: "SEARCH",

  vision: "VISION",
  visual: "VISION",
  image_analysis: "VISION",
  image_understanding: "VISION",

  image: "IMAGE",
  images: "IMAGE",
  image_generation: "IMAGE",
  image_edit: "IMAGE",
  image_editing: "IMAGE",

  voice: "VOICE",
  audio: "VOICE",
  speech: "VOICE",
  speech_to_text: "VOICE",
  text_to_speech: "VOICE",

  video: "VIDEO",
  videos: "VIDEO",
  video_generation: "VIDEO",
  video_analysis: "VIDEO",

  education: "EDUCATION",
  learn: "EDUCATION",
  learning: "EDUCATION",
  university: "EDUCATION",
  school: "EDUCATION",

  trade: "TRADE",
  trading: "TRADE",
  import: "TRADE",
  export: "TRADE",
  china_trade: "TRADE",
  global_trade: "TRADE",

  marketplace: "MARKETPLACE",
  shopping: "MARKETPLACE",
  shop: "MARKETPLACE",
  product: "MARKETPLACE",
  products: "MARKETPLACE",

  real_estate: "REAL_ESTATE",
  realestate: "REAL_ESTATE",
  property: "REAL_ESTATE",
  properties: "REAL_ESTATE",
  house: "REAL_ESTATE",
  home: "REAL_ESTATE",

  business: "BUSINESS",
  businesses: "BUSINESS",
  company: "BUSINESS",
  companies: "BUSINESS",
  local_business: "BUSINESS",

  advertising: "ADVERTISING",
  advertisement: "ADVERTISING",
  ads: "ADVERTISING",
  marketing: "ADVERTISING",
};

/* ==========================================================
 * Keyword groups
 * ========================================================== */

const KEYWORDS: Record<
  Exclude<Capability, "GENERAL_CHAT">,
  string[]
> = {
  SEARCH: [
    // English
    "search",
    "find",
    "look up",
    "lookup",
    "latest",
    "news",
    "website",
    "online",
    "internet",
    "what happened",
    "current",
    "today",
    "price",
    "compare",

    // Persian
    "جستجو",
    "بگرد",
    "پیدا کن",
    "سرچ",
    "اخبار",
    "جدیدترین",
    "آخرین",
    "امروز",
    "اینترنت",
    "سایت",
    "قیمت",
    "مقایسه",

    // Arabic
    "ابحث",
    "بحث",
    "آخر الأخبار",
    "اليوم",

    // Turkish
    "ara",
    "arama",
    "bul",
    "haber",
    "güncel",
    "bugün",

    // French
    "chercher",
    "recherche",
    "actualités",
    "aujourd'hui",

    // German
    "suchen",
    "suche",
    "nachrichten",
    "heute",
  ],

  VISION: [
    "image analysis",
    "analyze image",
    "what is in this image",
    "what's in this image",
    "describe this image",
    "look at this image",
    "read this image",
    "read this photo",
    "analyze this photo",
    "تصویر را بررسی",
    "عکس را بررسی",
    "این عکس چیه",
    "این تصویر چیه",
    "از روی عکس",
    "عکس رو تحلیل",
    "تصویر رو تحلیل",
    "تحلیل تصویر",
    "تحلیل عکس",
    "اقرأ الصورة",
    "حلل الصورة",
  ],

  IMAGE: [
    "generate image",
    "create image",
    "make an image",
    "draw",
    "illustration",
    "edit image",
    "edit photo",
    "modify image",
    "modify photo",
    "remove background",
    "change background",
    "enhance image",
    "تصویر بساز",
    "عکس بساز",
    "عکس تولید کن",
    "تصویر تولید کن",
    "نقاشی کن",
    "طراحی کن",
    "تصویرسازی",
    "عکس را ویرایش",
    "تصویر را ویرایش",
    "پس زمینه را حذف",
    "پس‌زمینه را حذف",
    "تصویر را تغییر",
    "عکس را تغییر",
  ],

  VOICE: [
    "voice",
    "audio",
    "listen",
    "speak",
    "read aloud",
    "transcribe",
    "transcription",
    "speech",
    "recording",
    "صدا",
    "ویس",
    "صوت",
    "گوش بده",
    "صحبت کن",
    "بلند بخوان",
    "تبدیل صدا",
    "تبدیل صوت",
    "رونویسی",
    "پیاده سازی صدا",
    "پیاده‌سازی صدا",
  ],

  VIDEO: [
    "video",
    "watch video",
    "find video",
    "create video",
    "generate video",
    "edit video",
    "video generation",
    "ویدیو",
    "ویدئو",
    "فیلم",
    "ویدیو بساز",
    "ویدئو بساز",
    "فیلم بساز",
    "ویدیو پیدا کن",
    "ویدئو پیدا کن",
    "ویدیو را ویرایش",
    "ویدئو را ویرایش",
  ],

  EDUCATION: [
    "education",
    "educational",
    "learn",
    "teach me",
    "lesson",
    "course",
    "coursework",
    "homework",
    "assignment",
    "school",
    "university",
    "college",
    "professor",
    "student",
    "study",
    "exam",
    "tutorial",
    "آموزش",
    "یاد بده",
    "یادگیری",
    "درس",
    "دوره",
    "کلاس",
    "دانشگاه",
    "مدرسه",
    "دانشجو",
    "دانش آموز",
    "دانش‌آموز",
    "تکلیف",
    "امتحان",
    "آموزشی",
  ],

  TRADE: [
    "trade",
    "trading",
    "import",
    "export",
    "supplier",
    "factory",
    "wholesale",
    "manufacturer",
    "china",
    "chinese market",
    "global trade",
    "international trade",
    "iran china",
    "بازرگانی",
    "تجارت",
    "واردات",
    "صادرات",
    "تامین کننده",
    "تأمین کننده",
    "کارخانه",
    "عمده فروشی",
    "تولید کننده",
    "چین",
    "بازار چین",
    "تجارت بین الملل",
    "تجارت بین‌الملل",
    "تأمین",
  ],

  MARKETPLACE: [
    "marketplace",
    "shop",
    "shopping",
    "buy",
    "sell",
    "product",
    "products",
    "seller",
    "buyer",
    "listing",
    "order",
    "cart",
    "store",
    "فروشگاه",
    "مارکت",
    "بازار",
    "خرید",
    "فروش",
    "محصول",
    "کالا",
    "فروشنده",
    "خریدار",
    "آگهی",
    "سفارش",
    "سبد خرید",
  ],

  REAL_ESTATE: [
    "real estate",
    "property",
    "properties",
    "apartment",
    "house for sale",
    "house for rent",
    "home for sale",
    "home for rent",
    "rent",
    "rental",
    "land",
    "villa",
    "office",
    "commercial property",
    "ملک",
    "املاک",
    "آپارتمان",
    "خانه",
    "خرید خانه",
    "فروش خانه",
    "اجاره خانه",
    "اجاره",
    "زمین",
    "ویلا",
    "دفتر",
    "مغازه",
    "ملک تجاری",
  ],

  BUSINESS: [
    "business",
    "businesses",
    "company",
    "companies",
    "restaurant",
    "hotel",
    "cafe",
    "shop near me",
    "business near me",
    "local business",
    "store near me",
    "service",
    "services",
    "کسب و کار",
    "کسب‌وکار",
    "شرکت",
    "رستوران",
    "هتل",
    "کافه",
    "فروشگاه نزدیک",
    "نزدیک من",
    "کسب و کارهای اطراف",
    "خدمات",
    "مغازه",
  ],

  ADVERTISING: [
    "advertising",
    "advertisement",
    "advertise",
    "ad",
    "ads",
    "marketing",
    "campaign",
    "seo",
    "promotion",
    "promote",
    "social media ad",
    "create an ad",
    "make an ad",
    "تبلیغ",
    "تبلیغات",
    "آگهی تبلیغاتی",
    "بازاریابی",
    "کمپین",
    "سئو",
    "پروموشن",
    "تبلیغ کن",
    "آگهی بساز",
    "تبلیغ بساز",
  ],
};

/* ==========================================================
 * Normalization
 * ========================================================== */

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u200c\u200d]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCapability(
  value: unknown,
): Capability | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeText(value)
    .replace(/[\s-]+/g, "_");

  if (
    CAPABILITIES.includes(
      normalized.toUpperCase() as Capability,
    )
  ) {
    return normalized.toUpperCase() as Capability;
  }

  return CAPABILITY_ALIASES[normalized] ?? null;
}

function normalizeLanguage(
  value: unknown,
): SupportedLanguage {
  if (typeof value !== "string") {
    return DEFAULT_LANGUAGE;
  }

  const language = value
    .trim()
    .toLocaleLowerCase()
    .split("-")[0]
    .split("_")[0] as SupportedLanguage;

  return SUPPORTED_LANGUAGES.has(language)
    ? language
    : DEFAULT_LANGUAGE;
}

/* ==========================================================
 * Attachment detection
 * ========================================================== */

function hasAttachmentType(
  attachments: RouterAttachment[] | undefined,
  type: RouterAttachment["type"],
): boolean {
  return Boolean(
    attachments?.some((attachment) => {
      return attachment?.type === type;
    }),
  );
}

function detectAttachmentCapability(
  attachments: RouterAttachment[] | undefined,
): Capability | null {
  if (!attachments?.length) {
    return null;
  }

  if (
    hasAttachmentType(attachments, "image")
  ) {
    return "VISION";
  }

  if (
    hasAttachmentType(attachments, "audio")
  ) {
    return "VOICE";
  }

  if (
    hasAttachmentType(attachments, "video")
  ) {
    return "VIDEO";
  }

  return null;
}

/* ==========================================================
 * Explicit routing
 * ========================================================== */

function detectExplicitCapability(
  capability: unknown,
): Capability | null {
  return normalizeCapability(capability);
}

/* ==========================================================
 * Keyword scoring
 * ========================================================== */

function scoreCapability(
  text: string,
  capability: Exclude<Capability, "GENERAL_CHAT">,
): number {
  const keywords = KEYWORDS[capability];

  let score = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    if (text.includes(normalizedKeyword)) {
      /*
       * Longer phrases are more specific and therefore
       * receive more weight than generic single words.
       */
      const words = normalizedKeyword.split(" ").length;

      score += words >= 3
        ? 4
        : words === 2
        ? 2.5
        : 1;
    }
  }

  return score;
}

/* ==========================================================
 * Context-aware routing
 * ========================================================== */

function getRecentContext(
  previousMessages: RouterMessage[] | undefined,
): string {
  if (!previousMessages?.length) {
    return "";
  }

  /*
   * Only the latest few messages are relevant for routing.
   * This keeps the router cheap and prevents old conversation
   * content from dominating the current intent.
   */
  return previousMessages
    .slice(-4)
    .map((message) => normalizeText(message.content))
    .filter(Boolean)
    .join(" ");
}

function detectCapabilityFromText(
  message: string,
  previousMessages?: RouterMessage[],
): CapabilityDetection {
  const normalizedMessage = normalizeText(message);
  const context = getRecentContext(previousMessages);

  if (!normalizedMessage && !context) {
    return {
      capability: "GENERAL_CHAT",
      confidence: 1,
      reason: "Empty or non-actionable message.",
      explicit: false,
    };
  }

  /*
   * Current message receives much more weight than history.
   */
  const currentText = normalizedMessage;
  const contextualText = context
    ? `${context} ${currentText}`.trim()
    : currentText;

  const scores = new Map<Capability, number>();

  for (const capability of CAPABILITIES) {
    scores.set(capability, 0);
  }

  for (const capability of Object.keys(KEYWORDS) as Array<
    Exclude<Capability, "GENERAL_CHAT">
  >) {
    let score = scoreCapability(
      currentText,
      capability,
    );

    /*
     * Context is deliberately weaker.
     */
    if (context && context !== currentText) {
      score +=
        scoreCapability(contextualText, capability) *
        0.25;
    }

    scores.set(capability, score);
  }

  /*
   * Strong intent patterns.
   */

  if (
    /\b(generate|create|make|draw|design)\b.*\b(image|picture|photo)\b/i.test(
      currentText,
    ) ||
    /(?:عکس|تصویر).*(?:بساز|تولید|طراحی|ایجاد)/.test(
      currentText,
    )
  ) {
    scores.set(
      "IMAGE",
      (scores.get("IMAGE") ?? 0) + 8,
    );
  }

  if (
    /\b(analyze|describe|read)\b.*\b(image|photo|picture)\b/i.test(
      currentText,
    ) ||
    /(?:عکس|تصویر).*(?:تحلیل|بررسی|بخوان)/.test(
      currentText,
    )
  ) {
    scores.set(
      "VISION",
      (scores.get("VISION") ?? 0) + 8,
    );
  }

  if (
    /\b(create|generate|make|edit)\b.*\bvideo\b/i.test(
      currentText,
    ) ||
    /(?:ویدیو|ویدئو|فیلم).*(?:بساز|تولید|ویرایش)/.test(
      currentText,
    )
  ) {
    scores.set(
      "VIDEO",
      (scores.get("VIDEO") ?? 0) + 8,
    );
  }

  if (
    /\b(find|search|look up)\b.*\b(near me|nearby)\b/i.test(
      currentText,
    ) ||
    /(?:پیدا کن|جستجو).*(?:نزدیک من|اطراف من)/.test(
      currentText,
    )
  ) {
    scores.set(
      "BUSINESS",
      (scores.get("BUSINESS") ?? 0) + 6,
    );
  }

  let bestCapability: Capability = "GENERAL_CHAT";
  let bestScore = 0;

  for (const capability of CAPABILITIES) {
    if (capability === "GENERAL_CHAT") {
      continue;
    }

    const score = scores.get(capability) ?? 0;

    if (score > bestScore) {
      bestScore = score;
      bestCapability = capability;
    }
  }

  /*
   * Low-confidence requests remain general chat.
   * This is important: the router should not hijack ordinary
   * conversations just because a generic keyword appears.
   */
  if (bestScore < 1) {
    return {
      capability: "GENERAL_CHAT",
      confidence: 0.95,
      reason: "No specialized capability matched.",
      explicit: false,
    };
  }

  /*
   * Convert score into a bounded confidence value.
   */
  const confidence = Math.min(
    0.99,
    Math.max(
      0.55,
      0.55 + bestScore * 0.055,
    ),
  );

  return {
    capability: bestCapability,
    confidence,
    reason: `Detected ${bestCapability} intent from the current request and recent context.`,
    explicit: false,
  };
}

/* ==========================================================
 * Public API
 * ========================================================== */

/**
 * Detect capability from a plain message.
 *
 * This is intentionally kept as the simplest public API because
 * the Edge Function can use it directly.
 */
export function detectCapability(
  message: string,
  previousMessages?: RouterMessage[],
): Capability {
  return detectCapabilityFromText(
    message,
    previousMessages,
  ).capability;
}

/**
 * Full routing result.
 */
export function routeRequest(
  input: RouterInput,
): RoutingResult {
  const language = normalizeLanguage(input.language);

  const explicitCapability =
    detectExplicitCapability(input.capability);

  if (explicitCapability) {
    return {
      capability: explicitCapability,
      confidence: 1,
      reason: "Capability was explicitly supplied by the client.",
      explicit: true,
      language,
    };
  }

  const attachmentCapability =
    detectAttachmentCapability(input.attachments);

  /*
   * An attached image/audio/video is a strong signal.
   * Text can still override it when the user clearly asks for
   * another operation.
   */
  if (attachmentCapability) {
    const textResult = detectCapabilityFromText(
      input.message,
      input.previousMessages,
    );

    const textHasStrongIntent =
      textResult.capability !== "GENERAL_CHAT" &&
      textResult.confidence >= 0.75;

    if (!textHasStrongIntent) {
      return {
        ...textResult,
        capability: attachmentCapability,
        confidence: 0.92,
        reason:
          `Capability inferred from ${attachmentCapability.toLowerCase()} attachment.`,
        explicit: false,
        language,
      };
    }
  }

  const detected = detectCapabilityFromText(
    input.message,
    input.previousMessages,
  );

  return {
    ...detected,
    language,
  };
}

/**
 * Compatibility helper used by the AI chat function.
 */
export function getCapability(
  input: RouterInput,
): Capability {
  return routeRequest(input).capability;
}

/**
 * Checks whether a capability is valid.
 */
export function isCapability(
  value: unknown,
): value is Capability {
  return normalizeCapability(value) !== null;
}

/**
 * Returns all supported capabilities.
 */
export function getCapabilities(): readonly Capability[] {
  return CAPABILITIES;
}

/**
 * Returns all supported languages.
 */
export function getSupportedLanguages(): readonly SupportedLanguage[] {
  return [
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
}

/**
 * Normalizes a client-provided capability.
 */
export function normalizeRequestedCapability(
  value: unknown,
): Capability | null {
  return normalizeCapability(value);
}

/**
 * Lightweight capability description.
 *
 * Useful for provider/model selection later.
 */
export function getCapabilityDescription(
  capability: Capability,
): string {
  switch (capability) {
    case "GENERAL_CHAT":
      return "General AI conversation, reasoning and assistance.";

    case "SEARCH":
      return "Web and current-information search.";

    case "VISION":
      return "Image understanding, analysis and visual question answering.";

    case "IMAGE":
      return "Image generation, editing and visual creation.";

    case "VOICE":
      return "Speech recognition, audio understanding and text-to-speech workflows.";

    case "VIDEO":
      return "Video understanding, generation, editing and video workflows.";

    case "EDUCATION":
      return "Learning, teaching, courses, academic and educational workflows.";

    case "TRADE":
      return "International trade, suppliers, import, export and global commerce.";

    case "MARKETPLACE":
      return "Products, sellers, buyers, listings, shopping and marketplace workflows.";

    case "REAL_ESTATE":
      return "Property, housing, rentals, land and real-estate workflows.";

    case "BUSINESS":
      return "Businesses, companies, local services, restaurants and business discovery.";

    case "ADVERTISING":
      return "Advertising, campaigns, marketing, SEO and promotional content.";
  }
}

/**
 * Returns whether a capability normally needs external data.
 *
 * This is metadata only. The provider layer decides how to
 * actually execute the capability.
 */
export function requiresExternalData(
  capability: Capability,
): boolean {
  switch (capability) {
    case "SEARCH":
    case "MARKETPLACE":
    case "REAL_ESTATE":
    case "BUSINESS":
    case "TRADE":
      return true;

    default:
      return false;
  }
}

/**
 * Returns whether the capability can naturally use an AI model.
 */
export function requiresAIModel(
  capability: Capability,
): boolean {
  switch (capability) {
    case "GENERAL_CHAT":
    case "VISION":
    case "IMAGE":
    case "VOICE":
    case "VIDEO":
    case "EDUCATION":
    case "TRADE":
    case "MARKETPLACE":
    case "REAL_ESTATE":
    case "BUSINESS":
    case "ADVERTISING":
      return true;

    case "SEARCH":
      return true;
  }
}

/* ==========================================================
 * Safety / normalization helpers for the Edge Function
 * ========================================================== */

/**
 * Sanitizes user input before it reaches downstream routing.
 *
 * This does NOT remove content from the actual AI prompt.
 * It only protects the router from pathological input.
 */
export function sanitizeRoutingMessage(
  message: unknown,
  maxLength = 20_000,
): string {
  if (typeof message !== "string") {
    return "";
  }

  return message
    .normalize("NFKC")
    .slice(0, maxLength)
    .trim();
}

/**
 * Creates a safe RouterInput from untrusted client data.
 */
export function normalizeRouterInput(
  input: Partial<RouterInput> | null | undefined,
): RouterInput {
  const message = sanitizeRoutingMessage(
    input?.message,
  );

  const attachments = Array.isArray(
    input?.attachments,
  )
    ? input!.attachments!.filter(Boolean).map(
        (attachment) => ({
          type: attachment.type,
          mimeType:
            typeof attachment.mimeType === "string"
              ? attachment.mimeType
              : null,
          name:
            typeof attachment.name === "string"
              ? attachment.name
              : null,
          url:
            typeof attachment.url === "string"
              ? attachment.url
              : null,
        }),
      )
    : [];

  const previousMessages =
    Array.isArray(input?.previousMessages)
      ? input!.previousMessages!
          .filter(
            (message) =>
              message &&
              typeof message.content === "string" &&
              (
                message.role === "user" ||
                message.role === "assistant" ||
                message.role === "system"
              ),
          )
          .slice(-10)
      : [];

  return {
    message,
    capability:
      typeof input?.capability === "string"
        ? input.capability
        : null,
    language:
      typeof input?.language === "string"
        ? input.language
        : null,
    attachments,
    previousMessages,
    metadata:
      input?.metadata &&
      typeof input.metadata === "object"
        ? input.metadata
        : undefined,
  };
}
