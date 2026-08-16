// ==========================================================
// Mass Diamond — ai-chat Edge Function (combined single-file version
// for pasting directly into the Supabase Dashboard editor)
// ==========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

// ---------- AI provider abstraction ----------
interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIProviderResponse {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface AIProvider {
  name: string;
  complete(messages: AIMessage[], opts?: { language?: string }): Promise<AIProviderResponse>;
}

class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async complete(messages: AIMessage[]): Promise<AIProviderResponse> {
    const system = messages.find((m) => m.role === "system")?.content;
    const rest = messages.filter((m) => m.role !== "system");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: rest.map((m) => ({ role: m.role, content: m.content }))
      })
    });
    if (!res.ok) throw new Error(`Anthropic provider error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");
    return { content: text, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens };
  }
}

class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async complete(messages: AIMessage[]): Promise<AIProviderResponse> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: "gpt-4.1", messages: messages.map((m) => ({ role: m.role, content: m.content })) })
    });
    if (!res.ok) throw new Error(`OpenAI provider error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens
    };
  }
}

class NoProviderConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured");
  }
}

function getProvider(): AIProvider {
  const providerName = Deno.env.get("AI_PROVIDER");
  const apiKey = Deno.env.get("AI_PROVIDER_API_KEY");
  if (!providerName || providerName === "none" || !apiKey) throw new NoProviderConfiguredError();
  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    default:
      throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
  }
}

// ---------- Capability router ----------
type Capability = "GENERAL_CHAT" | "SEARCH" | "MARKETPLACE" | "REAL_ESTATE" | "BUSINESS";

const ROUTING_SYSTEM_PROMPT = `You are a routing classifier for the Mass Diamond app.
Classify the user's message into exactly one capability:
- GENERAL_CHAT: general questions, conversation, help, anything not below.
- SEARCH: general web/product search intent not specific to marketplace/real estate/business.
- MARKETPLACE: buying/selling goods (electronics, vehicles, furniture, etc.), including "I want to sell my X".
- REAL_ESTATE: renting or buying/selling property, apartments, houses, land.
- BUSINESS: finding local businesses, restaurants, shops, services near the user.

Respond with ONLY the capability name, nothing else.`;

async function classifyCapability(provider: AIProvider, userMessage: string): Promise<Capability> {
  const result = await provider.complete([
    { role: "system", content: ROUTING_SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ]);
  const normalized = result.content.trim().toUpperCase();
  const valid: Capability[] = ["GENERAL_CHAT", "SEARCH", "MARKETPLACE", "REAL_ESTATE", "BUSINESS"];
  return (valid.find((c) => normalized.includes(c)) ?? "GENERAL_CHAT") as Capability;
}

// ---------- Main handler ----------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

    const {
      data: { user },
      error: userErr
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid or expired session" }, 401);

    const body = await req.json();
    const { conversation_id, message, language, attachment_url } = body;
    if (!message || typeof message !== "string") return json({ error: "message is required" }, 400);

    let conversationId = conversation_id as string | undefined;
    if (!conversationId) {
      const { data: conv, error: convErr } = await userClient
        .from("conversations")
        .insert({ user_id: user.id, title: message.slice(0, 60) })
        .select("id")
        .single();
      if (convErr) throw convErr;
      conversationId = conv.id;
    }

    const { error: insertUserMsgErr } = await userClient.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
      attachment_url: attachment_url ?? null
    });
    if (insertUserMsgErr) throw insertUserMsgErr;

    let provider: AIProvider;
    try {
      provider = getProvider();
    } catch (e) {
      if (e instanceof NoProviderConfiguredError) {
        return json(
          {
            status: "CONFIGURATION_REQUIRED",
            message: "AI provider is not configured. Set AI_PROVIDER and AI_PROVIDER_API_KEY as Edge Function secrets.",
            conversation_id: conversationId
          },
          200
        );
      }
      throw e;
    }

    const capability: Capability = body.capability ?? (await classifyCapability(provider, message));
    const systemPrompt = buildSystemPrompt(capability, language, body.country, body.city);

    const { data: history } = await userClient
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const aiMessages: AIMessage[] = [{ role: "system", content: systemPrompt }, ...((history ?? []) as AIMessage[])];
    const result = await provider.complete(aiMessages, { language });

    const { error: insertAssistantMsgErr } = await userClient.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "assistant",
      content: result.content,
      capability
    });
    if (insertAssistantMsgErr) throw insertAssistantMsgErr;

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      await adminClient.from("ai_usage_logs").insert({
        user_id: user.id,
        conversation_id: conversationId,
        capability,
        provider: provider.name,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens
      });
    }

    return json({ status: "OK", conversation_id: conversationId, capability, reply: result.content });
  } catch (err) {
    console.error("ai-chat error:", err);
    return json({ error: "Internal error processing AI request" }, 500);
  }
});

function buildSystemPrompt(capability: Capability, language?: string, country?: string, city?: string) {
  const base = `You are the Mass Diamond assistant, a helpful multilingual assistant for a global marketplace, real estate, and business-directory app. Respond in ${language ?? "the user's language"}. The user is located in ${city ?? "an unspecified city"}, ${country ?? "an unspecified country"}.`;
  switch (capability) {
    case "MARKETPLACE":
      return `${base} The user wants to buy or sell an item on the marketplace. Guide them step by step: ask for photos, price, condition, and location if missing, and explain that AI-suggested prices are estimates, never guarantees. Do not claim to have created a listing yourself — direct them to use the listing form, which you can describe.`;
    case "REAL_ESTATE":
      return `${base} The user has a real-estate request (renting or buying/selling property). Ask clarifying questions about type, budget, bedrooms, and location as needed, and explain results come from the platform's property database.`;
    case "BUSINESS":
      return `${base} The user wants to find a local business (restaurant, shop, service). Ask about cuisine/category and location as needed, and explain results come from the platform's verified business directory.`;
    case "SEARCH":
      return `${base} The user has a general search intent. Help them refine their query; explain that live web results depend on a configured search provider.`;
    default:
      return base;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
