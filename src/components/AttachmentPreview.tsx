import { X, FileText, Music } from "lucide-react";

export type AttachmentKind = "image" | "video" | "audio" | "file";

export interface ChatAttachment {
  id: string;
  file: File;
  previewUrl: string;
  kind: AttachmentKind;
}

export function getAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

interface AttachmentPreviewProps {
  attachment: ChatAttachment;
  // Omit onRemove to render in read-only mode — used for attachments
  // already sent and shown inside a message bubble, where removal no
  // longer applies. Passing it renders a remove button — used in
  // ChatInput before sending.
  onRemove?: () => void;
  disabled?: boolean;
}

// Shows a real preview for an attachment based on its actual kind:
// image -> real thumbnail, video -> inline video element, audio -> inline
// audio player, file -> generic icon + filename. This single component is
// reused both in ChatInput (with a remove button, before sending) and in
// ChatMessage (read-only, after sending), so preview rendering never
// diverges between the two states.
export function AttachmentPreview({ attachment, onRemove, disabled }: AttachmentPreviewProps) {
  const { kind, previewUrl, file } = attachment;

  return (
    <div className="relative inline-flex items-center mb-2 me-2">
      {kind === "image" && (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-16 h-16 rounded-lg object-cover border border-border"
        />
      )}

      {kind === "video" && (
        <video
          src={previewUrl}
          muted
          className="w-16 h-16 rounded-lg object-cover border border-border bg-black"
        />
      )}

      {kind === "audio" && (
        <div className="min-w-[160px] max-w-[220px] rounded-lg border border-border p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
            <Music size={14} />
            <span className="truncate">{file.name}</span>
          </div>
          <audio src={previewUrl} controls className="h-8 w-full" />
        </div>
      )}

      {kind === "file" && (
        <div className="w-16 h-16 rounded-lg border border-border flex flex-col items-center justify-center gap-1 text-text-muted px-1">
          <FileText size={20} />
          <span className="text-[10px] truncate max-w-[56px]">{file.name}</span>
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove attachment"
          className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-50"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
