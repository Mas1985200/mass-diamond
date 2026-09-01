/**
 * Mass Diamond — Speech Recognition Locale Registry
 *
 * Single source of truth for every Web Speech API locale used by
 * the application.
 *
 * Responsibilities:
 * - Convert i18next language codes into valid BCP-47 locales.
 * - Support both base codes ("fa") and regional variants ("fa-AF").
 * - Provide a guaranteed fallback locale.
 * - Remain dependency-free so it can be reused anywhere.
 */

import type { SupportedLanguage } from "@/lib/i18n";

/**
 * Default locale used whenever the incoming language cannot be resolved.
 */
export const DEFAULT_SPEECH_LOCALE = "en-US" as const;

/**
 * Canonical Web Speech API locale for every language supported by
 * Mass Diamond.
 */
export const SPEECH_LOCALES = {
  en: "en-US",
  fa: "fa-IR",
  ar: "ar-SA",
  tr: "tr-TR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  nl: "nl-NL",
  ru: "ru-RU",
  ko: "ko-KR",
  ja: "ja-JP",
  hi: "hi-IN",
} as const satisfies Record<SupportedLanguage, string>;

export type SpeechLocale =
  (typeof SPEECH_LOCALES)[SupportedLanguage] | typeof DEFAULT_SPEECH_LOCALE;

/**
 * Resolve an i18next language value into a Web Speech API locale.
 *
 * Examples:
 * - "fa" -> "fa-IR"
 * - "fa-AF" -> "fa-IR"
 * - "en-GB" -> "en-US"
 * - "TR" -> "tr-TR"
 * - "unknown" -> "en-US"
 */
export function getSpeechLocale(language: string): SpeechLocale {
  const base = language
    .trim()
    .toLowerCase()
    .split("-")[0] as SupportedLanguage;

  return SPEECH_LOCALES[base] ?? DEFAULT_SPEECH_LOCALE;
}
