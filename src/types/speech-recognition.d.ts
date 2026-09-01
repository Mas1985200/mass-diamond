/**
 * Mass Diamond — Web Speech API Contracts
 *
 * Runtime implementation:
 *   - Chrome / Chromium: SpeechRecognition or webkitSpeechRecognition
 *   - Safari / WebKit: webkitSpeechRecognition
 *
 * This file intentionally contains NO runtime implementation.
 * It only extends the browser's global type surface so the application
 * can use Web Speech API safely and consistently across browsers.
 *
 * Keep speech business logic inside:
 *   src/hooks/useSpeechRecognition.ts
 *
 * Keep locale mapping inside:
 *   src/lib/speechLocales.ts
 */

type SpeechRecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed";

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;

  item(index: number): SpeechRecognitionAlternative;

  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;

  item(index: number): SpeechRecognitionResult;

  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  /**
   * BCP-47 language tag used by the recognition engine.
   * Example: "en-US", "fa-IR", "tr-TR".
   */
  lang: string;

  /**
   * Keep listening across multiple speech segments.
   */
  continuous: boolean;

  /**
   * Return non-final/interim recognition results.
   */
  interimResults: boolean;

  /**
   * Maximum number of recognition alternatives requested.
   */
  maxAlternatives: number;

  /**
   * Begin microphone recognition.
   *
   * Browser may throw synchronously when recognition cannot be started,
   * therefore callers should still protect this with try/catch.
   */
  start(): void;

  /**
   * Gracefully stop recognition and allow pending results to finish.
   */
  stop(): void;

  /**
   * Immediately terminate recognition and discard pending results.
   */
  abort(): void;

  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

/**
 * Browser capability detection.
 *
 * Different browser engines expose the API under different names:
 *
 *   window.SpeechRecognition
 *   window.webkitSpeechRecognition
 *
 * The runtime hook is responsible for selecting the available
 * implementation. Application code should never access these
 * constructors directly.
 */
interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
