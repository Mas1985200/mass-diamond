import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechLocale } from "@/lib/speechLocales";

export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "unsupported"
  | "error";

export type SpeechRecognitionErrorReason =
  | "permission-denied"
  | "no-speech"
  | "network"
  | "language-not-supported"
  | "audio-capture"
  | "aborted"
  | "unknown";

interface UseSpeechRecognitionOptions {
  /**
   * Current application language.
   *
   * Example:
   * "fa", "en", "tr", "fa-IR", "en-US"
   */
  language: string;

  /**
   * Called only with finalized speech recognition text.
   */
  onResult: (finalText: string) => void;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  status: SpeechRecognitionStatus;
  errorReason?: SpeechRecognitionErrorReason;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

function getRecognitionConstructor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (
    window.SpeechRecognition ??
    window.webkitSpeechRecognition
  );
}

function mapErrorToReason(
  error: SpeechRecognitionErrorEvent["error"],
): SpeechRecognitionErrorReason {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "permission-denied";

    case "no-speech":
      return "no-speech";

    case "network":
      return "network";

    case "language-not-supported":
      return "language-not-supported";

    case "audio-capture":
      return "audio-capture";

    case "aborted":
      return "aborted";

    default:
      return "unknown";
  }
}

/**
 * Mass Diamond — Browser Speech Recognition
 *
 * Provides real-time speech-to-text through the browser's native
 * Web Speech API.
 *
 * Design goals:
 * - One recognition session at a time.
 * - No backend changes.
 * - No external dependency.
 * - Safe cleanup on unmount.
 * - Stable callback references.
 * - Safe language changes.
 * - Explicit permission/error states.
 * - No silent automatic restart.
 * - Works with both SpeechRecognition and webkitSpeechRecognition.
 *
 * Important privacy limitation:
 * Web Speech API processing is browser/engine dependent. For example,
 * Chrome may send recognition audio to Google's speech service.
 * Mass Diamond does not control that transport.
 */
