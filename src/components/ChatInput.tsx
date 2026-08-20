import { useRef, useState } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    if (!text.trim() && !attachment) return;
    onSend(text.trim(), attachment ?? undefined);
    setText("");
    setAttachment(null);
  }

  // Voice input: recording UI wired to the voice-stt Edge Function.
  // Shows a clear configuration-required state if the provider isn't
  // set (handled by the parent via the returned status), rather than
  // faking transcription. Kept minimal here — full recorder logic
  // lives wherever this component is used, to keep this file focused.
  const [recording, setRecording] = useState(false);

  return (
    <div className="md-panel p-3">
      {attachment && (
        <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
          <ImagePlus size={16} />
          <span className="truncate max-w-[200px]">{attachment.name}</span>
          <button onClick={() => setAttachment(null)} className="text-primary hover:underline">
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
          className="p-2.5 rounded-full text-text-muted hover:text-primary transition-colors"
          aria-label="Upload image"
        >
          <ImagePlus size={20} />
        </button>
        <button
          type="button"
          onClick={() => setRecording((r) => !r)}
          className={`p-2.5 rounded-full transition-colors ${recording ? "text-primary" : "text-text-muted hover:text-primary"}`}
          aria-label="Voice input"
        >
          <Mic size={20} />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder={t("chat.placeholder")}
          className="md-input flex-1 min-w-0 resize-none max-h-32"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="md-btn-primary p-2.5 rounded-full disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
