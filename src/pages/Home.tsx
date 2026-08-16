import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ShoppingBag, Building2, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ChatInput } from "@/components/ChatInput";
import { ConfigRequired } from "@/components/States";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CAPABILITY_ROUTES, type Capability } from "@/lib/capabilities";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  capability?: Capability;
}

const capabilityButtons = [
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

  async function handleSend(text: string, attachment?: File) {
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
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
          language: navigator.language.split("-")[0],
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

      // If the AI classified this as a specific capability, offer a
      // deep link into that module's real search/browse UI.
      if (data.capability && data.capability !== "GENERAL_CHAT") {
        // Left as an in-chat suggestion rather than auto-navigating,
        // so the user stays in control of leaving the conversation.
      }
    } catch (err) {
      setConfigError("Something went wrong reaching the Mass Diamond assistant. Please try again.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <ConfigRequired label="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-2xl mx-auto w-full px-4">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
          <Logo size={64} />
          <h1 className="text-2xl font-semibold text-center">{t("chat.heading")}</h1>
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
        <div className="flex-1 py-6 space-y-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl2 px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-primary text-background" : "md-panel"
                }`}
              >
                {m.content}
                {m.capability && m.capability !== "GENERAL_CHAT" && (
                  <button
                    onClick={() => navigate(CAPABILITY_ROUTES[m.capability as Exclude<Capability, "GENERAL_CHAT">])}
                    className="block mt-2 text-xs text-primary hover:underline"
                  >
                    Open {m.capability.toLowerCase().replace("_", " ")} results →
                  </button>
                )}
              </div>
            </div>
          ))}
          {configError && <ConfigRequired label={configError} />}
        </div>
      )}

      <div className="sticky bottom-16 md:bottom-4 py-2 bg-background">
        <ChatInput onSend={handleSend} sending={sending} />
      </div>
    </div>
  );
}
