import { useEffect, useState } from "react";
import { X, FileText } from "lucide-react";

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

// Shows a real image thumbnail for image attachments (instead of just a
// filename), with a way to remove it before sending. Non-image files
// (for a future Attach menu with documents/video) fall back to a generic
// file icon + name, so this component is ready to be reused once those
// attachment types are added.
export function AttachmentPreview({ file, onRemove, disabled }: AttachmentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="relative inline-flex items-center mb-2">
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-16 h-16 rounded-lg object-cover border border-border"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg border border-border flex flex-col items-center justify-center gap-1 text-text-muted px-1">
          <FileText size={20} />
          <span className="text-[10px] truncate max-w-[56px]">{file.name}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove attachment"
        className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-50"
      >
        <X size={12} />
      </button>
    </div>
  );
}
