import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ShoppingBag, Building2, Store, Home as HomeIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage, type DisplayMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ConfigRequired } from "@/components/States";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { detectMessageLanguage } from "@/lib/i18n";
import { CAPABILITY_ROUTES, type Capability } from "@/lib/capabilities";

const capabilityButtons = [
  { key: "capability.home", icon: HomeIcon, route: "/" },
  { key: "capability.search", icon: Search, route: "/search" },
  { key: "capability.marketplace", icon: ShoppingBag, route: "/marketplace" },
  { key: "capability.realEstate", icon: Building2, route: "/real-estate" },
  { key: "capability.businesses", icon: Store, route: "/businesses" }
] as const;

// This is the first screen after login, per spec section 2.
// The AI classifies intent server-side (ai-chat Edge Function) and
// routes the user toward the right module — the user never needs to
// pick a module manually unless they want to.
export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, configured } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message or the typing indicator, so the
  // user always sees the current state of the conversation without
  // manually scrolling — runs whenever a message is added/removed or
  // the sending (typing indicator) state changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function handleSend(text: string, attachment?: File) {
    if (!text && !attachment) return;

    // Keep a local preview of the attached image alive for the lifetime
    // of this conversation, so the user's own message bubble still shows
    // the picture they sent, not just its filename or a bare URL.
    const attachmentPreviewUrl = attachment ? URL.createObjectURL(attachment) : undefined;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, attachmentPreviewUrl }
    ]);
    setSending(true);
    setConfigError(null);

    try {
      let attachmentUrl: string | undefined;
      if (attachment && session) {
        const path = `${session.user.id}/${crypto.randomUUID()}-${attachment.name}`;
        const { error: uploadErr } = await supabase.storage.from("chat-attachments").upload(path, attachment);
        if (!uploadErr) {
          const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
          attachmentUrl = data.publicUrl;
        }
      }

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          conversation_id: conversationId,
          message: text,
          language: detectMessageLanguage(text),
          attachment_url: attachmentUrl
        }
      });

      if (error) throw error;

      if (data.status === "CONFIGURATION_REQUIRED") {
        setConfigError(data.message);
        return;
      }

      setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, capability: data.capability }]);
    } catch (err) {
      setConfigError("Something went wrong reaching the Mass Diamond assistant. Please try again.");
      console.error(err);
    } finally {
      // sending is always cleared here, on both success and error, so
      // TypingIndicator (which is only shown while sending is true) is
      // removed immediately in either case.
      setSending(false);
    }
  }

  function openCapability(capability: Exclude<Capability, "GENERAL_CHAT">) {
    navigate(CAPABILITY_ROUTES[capability]);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <ConfigRequired label="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-3xl mx-auto w-full px-0">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
          <Logo size={88} />
          <h1 className="text-2xl font-semibold text-center">{t("chat.heading")}</h1>

          {/* Chat input now sits right under the heading instead of pinned to the bottom */}
          <div className="w-full max-w-md">
            <ChatInput onSend={handleSend} sending={sending} />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {capabilityButtons.map(({ key, icon: Icon, route }) => (
              <button
                key={key}
                onClick={() => navigate(route)}
                className="md-panel flex items-center gap-2 px-4 py-3 text-sm hover:border-primary/50 transition-colors"
              >
                <Icon size={18} className="text-primary" />
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 py-6 space-y-4 overflow-y-auto pb-32">
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} onOpenCapability={openCapability} />
            ))}
            {sending && <TypingIndicator />}
            {configError && <ConfigRequired label={configError} />}
            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-16 md:bottom-4 py-2 bg-background">
            <ChatInput onSend={handleSend} sending={sending} />
          </div>
        </>
      )}
    </div>
  );
}
