import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { detectMessageLanguage, isRtl } from "@/lib/i18n";
import type { Capability } from "@/lib/capabilities";
import {
  AttachmentPreview,
  type ChatAttachment,
} from "@/components/AttachmentPreview";

export interface DisplayMessage {
  /**
   * Stable unique identifier for this message.
   * Retry always targets this exact message.
   */
  id: string;

  role: "user" | "assistant";

  content: string;

  /**
   * Capability detected by the AI for assistant messages.
   */
  capability?: Capability;

  /**
   * Sending state is used only by user messages.
   */
  status?: "sending" | "sent" | "error";

  /**
   * Attachments belong to the message itself.
   *
   * The exact ChatAttachment objects created by ChatInput are preserved
   * so File references and object URLs remain stable for:
   * - message previews
   * - retries
   * - subsequent UI renders
   */
  attachments?: ChatAttachment[];
}

interface ChatMessageProps {
  message: DisplayMessage;

  /**
   * Opens the application module associated with an AI capability.
   */
  onOpenCapability?: (
    capability: Exclude<Capability, "GENERAL_CHAT">,
  ) => void;

  /**
   * Retries this exact message by its stable ID.
   */
  onRetry?: (id: string) => void;

  /**
   * Prevents concurrent retry operations.
   */
  sending?: boolean;
}

/**
 * Renders one message in the conversation.
 *
 * Responsibilities:
 * - user/assistant bubble alignment
 * - per-message RTL/LTR detection
 * - Markdown + GFM rendering
 * - multimedia attachment previews
 * - failed-message Retry
 * - capability routing
 */
