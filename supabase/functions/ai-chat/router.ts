// ==========================================================
// Mass Diamond — Deterministic Capability Router
// Core Chat routing must not require an additional AI call.
// ==========================================================

export type Capability =
  | "GENERAL_CHAT"
  | "SEARCH"
  | "MARKETPLACE"
  | "REAL_ESTATE"
  | "BUSINESS";

interface RoutingRule {
  capability: Exclude<Capability, "GENERAL_CHAT">;
  patterns: RegExp[];
}

/**
 * Rules are intentionally ordered from more specific domains
 * to more general ones to reduce false-positive routing.
 */
const RULES: RoutingRule[] = [
  {
    capability: "REAL_ESTATE",
    patterns: [
      /\b(?:real\s*estate|property|properties|apartment|apartments|house|houses|villa|villas|condo|condos|flat|flats|land|rental|rent|buy\s+(?:a|an)\s+(?:house|home|apartment|property))\b/i,
      /(?:املاک|ملک|املاک و مستغلات|آپارتمان|خانه|ویلا|زمین|اجاره|رهن|خرید\s+خانه|خرید\s+آپارتمان)/i,
      /(?:عقار|عقارات|شقة|شقق|منزل|منازل|فيلا|أرض|إيجار|استئجار)/i,
      /(?:gayrimenkul|emlak|daire|ev|villa|arsa|kiralık|kiralama)/i,
      /(?:immobilien|wohnung|wohnungen|haus|häuser|villa|grundstück|miete|vermietung)/i,
      /(?:immobilier|appartement|maison|villa|terrain|location|louer)/i,
      /(?:vastgoed|appartement|huis|villa|grond|huur|huren)/i,
    ],
  },

  {
    capability: "BUSINESS",
    patterns: [
      /\b(?:restaurant|restaurants|cafe|cafes|coffee\s*shop|shop|shops|store|stores|business|businesses|company|companies|salon|hotel|hotels|clinic|pharmacy|bakery|gym|office|service|services|near\s+me)\b/i,
      /(?:رستوران|کافه|قهوه|فروشگاه|مغازه|کسب\s*و\s*کار|شرکت|سالن|هتل|کلینیک|داروخانه|نانوایی|باشگاه|دفتر|خدمات|نزدیک\s+من)/i,
      /(?:مطعم|مطاعم|مقهى|متجر|محل|شركة|صالون|فندق|عيادة|صيدلية|مخبز|نادي|خدمات|بالقرب\s+مني)/i,
      /(?:restoran|kafe|mağaza|dükkan|işletme|şirket|salon|otel|klinik|eczane|fırın|spor\s*salonu)/i,
      /(?:restaurant|café|geschäft|laden|unternehmen|salon|hotel|klinik|apotheke|bäckerei|fitnessstudio)/i,
      /(?:restaurant|café|magasin|boutique|entreprise|salon|hôtel|clinique|pharmacie|boulangerie|salle\s+de\s+sport)/i,
      /(?:restaurant|café|winkel|zaak|bedrijf|salon|hotel|kliniek|apotheek|bakkerij|sportschool)/i,
    ],
  },

  {
    capability: "MARKETPLACE",
    patterns: [
      /\b(?:marketplace|listing|listings|for\s+sale|used|second[-\s]?hand|buy|buying|sell|selling|product|products|item|items|price|prices)\b/i,
      /(?:خرید|فروش|آگهی|آگهی‌ها|دست\s*دوم|محصول|محصولات|کالا|کالاها|قیمت|مارکت\s*پلیس|بازار)/i,
      /(?:شراء|بيع|إعلان|إعلانات|مستعمل|منتج|منتجات|سلعة|سعر|سوق)/i,
      /(?:satın\s*al|satılık|sat|ikinci\s*el|ürün|ürünler|fiyat|ilan|pazar)/i,
      /(?:kaufen|verkaufen|gebraucht|produkt|produkte|preis|anzeige|marktplatz)/i,
      /(?:acheter|vendre|occasion|produit|produits|prix|annonce|marché)/i,
      /(?:kopen|verkopen|tweedehands|product|producten|prijs|advertentie|marktplaats)/i,
    ],
  },

  {
    capability: "SEARCH",
    patterns: [
      /\b(?:search|find|look\s+up|look\s+for|browse|latest|current|today|news|information|info|compare|comparison|what\s+is|who\s+is|where\s+is|when\s+is)\b/i,
      /(?:جستجو|پیدا کن|پیدا|بگرد|آخرین|جدیدترین|امروز|اخبار|اطلاعات|مقایسه|چیست|کیست|کجاست|چه زمانی)/i,
      /(?:ابحث|بحث|اعثر|ابحث\s+عن|آخر|الأحدث|اليوم|أخبار|معلومات|قارن|ما\s+هو|من\s+هو|أين|متى)/i,
      /(?:ara|bul|araştır|en\s*yeni|güncel|bugün|haber|bilgi|karşılaştır|nedir|kim|nerede|ne\s*zaman)/i,
      /(?:suchen|finde|aktuell|neueste|heute|nachrichten|informationen|vergleichen|was\s+ist|wer\s+ist|wo|wann)/i,
      /(?:chercher|trouver|rechercher|dernier|actuel|aujourd'hui|actualités|informations|comparer|qu'est[-\s]?ce|qui\s+est|où|quand)/i,
      /(?:zoeken|vinden|nieuwste|actueel|vandaag|nieuws|informatie|vergelijken|wat\s+is|wie\s+is|waar|wanneer)/i,
    ],
  },
];

function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects the most likely capability without making another AI request.
 * Unknown or ambiguous messages safely fall back to GENERAL_CHAT.
 */
export function detectCapability(userMessage: string): Capability {
  const text = normalizeText(userMessage);

  if (!text) {
    return "GENERAL_CHAT";
  }

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.capability;
    }
  }

  return "GENERAL_CHAT";
}
