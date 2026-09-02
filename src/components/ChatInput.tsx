import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  Plus,
  ImagePlus,
  Video,
  FileText,
  Music,
  Send,
  Loader2,
  Mic,
  MicOff,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AttachmentPreview,
  getAttachmentKind,
  type ChatAttachment,
} from "@/components/AttachmentPreview";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (message: string, attachments: ChatAttachment[]) => void;
  sending?: boolean;
}

type AttachmentInputKind = "image" | "video" | "file" | "audio";

interface AttachmentMenuOption {
  id: AttachmentInputKind;
  label: string;
  icon: typeof ImagePlus;
  inputRef: RefObject<HTMLInputElement | null>;
  accept?: string;
}

export function ChatInput({
  onSend,
  sending = false,
}: ChatInputProps) {
  const { t, i18n } = useTranslation();

  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  /*
   * This ref intentionally mirrors the current attachments array.
   * It allows cleanup of only the files that are still owned by this
   * ChatInput instance when the component unmounts.
   *
   * Sent attachments are transferred to the parent through onSend().
   * Their object URLs must NOT be revoked here immediately because
   * ChatMessage may still use those exact preview URLs.
   */
  const attachmentsRef = useRef<ChatAttachment[]>([]);
  attachmentsRef.current = attachments;

  /*
   * Keep the latest text available to asynchronous speech callbacks.
   * The speech hook already guarantees finalized results, while this
   * component owns how those results are merged into the textarea.
   */
  const textRef = useRef("");
  textRef.current = text;

  /*
   * Add finalized speech text without ever replacing existing input.
   */
  const handleSpeechResult = useCallback((finalText: string) => {
    const incoming = finalText.trim();

    if (!incoming) {
      return;
    }

    setText((current) => {
      const existing = current.trim();

      if (!existing) {
        return incoming;
      }

      return `${existing} ${incoming}`;
    });
  }, []);

  const speech = useSpeechRecognition({
    language: i18n.language,
    onResult: handleSpeechResult,
  });

  /*
   * If the UI language changes while recognition is active, stop the
   * current browser recognition session. The next tap starts it using
   * the new locale from speechLocales.ts.
   */
  useEffect(() => {
    speech.stop();
  }, [i18n.language, speech.stop]);

  /*
   * Cleanup only attachments that still belong to this input.
   *
   * Once attachments have been handed to onSend(), this state becomes
   * empty and the parent owns those ChatAttachment objects.
   */
  useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, []);

  /*
   * Close attachment menu when clicking outside.
   */
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  /*
   * Escape closes the attachment menu.
   */
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  /*
   * Sending always wins over auxiliary UI.
   */
  useEffect(() => {
    if (sending) {
      setMenuOpen(false);
    }
  }, [sending]);

  /*
   * Add selected files to the existing attachment collection.
   *
   * Object URLs are created exactly once and the resulting
   * ChatAttachment objects are preserved unchanged.
   */
  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length || sending) {
        return;
      }

      const selectedFiles = Array.from(fileList);

      const newAttachments: ChatAttachment[] = selectedFiles.map(
        (file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          kind: getAttachmentKind(file),
        }),
      );

      setAttachments((current) => [
        ...current,
        ...newAttachments,
      ]);

      setMenuOpen(false);
    },
    [sending],
  );

  /*
   * Remove one attachment and immediately release its object URL.
   * This is safe because the attachment is no longer being sent.
   */
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => {
      const attachment = current.find(
        (item) => item.id === id,
      );

      if (attachment) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
  }, []);

  /*
   * Stop speech before sending.
   *
   * This guarantees that a finalized transcript cannot arrive after
   * the message has already been handed to the parent.
   */
  const handleSend = useCallback(() => {
    if (sending) {
      return;
    }

    const trimmedText = textRef.current.trim();

    if (!trimmedText && attachments.length === 0) {
      return;
    }

    if (speech.status === "listening") {
      speech.stop();
    }

    /*
     * Keep the exact ChatAttachment objects.
     * The parent/Home owns them after this callback.
     */
    onSend(trimmedText, attachments);

    /*
     * Clear only this input's local references.
     * Do NOT revoke preview URLs here: ChatMessage may still render them.
     */
    setText("");
    setAttachments([]);
    setMenuOpen(false);
  }, [
    attachments,
    onSend,
    sending,
    speech,
  ]);

  /*
   * Enter = send
   * Shift + Enter = newline
   */
  const handleTextAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      event.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  /*
   * Attachment menu definition is intentionally local to the component
   * because the input refs are instance-specific.
   */
  const attachMenuOptions: AttachmentMenuOption[] = [
    {
      id: "image",
      label: t("chat.attachPhoto", "Photo"),
      icon: ImagePlus,
      inputRef: imageInputRef,
      accept: "image/*",
    },
    {
      id: "video",
      label: t("chat.attachVideo", "Video"),
      icon: Video,
      inputRef: videoInputRef,
      accept: "video/*",
    },
    {
      id: "file",
      label: t("chat.attachFile", "File"),
      icon: FileText,
      inputRef: fileInputRef,
    },
    {
      id: "audio",
      label: t("chat.attachAudio", "Audio"),
      icon: Music,
      inputRef: audioInputRef,
      accept: "audio/*",
    },
  ];

  const hasText = text.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = !sending && (hasText || hasAttachments);

  const isListening = speech.status === "listening";
  const isSpeechError = speech.status === "error";
  const isSpeechUnsupported = speech.status === "unsupported";

  const micLabel = isSpeechUnsupported
    ? t(
        "chat.voiceUnsupported",
        "Voice input is not supported in this browser",
      )
    : isSpeechError
      ? t(
          "chat.voiceError",
          "Voice input error. Tap to try again.",
        )
      : isListening
        ? t(
            "chat.voiceStop",
            "Stop voice input",
          )
        : t(
            "chat.voiceStart",
            "Start voice input",
          );

  const micStatusText = isListening
    ? t(
        "chat.voiceListening",
        "Listening…",
      )
    : isSpeechError
      ? t(
          "chat.voiceTryAgain",
          "Voice input is unavailable. Try again.",
        )
      : null;

  return (
    <div
      className="md-panel p-3"
      aria-busy={sending}
    >
      {/*
       * Selected attachments
       */}
      {hasAttachments && (
        <div
          className="mb-2 flex flex-wrap gap-1"
          aria-label={t(
            "chat.selectedAttachments",
            "Selected attachments",
          )}
        >
          {attachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() =>
                removeAttachment(attachment.id)
              }
              disabled={sending}
            />
          ))}
        </div>
      )}

      {/*
       * Hidden native file inputs.
       *
       * The value is reset after every selection so choosing the exact
       * same file again still triggers onChange.
       */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex items-end gap-2">
        {/*
         * Attachment button
         */}
        <div
          ref={menuRef}
          className="relative shrink-0"
        >
          <button
            type="button"
            disabled={sending}
            aria-label={t(
              "chat.attach",
              "Attach",
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            className="rounded-full p-2.5 text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus
              size={20}
              aria-hidden="true"
              className={`transition-transform duration-200 ${
                menuOpen ? "rotate-45" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label={t(
                "chat.attachmentOptions",
                "Attachment options",
              )}
              className="absolute bottom-full start-0 z-30 mb-2 flex min-w-[160px] flex-col gap-0.5 rounded-xl p-1.5 shadow-lg md-panel"
            >
              {attachMenuOptions.map(
                ({
                  id,
                  label,
                  icon: Icon,
                  inputRef,
                }) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    disabled={sending}
                    onClick={() => {
                      inputRef.current?.click();
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-start text-sm text-text transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Icon
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 text-primary"
                    />
                    <span>{label}</span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {/*
         * Voice input
         */}
        <div className="relative shrink-0">
          <button
            type="button"
            disabled={
              sending ||
              !speech.isSupported
            }
            onClick={speech.toggle}
            aria-label={micLabel}
            aria-pressed={isListening}
            title={micLabel}
            className={[
              "relative rounded-full p-2.5 transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              "disabled:pointer-events-none disabled:opacity-40",
              isListening
                ? "text-primary"
                : isSpeechError
                  ? "text-red-400 hover:text-red-300"
                  : "text-text-muted hover:text-primary",
            ].join(" ")}
          >
            {/*
             * Pulsing ring gives a much clearer visual indication that
             * the microphone is actively listening.
             */}
            {isListening && (
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full bg-primary/20"
              />
            )}

            <span className="relative flex">
              {isListening ? (
                <MicOff
                  size={20}
                  aria-hidden="true"
                />
              ) : isSpeechError ? (
                <span className="relative">
                  <Mic
                    size={20}
                    aria-hidden="true"
                  />
                  <AlertCircle
                    size={9}
                    aria-hidden="true"
                    className="absolute -end-1 -top-1 fill-background"
                  />
                </span>
              ) : (
                <Mic
                  size={20}
                  aria-hidden="true"
                />
              )}
            </span>
          </button>

          {/*
           * Visually hidden live region for assistive technology.
           */}
          {micStatusText && (
            <span
              className="sr-only"
              role="status"
              aria-live="polite"
            >
              {micStatusText}
            </span>
          )}

          {isSpeechUnsupported && (
            <span className="sr-only">
              {micLabel}
            </span>
          )}
        </div>

        {/*
         * Text input
         */}
        <textarea
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          onKeyDown={handleTextAreaKeyDown}
          rows={1}
          enterKeyHint="send"
          placeholder={t(
            "chat.placeholder",
          )}
          disabled={sending}
          aria-label={t(
            "chat.placeholder",
            "Message",
          )}
          className="md-input min-h-[42px] max-h-32 min-w-0 flex-1 resize-none disabled:opacity-60"
        />

        {/*
         * Send button
         */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label={t(
            "chat.send",
            "Send",
          )}
          title={t(
            "chat.send",
            "Send",
          )}
          className="md-btn-primary shrink-0 rounded-full p-2.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {sending ? (
            <Loader2
              className="animate-spin"
              size={20}
              aria-hidden="true"
            />
          ) : (
            <Send
              size={20}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </div>
  );
}
