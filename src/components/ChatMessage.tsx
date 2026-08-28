import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { detectMessageLanguage, isRtl } from "@/lib/i18n";
import type { Capability } from "@/lib/capabilities";

export interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  capability?: Capability;
}

interface ChatMessageProps {
  message: DisplayMessage;
  onOpenCapability?: (capability: Exclude<Capability, "GENERAL_CHAT">) => void;
}

// Renders a single chat bubble. The bubble's side (left/right) follows the
// standard chat convention based on role, but the text direction and
// alignment inside the bubble are based on the actual language of that
// message's content — not a single fixed app-wide direction.
export function ChatMessage({ message, onOpenCapability }: ChatMessageProps) {
  const lang = detectMessageLanguage(message.content);
  const rtl = isRtl(lang);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        dir={rtl ? "rtl" : "ltr"}
        className={`max-w-[92%] rounded-xl2 px-4 py-3 text-[15px] leading-relaxed ${
          rtl ? "text-right" : "text-left"
        } ${isUser ? "bg-primary text-background" : "md-panel"}`}
      >
        <div
          className={`chat-markdown ${isUser ? "chat-markdown-user" : "chat-markdown-assistant"}`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>

        {message.capability && message.capability !== "GENERAL_CHAT" && onOpenCapability && (
          <button
            onClick={() =>
              onOpenCapability(message.capability as Exclude<Capability, "GENERAL_CHAT">)
            }
            className="block mt-3 text-xs font-medium text-primary hover:underline"
          >
            Open {message.capability.toLowerCase().replace("_", " ")} results →
          </button>
        )}
      </div>
    </div>
  );
}

// Custom renderers so Markdown output looks like a polished product,
// not raw/unstyled Markdown. No external "prose" plugin dependency —
// every element is styled explicitly with Tailwind utility classes.
const markdownComponents: Components = {
  h1: (props: ComponentProps<"h1">) => (
    <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0" {...props} />
  ),
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="text-base font-bold mt-3 mb-2 first:mt-0" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0" {...props} />
  ),
  p: (props: ComponentProps<"p">) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props: ComponentProps<"ul">) => (
    <ul className="list-disc ps-5 mb-2 space-y-1" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="list-decimal ps-5 mb-2 space-y-1" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li className="leading-relaxed" {...props} />,
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-semibold" {...props} />
  ),
  em: (props: ComponentProps<"em">) => <em className="italic" {...props} />,
  a: (props: ComponentProps<"a">) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80 break-words"
    />
  ),
  // react-markdown v9 no longer passes an "inline" boolean prop; block vs.
  // inline code is instead inferred from a "language-*" className (fenced
  // code with a language tag) or the presence of a newline in the content.
  code: ({ className, children, ...rest }) => {
    const text = String(children).replace(/\n$/, "");
    const isBlock = /language-(\w+)/.test(className ?? "") || text.includes("\n");
    if (isBlock) {
      return (
        <code className={`font-mono text-[13px] ${className ?? ""}`} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[13px]" {...rest}>
        {children}
      </code>
    );
  },
  pre: (props: ComponentProps<"pre">) => (
    <pre className="bg-black/25 rounded-lg p-3 mb-2 overflow-x-auto text-[13px]" {...props} />
  ),
  table: (props: ComponentProps<"table">) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: (props: ComponentProps<"thead">) => (
    <thead className="border-b border-border/60" {...props} />
  ),
  th: (props: ComponentProps<"th">) => (
    <th className="px-3 py-1.5 text-start font-semibold" {...props} />
  ),
  td: (props: ComponentProps<"td">) => (
    <td className="px-3 py-1.5 border-t border-border/30" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="border-s-2 border-primary/50 ps-3 italic text-text-muted mb-2" {...props} />
  ),
  input: (props: ComponentProps<"input">) => (
    <input {...props} disabled className="me-2 align-middle accent-primary" />
  ),
};
