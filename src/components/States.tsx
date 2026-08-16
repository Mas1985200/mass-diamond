import { Loader2, AlertTriangle, Inbox, Settings } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
      <Loader2 className="animate-spin text-primary" size={28} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
      <Inbox size={28} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ label, onRetry }: { label: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
      <AlertTriangle size={28} className="text-primary" />
      <span>{label}</span>
      {onRetry && (
        <button onClick={onRetry} className="md-btn-ghost text-sm">
          Retry
        </button>
      )}
    </div>
  );
}

// Used wherever a feature depends on an unconfigured external service
// (AI provider, search provider, payment provider, etc.) — per spec
// section 54, never faked, always clearly labeled.
export function ConfigRequired({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted text-center px-6">
      <Settings size={28} className="text-primary" />
      <span className="font-medium text-text">Configuration required</span>
      <span className="text-sm max-w-sm">{label}</span>
    </div>
  );
}