export function useSpeechRecognition({
  language,
  onResult,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const recognitionConstructor = getRecognitionConstructor();

  const isSupported = Boolean(recognitionConstructor);

  const [status, setStatus] =
    useState<SpeechRecognitionStatus>(
      isSupported ? "idle" : "unsupported",
    );

  const [errorReason, setErrorReason] =
    useState<SpeechRecognitionErrorReason | undefined>();

  /*
   * The currently active recognition instance.
   */
  const recognitionRef =
    useRef<SpeechRecognition | null>(null);

  /*
   * Synchronous state.
   *
   * React state is intentionally NOT used as the source of truth
   * for whether recognition is running because state updates are
   * asynchronous.
   */
  const listeningRef = useRef(false);

  /*
   * Explicitly distinguishes a user-requested stop from a natural
   * browser-generated onend event.
   */
  const stopRequestedRef = useRef(false);

  /*
   * Prevents callbacks from an obsolete recognition instance from
   * affecting a newer session.
   */
  const sessionIdRef = useRef(0);

  /*
   * Always call the latest consumer callback without recreating
   * the recognition lifecycle whenever the parent re-renders.
   */
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  /*
   * Keep the current language available to callbacks without
   * forcing recognition handlers to close over stale values.
   */
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  /**
   * Completely detach and terminate the current recognition instance.
   *
   * This function is intentionally idempotent.
   */
  const teardown = useCallback(() => {
    const recognition = recognitionRef.current;

    recognitionRef.current = null;
    listeningRef.current = false;

    if (!recognition) {
      return;
    }

    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      recognition.abort();
    } catch {
      // Some browser implementations can throw if abort() is called
      // after the recognition session has already ended.
    }
  }, []);

  /**
   * Start a new speech recognition session.
   */
  const start = useCallback(() => {
    if (!recognitionConstructor) {
      setStatus("unsupported");
      setErrorReason(undefined);
      return;
    }

    /*
     * Never allow two recognition sessions to overlap.
     */
    if (listeningRef.current) {
      return;
    }

    /*
     * Every start receives a unique session id.
     * Event handlers verify this id before mutating state.
     */
    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;

    setErrorReason(undefined);
    setStatus("idle");

    const recognition =
      new recognitionConstructor();

    recognition.lang =
      getSpeechLocale(languageRef.current);

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    stopRequestedRef.current = false;

    recognition.onstart = () => {
      if (sessionId !== sessionIdRef.current) {
        return;
      }

      listeningRef.current = true;
      setStatus("listening");
    };

    recognition.onresult = (event) => {
      if (sessionId !== sessionIdRef.current) {
        return;
      }

      let finalText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];

        if (result.isFinal) {
          const transcript =
            result.item(0)?.transcript ?? "";

          finalText += transcript;
        }
      }

      const normalizedText = finalText.trim();

      if (normalizedText) {
        onResultRef.current(normalizedText);
      }
    };

    recognition.onerror = (event) => {
      if (sessionId !== sessionIdRef.current) {
        return;
      }

      const reason = mapErrorToReason(
        event.error,
      );

      /*
       * "aborted" can happen during an intentional stop.
       * It should not be presented as a user-facing failure.
       */
      if (
        reason === "aborted" &&
        stopRequestedRef.current
      ) {
        return;
      }

      setErrorReason(reason);
      setStatus("error");
    };

    recognition.onend = () => {
      if (sessionId !== sessionIdRef.current) {
        return;
      }

      listeningRef.current = false;
      recognitionRef.current = null;

      /*
       * Natural end, silence timeout, browser timeout, or an
       * intentional stop all finish the current session.
       *
       * We intentionally do NOT auto-restart recognition.
       */
      if (stopRequestedRef.current) {
        setStatus("idle");
        return;
      }

      /*
       * If onerror already put the UI into error state,
       * preserve that information.
       */
      setStatus((current) =>
        current === "error"
          ? "error"
          : "idle",
      );
    };

    recognitionRef.current = recognition;
    listeningRef.current = true;

    try {
      recognition.start();
    } catch (error) {
      /*
       * A browser may synchronously reject start() when another
       * recognition operation is still closing.
       */
      if (sessionId !== sessionIdRef.current) {
        return;
      }

      console.error(
        "Speech recognition start failed:",
        error,
      );

      recognitionRef.current = null;
      listeningRef.current = false;

      setErrorReason("unknown");
      setStatus("error");
    }
  }, [recognitionConstructor]);

  /**
   * Stop the active recognition session.
   */
  const stop = useCallback(() => {
    const recognition =
      recognitionRef.current;

    if (
      !recognition ||
      !listeningRef.current
    ) {
      return;
    }

    stopRequestedRef.current = true;

    try {
      recognition.stop();
    } catch (error) {
      /*
       * If the browser has already ended the session,
       * normalize the state rather than crashing the UI.
       */
      console.debug(
        "Speech recognition stop completed:",
        error,
      );

      listeningRef.current = false;
      recognitionRef.current = null;
      setStatus("idle");
    }
  }, []);

  /**
   * Toggle microphone state.
   */
  const toggle = useCallback(() => {
    if (listeningRef.current) {
      stop();
      return;
    }

    start();
  }, [start, stop]);

  /*
   * If the application language changes while recognition is active,
   * stop the current session safely.
   *
   * The next microphone press will start with the new locale.
   */
  const previousLanguageRef =
    useRef(language);

  useEffect(() => {
    const previousLanguage =
      previousLanguageRef.current;

    if (
      previousLanguage !== language &&
      listeningRef.current
    ) {
      stop();
    }

    previousLanguageRef.current =
      language;
  }, [language, stop]);

  /*
   * Browser support can theoretically change between renders
   * (for example after hydration/environment changes).
   */
  useEffect(() => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }

    setStatus((current) =>
      current === "unsupported"
        ? "idle"
        : current,
    );
  }, [isSupported]);

  /*
   * Final cleanup.
   *
   * This guarantees that microphone recognition cannot survive
   * after the component using the hook has been removed.
   */
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      stopRequestedRef.current = true;
      teardown();
    };
  }, [teardown]);

  return {
    isSupported,
    status,
    errorReason,
    start,
    stop,
    toggle,
  };
}
