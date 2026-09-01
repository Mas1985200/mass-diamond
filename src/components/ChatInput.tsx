import {
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AttachmentPreview,
  getAttachmentKind,
  type ChatAttachment,
} from "@/components/AttachmentPreview";

interface ChatInputProps {
  onSend: (message: string, attachments: ChatAttachment[]) => void;
  sending?: boolean;
}

type AttachMenuOption = {
  label: string;
  icon: typeof ImagePlus;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function ChatInput({
  onSend,
  sending = false,
}: ChatInputProps) {
  const { t } = useTranslation();

  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  /*
   * Keep the latest attachments available for unmount cleanup.
   */
  const attachmentsRef = useRef<ChatAttachment[]>([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  /*
   * Release object URLs that are still owned by ChatInput
   * when the component is unmounted.
   */
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, []);

  /*
   * Close Attach menu when clicking outside.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, [menuOpen]);

  /*
   * Close Attach menu with Escape.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (
      event: globalThis.KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [menuOpen]);

  /*
   * Add selected files.
   */
  function addFiles(
    fileList: FileList | null,
    input?: HTMLInputElement,
  ) {
    if (!fileList?.length) {
      if (input) {
        input.value = "";
      }
      return;
    }

    const newAttachments: ChatAttachment[] =
      Array.from(fileList).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        kind: getAttachmentKind(file),
      }));

    setAttachments((current) => [
      ...current,
      ...newAttachments,
    ]);

    setMenuOpen(false);

    /*
     * Reset input so selecting the same file again
     * triggers onChange.
     */
    if (input) {
      input.value = "";
    }
  }

  /*
   * Remove an attachment and release its object URL.
   */
  function removeAttachment(id: string) {
    setAttachments((current) => {
      const attachment = current.find(
        (item) => item.id === id,
      );

      if (attachment) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return current.filter(
        (item) => item.id !== id,
      );
    });
  }

  /*
   * Send message.
   */
  function handleSend() {
    if (sending) return;

    const trimmedText = text.trim();

    if (
      !trimmedText &&
      attachments.length === 0
    ) {
      return;
    }

    /*
     * Ownership of attachments transfers to the parent.
     * Do NOT revoke their object URLs here.
     */
    onSend(trimmedText, attachments);

    setText("");
    setAttachments([]);
    setMenuOpen(false);
  }

  /*
   * Enter = send
   * Shift + Enter = new line
   */
  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key !== "Enter" ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    handleSend();
  }

  /*
   * Voice input placeholder.
   * Real STT will be connected in the Voice phase.
   */
  function toggleRecording() {
    if (sending) return;

    setRecording((current) => !current);
  }

  const attachMenuOptions: AttachMenuOption[] = [
    {
      label: "Photo",
      icon: ImagePlus,
      inputRef: imageInputRef,
    },
    {
      label: "Video",
      icon: Video,
      inputRef: videoInputRef,
    },
    {
      label: "File",
      icon: FileText,
      inputRef: fileInputRef,
    },
    {
      label: "Audio",
      icon: Music,
      inputRef: audioInputRef,
    },
  ];

  const canSend =
    !sending &&
    (
      text.trim().length > 0 ||
      attachments.length > 0
    );

  return (
    <div className="md-panel p-3">
      {/* Selected attachments */}
      {attachments.length > 0 && (
        <div
          className="flex flex-wrap mb-1"
          aria-label="Selected attachments"
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

      <div className="flex items-end gap-2">
        {/* Hidden file inputs */}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) =>
            addFiles(
              event.target.files,
              event.currentTarget,
            )
          }
        />

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(event) =>
            addFiles(
              event.target.files,
              event.currentTarget,
            )
          }
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) =>
            addFiles(
              event.target.files,
              event.currentTarget,
            )
          }
        />

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(event) =>
            addFiles(
              event.target.files,
              event.currentTarget,
            )
          }
        />

        {/* Attach button + menu */}
        <div
          ref={menuRef}
          className="relative"
        >
          <button
            type="button"
            disabled={sending}
            aria-label="Attach"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen(
                (current) => !current,
              )
            }
            className="p-2.5 rounded-full text-text-muted hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus
              size={20}
              className={`transition-transform ${
                menuOpen
                  ? "rotate-45"
                  : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Attachment options"
              className="absolute bottom-full mb-2 start-0 md-panel p-1.5 flex flex-col gap-0.5 min-w-[150px] shadow-lg z-20"
            >
              {attachMenuOptions.map(
                ({
                  label,
                  icon: Icon,
                  inputRef,
                }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    disabled={sending}
                    onClick={() =>
                      inputRef.current?.click()
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text hover:bg-surface transition-colors text-start disabled:opacity-50"
                  >
                    <Icon
                      size={16}
                      className="text-primary shrink-0"
                    />
                    <span>{label}</span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {/* Microphone */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={sending}
          aria-label="Voice input"
          aria-pressed={recording}
          className={`p-2.5 rounded-full transition-colors disabled:opacity-40 disabled:pointer-events-none ${
            recording
              ? "text-primary"
              : "text-text-muted hover:text-primary"
          }`}
        >
          <Mic size={20} />
        </button>

        {/* Text input */}
        <textarea
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          onKeyDown={handleKeyDown}
          rows={1}
          enterKeyHint="send"
          placeholder={t("chat.placeholder")}
          disabled={sending}
          aria-label={t("chat.placeholder")}
          className="md-input flex-1 min-w-0 resize-none max-h-32 disabled:opacity-60"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send"
          className="md-btn-primary p-2.5 rounded-full disabled:opacity-50"
        >
          {sending ? (
            <Loader2
              className="animate-spin"
              size={20}
            />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