export function ChatMessage({
  message,
  onOpenCapability,
  onRetry,
  sending = false,
}: ChatMessageProps) {
  const { t } = useTranslation();

  const language = detectMessageLanguage(message.content);
  const rtl = isRtl(language);
  const isUser = message.role === "user";

  const attachments = message.attachments ?? [];

  const canOpenCapability =
    Boolean(
      message.capability &&
        message.capability !== "GENERAL_CHAT" &&
        onOpenCapability,
    );

  const handleCapabilityOpen = () => {
    if (
      message.capability &&
      message.capability !== "GENERAL_CHAT" &&
      onOpenCapability
    ) {
      onOpenCapability(
        message.capability as Exclude<
          Capability,
          "GENERAL_CHAT"
        >,
      );
    }
  };

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        dir={rtl ? "rtl" : "ltr"}
        className={[
          "max-w-[92%]",
          "rounded-xl2",
          "px-4",
          "py-3",
          "text-[15px]",
          "leading-relaxed",
          rtl ? "text-right" : "text-left",
          isUser
            ? "bg-primary text-background"
            : "md-panel",
          message.status === "error"
            ? "opacity-70"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Attachments */}
        {attachments.length > 0 && (
          <div
            className="flex flex-wrap mb-2"
            aria-label="Message attachments"
          >
            {attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
              />
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div
            className={[
              "chat-markdown",
              isUser
                ? "chat-markdown-user"
                : "chat-markdown-assistant",
            ].join(" ")}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Failed message / Retry */}
        {message.status === "error" && (
          <div
            dir={rtl ? "rtl" : "ltr"}
            className="mt-2 flex items-center gap-2 text-xs text-red-200"
          >
            <span>{t("chat.error")}</span>

            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                disabled={sending}
                className="font-medium underline underline-offset-2 hover:no-underline disabled:pointer-events-none disabled:opacity-50"
              >
                {t("chat.retry")}
              </button>
            )}
          </div>
        )}

        {/* Capability routing */}
        {canOpenCapability && (
          <button
            type="button"
            onClick={handleCapabilityOpen}
            className="block mt-3 text-xs font-medium text-primary hover:underline"
          >
            Open{" "}
            {message.capability
              ?.toLowerCase()
              .replace("_", " ")}{" "}
            results →
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Custom Markdown renderers.
 *
 * The chat does not rely on Tailwind's prose plugin.
 * Every Markdown element used by the assistant is explicitly styled.
 */
const markdownComponents: Components = {
  h1: (props: ComponentProps<"h1">) => (
    <h1
      className="text-lg font-bold mt-3 mb-2 first:mt-0"
      {...props}
    />
  ),

  h2: (props: ComponentProps<"h2">) => (
    <h2
      className="text-base font-bold mt-3 mb-2 first:mt-0"
      {...props}
    />
  ),

  h3: (props: ComponentProps<"h3">) => (
    <h3
      className="text-sm font-bold mt-2 mb-1 first:mt-0"
      {...props}
    />
  ),

  h4: (props: ComponentProps<"h4">) => (
    <h4
      className="text-sm font-semibold mt-2 mb-1 first:mt-0"
      {...props}
    />
  ),

  p: (props: ComponentProps<"p">) => (
    <p
      className="mb-2 last:mb-0 break-words"
      {...props}
    />
  ),

  ul: (props: ComponentProps<"ul">) => (
    <ul
      className="list-disc ps-5 mb-2 space-y-1"
      {...props}
    />
  ),

  ol: (props: ComponentProps<"ol">) => (
    <ol
      className="list-decimal ps-5 mb-2 space-y-1"
      {...props}
    />
  ),

  li: (props: ComponentProps<"li">) => (
    <li
      className="leading-relaxed break-words"
      {...props}
    />
  ),

  strong: (props: ComponentProps<"strong">) => (
    <strong
      className="font-semibold"
      {...props}
    />
  ),

  em: (props: ComponentProps<"em">) => (
    <em
      className="italic"
      {...props}
    />
  ),

  del: (props: ComponentProps<"del">) => (
    <del
      className="line-through opacity-80"
      {...props}
    />
  ),

  a: (props: ComponentProps<"a">) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80 break-words"
    />
  ),

  hr: (props: ComponentProps<"hr">) => (
    <hr
      className="my-3 border-border/60"
      {...props}
    />
  ),

  code: ({
    className,
    children,
    ...rest
  }) => {
    const text = String(children).replace(/\n$/, "");

    const isBlock =
      /language-\w+/.test(className ?? "") ||
      text.includes("\n");

    if (isBlock) {
      return (
        <code
          className={[
            "font-mono",
            "text-[13px]",
            "leading-relaxed",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[13px] break-words"
        {...rest}
      >
        {children}
      </code>
    );
  },

  pre: (props: ComponentProps<"pre">) => (
    <pre
      className="bg-black/25 rounded-lg p-3 mb-2 overflow-x-auto text-[13px] leading-relaxed max-w-full"
      {...props}
    />
  ),

  table: (props: ComponentProps<"table">) => (
    <div className="overflow-x-auto mb-2 max-w-full">
      <table
        className="min-w-full text-sm border-collapse"
        {...props}
      />
    </div>
  ),

  thead: (props: ComponentProps<"thead">) => (
    <thead
      className="border-b border-border/60"
      {...props}
    />
  ),

  tbody: (props: ComponentProps<"tbody">) => (
    <tbody {...props} />
  ),

  tr: (props: ComponentProps<"tr">) => (
    <tr
      className="border-border/30"
      {...props}
    />
  ),

  th: (props: ComponentProps<"th">) => (
    <th
      className="px-3 py-1.5 text-start font-semibold whitespace-nowrap"
      {...props}
    />
  ),

  td: (props: ComponentProps<"td">) => (
    <td
      className="px-3 py-1.5 border-t border-border/30 align-top"
      {...props}
    />
  ),

  blockquote: (
    props: ComponentProps<"blockquote">,
  ) => (
    <blockquote
      className="border-s-2 border-primary/50 ps-3 italic text-text-muted mb-2"
      {...props}
    />
  ),

  input: (props: ComponentProps<"input">) => (
    <input
      {...props}
      disabled
      className="me-2 align-middle accent-primary"
    />
  ),
};
