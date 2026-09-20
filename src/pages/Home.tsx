import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ShoppingBag,
  Building2,
  Store,
  Home as HomeIcon,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { ChatInput } from "@/components/ChatInput";
import {
  ChatMessage,
  type DisplayMessage,
} from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ConfigRequired } from "@/components/States";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { detectMessageLanguage } from "@/lib/i18n";
import {
  CAPABILITY_ROUTES,
  type Capability,
} from "@/lib/capabilities";
import type { ChatAttachment } from "@/components/AttachmentPreview";

const capabilityButtons = [
  {
    key: "capability.home",
    icon: HomeIcon,
    route: "/",
  },
  {
    key: "capability.search",
    icon: Search,
    route: "/search",
  },
  {
    key: "capability.marketplace",
    icon: ShoppingBag,
    route: "/marketplace",
  },
  {
    key: "capability.realEstate",
    icon: Building2,
    route: "/real-estate",
  },
  {
    key: "capability.businesses",
    icon: Store,
    route: "/businesses",
  },
] as const;

type SendResult =
  | {
      ok: true;
      conversationId?: string;
      reply: string;
      capability?: Capability;
    }
  | {
      ok: false;
      configurationRequired?: boolean;
      message?: string;
      error?: unknown;
    };

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] =
    useState<string>();
  const [sending, setSending] = useState(false);
  const [configError, setConfigError] =
    useState<string | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const sendingRef = useRef(false);

  const conversationIdRef =
    useRef<string | undefined>(undefined);

  useEffect(() => {
    conversationIdRef.current =
      conversationId;
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  const uploadAttachments = useCallback(
    async (
      attachments: ChatAttachment[],
    ): Promise<{
      firstUrl?: string;
      failedCount: number;
    }> => {
      if (attachments.length === 0) {
        return {
          firstUrl: undefined,
          failedCount: 0,
        };
      }

      if (!session) {
        throw new Error(
          "User session is not available.",
        );
      }

      const results = await Promise.all(
        attachments.map(async (attachment) => {
          const safeName =
            attachment.file.name.replace(
              /[^\w.\-() ]+/g,
              "_",
            ) || "attachment";

          const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;

          const { error } =
            await supabase.storage
              .from("chat-attachments")
              .upload(
                path,
                attachment.file,
                {
                  cacheControl: "3600",
                  upsert: false,
                  contentType:
                    attachment.file.type ||
                    undefined,
                },
              );

          if (error) {
            console.error(
              "[MassDiamond][Attachment] Upload failed:",
              error,
            );

            return {
              url: undefined,
              failed: true,
            };
          }

          const { data } =
            supabase.storage
              .from("chat-attachments")
              .getPublicUrl(path);

          return {
            url: data.publicUrl,
            failed: false,
          };
        }),
      );

      return {
        firstUrl: results.find(
          (
            result,
          ): result is {
            url: string;
            failed: false;
          } =>
            Boolean(result.url) &&
            !result.failed,
        )?.url,
        failedCount: results.filter(
          (result) => result.failed,
        ).length,
      };
    },
    [session],
  );

  const performSend = useCallback(
    async (
      messageId: string,
      text: string,
      attachments: ChatAttachment[],
    ): Promise<SendResult> => {
      if (sendingRef.current) {
        console.warn(
          "[MassDiamond][Chat] Send blocked: already sending.",
        );

        return {
          ok: false,
        };
      }

      sendingRef.current = true;
      setSending(true);
      setConfigError(null);

      try {
        console.log(
          "[MassDiamond][Chat] Starting send:",
          {
            messageId,
            text,
            hasSession: Boolean(session),
            userId: session?.user?.id ?? null,
            conversationId:
              conversationIdRef.current ??
              null,
            attachmentCount:
              attachments.length,
          },
        );

        let attachmentUrl:
          | string
          | undefined;

        if (attachments.length > 0) {
          const uploadResult =
            await uploadAttachments(
              attachments,
            );

          attachmentUrl =
            uploadResult.firstUrl;

          console.log(
            "[MassDiamond][Chat] Attachments processed:",
            {
              firstUrl:
                attachmentUrl ?? null,
              failedCount:
                uploadResult.failedCount,
            },
          );
        }

        const requestBody = {
          conversation_id:
            conversationIdRef.current,
          message: text,
          language:
            detectMessageLanguage(text),
          attachment_url:
            attachmentUrl,
        };

        console.log(
          "[MassDiamond][Chat] Calling ai-chat:",
          requestBody,
        );

        const { data, error } =
          await supabase.functions.invoke(
            "ai-chat",
            {
              body: requestBody,
            },
          );

        console.log(
          "[MassDiamond][Chat] ai-chat returned:",
          {
            data,
            error,
          },
        );

        // Temporary diagnostic output:
        // Show the exact response received by the frontend.
        alert(
          `AI RESPONSE:\n\n${JSON.stringify(
            {
              data,
              error,
            },
            null,
            2,
          )}`,
        );

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "Empty response received from ai-chat.",
          );
        }

        if (
          data.status ===
          "CONFIGURATION_REQUIRED"
        ) {
          const message =
            typeof data.message ===
            "string"
              ? data.message
              : "AI service configuration is required.";

          setConfigError(message);

          setMessages((current) =>
            current.map((item) =>
              item.id === messageId
                ? {
                    ...item,
                    status: "error",
                  }
                : item,
            ),
          );

          return {
            ok: false,
            configurationRequired: true,
            message,
          };
        }

        if (
          typeof data.content !== "string"
        ) {
          throw new Error(
            "Invalid response: assistant content is missing.",
          );
        }

        const nextConversationId =
          typeof data.conversationId ===
          "string"
            ? data.conversationId
            : conversationIdRef.current;

        conversationIdRef.current =
          nextConversationId;

        setConversationId(
          nextConversationId,
        );

        setMessages((current) => {
          const updated = current.map(
            (item) =>
              item.id === messageId
                ? {
                    ...item,
                    status:
                      "sent" as const,
                  }
                : item,
          );

          return [
            ...updated,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: data.content,
              capability:
                typeof data.capability ===
                "string"
                  ? data.capability
                  : undefined,
            },
          ];
        });

        return {
          ok: true,
          conversationId:
            nextConversationId,
          reply: data.content,
          capability:
            typeof data.capability ===
            "string"
              ? data.capability
              : undefined,
        };
      } catch (error) {
        console.error(
          "[MassDiamond][Chat] Send failed:",
          error,
        );

        setMessages((current) =>
          current.map((item) =>
            item.id === messageId
              ? {
                  ...item,
                  status: "error",
                }
              : item,
          ),
        );

        return {
          ok: false,
          error,
        };
      } finally {
        sendingRef.current = false;
        setSending(false);

        console.log(
          "[MassDiamond][Chat] Send finished.",
        );
      }
    },
    [
      session,
      uploadAttachments,
    ],
  );

  const handleSend = useCallback(
    (
      text: string,
      attachments: ChatAttachment[],
    ) => {
      if (sendingRef.current) {
        return;
      }

      const trimmedText =
        text.trim();

      if (
        !trimmedText &&
        attachments.length === 0
      ) {
        return;
      }

      const messageId =
        crypto.randomUUID();

      setMessages((current) => [
        ...current,
        {
          id: messageId,
          role: "user",
          content: trimmedText,
          status: "sending",
          attachments,
        },
      ]);

      void performSend(
        messageId,
        trimmedText,
        attachments,
      );
    },
    [performSend],
  );

  const retryMessage = useCallback(
    (messageId: string) => {
      if (sendingRef.current) {
        return;
      }

      const message = messages.find(
        (item) =>
          item.id === messageId,
      );

      if (
        !message ||
        message.role !== "user"
      ) {
        return;
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                status: "sending",
              }
            : item,
        ),
      );

      void performSend(
        messageId,
        message.content,
        message.attachments ?? [],
      );
    },
    [messages, performSend],
  );

  const openCapability = useCallback(
    (
      capability: Exclude<
        Capability,
        "GENERAL_CHAT"
      >,
    ) => {
      const route =
        CAPABILITY_ROUTES[capability];

      if (route) {
        navigate(route);
      }
    },
    [navigate],
  );

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <ConfigRequired
          label="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-0">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12">
          <Logo size={88} />

          <h1 className="text-center text-2xl font-semibold">
            {t("chat.heading")}
          </h1>

          <div className="w-full max-w-md">
            <ChatInput
              onSend={handleSend}
              sending={sending}
            />
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {capabilityButtons.map(
              ({
                key,
                icon: Icon,
                route,
              }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    navigate(route)
                  }
                  className="md-panel flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:border-primary/50"
                >
                  <Icon
                    size={18}
                    className="text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    {t(key)}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-0">
      <div className="flex-1 space-y-4 overflow-y-auto py-6 pb-32">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onOpenCapability={
              openCapability
            }
            onRetry={retryMessage}
            sending={sending}
          />
        ))}

        {sending && (
          <TypingIndicator />
        )}

        {configError && (
          <ConfigRequired
            label={configError}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-16 bg-background py-2 md:bottom-4">
        <ChatInput
          onSend={handleSend}
          sending={sending}
        />
      </div>
    </div>
  );
}
