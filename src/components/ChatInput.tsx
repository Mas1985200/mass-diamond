import { useRef, useState, type KeyboardEvent } from "react";
import { Mic, ImagePlus, Send, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
  onSend: (message: string, attachment?: File) => void;
  sending?: boolean;
}

export function ChatInput({ onSend, sending }: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    // Guard against double-submission: ignore Enter presses or extra
    // button clicks that arrive while a previous message is still sending.
    if (sending) return;
    if (!text.trim() && !attachment) return;
    onSend(text.trim(), attachment ?? undefined);
    setText("");
    setAttachment(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      // Shift+Enter still inserts a newline (default browser behavior);
      // only a plain Enter triggers sending.
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="md-panel p-3">
      {attachment && (
        <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
          <ImagePlus size={16} />
          <span className="truncate max-w-[200px]">{attachment.name}</span>
          <button
            onClick={() => setAttachment(null)}
            disabled={sending}
            className="text-primary hover:underline disabled:opacity-50"
          >
            remove
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="p-2.5 rounded-full text-text-muted hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Upload image"
        >
          <ImagePlus size={20} />
        </button>
        <button
          type="button"
          onClick={() => setRecording((r) => !r)}
          disabled={sending}
          className={`p-2.5 rounded-full transition-colors disabled:opacity-40 disabled:pointer-events-none ${
            recording ? "text-primary" : "text-text-muted hover:text-primary"
          }`}
          aria-label="Voice input"
        >
          <Mic size={20} />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          enterKeyHint="send"
          placeholder={t("chat.placeholder")}
          className="md-input flex-1 min-w-0 resize-none max-h-32"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!text.trim() && !attachment)}
          className="md-btn-primary p-2.5 rounded-full disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
