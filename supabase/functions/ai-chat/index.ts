// ==========================================================
// Mass Diamond — ai-chat Edge Function
//
// Receives: { user_id, conversation_id, message, language, country,
//             city, capability?, attachment_url? }
//
// - Never contains or returns secret API keys to the client.
// - Authenticates the caller via their Supabase JWT.
// - Writes both the user message and assistant reply to `messages`.
// - Logs usage to `ai_usage_logs`.
// - If no AI provider is configured, returns a clear
//   CONFIGURATION_REQUIRED response — never a fabricated reply.
// ==========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { getProvider, NoProviderConfiguredError, type AIMessage } from "./provider.ts";
import { classifyCapability, type Capability } from "./router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    // Client bound to the caller's JWT — respects RLS for reads/writes
    // the function performs on the user's behalf.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user },
      error: userErr
    } = await userClient.auth.getUser();

    if (userErr || !user) {
      return json({ error: "Invalid or expired session" }, 401);
    }

    const body = await req.json();
    const { conversation_id, message, language, attachment_url } = body;

    if (!message || typeof message !== "string") {
      return json({ error: "message is required" }, 400);
    }

    // Resolve or create the conversation (RLS-scoped to this user).
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

    // Persist the user's message first.
    const { error: insertUserMsgErr } = await userClient.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
      attachment_url: attachment_url ?? null
    });
    if (insertUserMsgErr) throw insertUserMsgErr;

    let provider;
    try {
      provider = getProvider();
    } catch (e) {
      if (e instanceof NoProviderConfiguredError) {
        return json(
          {
            status: "CONFIGURATION_REQUIRED",
            message:
              "AI provider is not configured. Set AI_PROVIDER and AI_PROVIDER_API_KEY as Edge Function secrets.",
            conversation_id: conversationId
          },
          200
        );
      }
      throw e;
    }

    // Classify capability, then answer with a capability-aware system prompt.
    const capability: Capability = body.capability ?? (await classifyCapability(provider, message));

    const systemPrompt = buildSystemPrompt(capability, language, body.country, body.city);

    // Pull recent history for context (RLS-scoped).
    const { data: history } = await userClient
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const aiMessages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...((history ?? []) as AIMessage[])
    ];

    const result = await provider.complete(aiMessages, { language });

    const { error: insertAssistantMsgErr } = await userClient.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "assistant",
      content: result.content,
      capability
    });
    if (insertAssistantMsgErr) throw insertAssistantMsgErr;

    // Usage logging requires the service role (bypasses RLS by design —
    // regular users cannot write to ai_usage_logs directly, see 0002).
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

    return json({
      status: "OK",
      conversation_id: conversationId,
      capability,
      reply: result.content
    });
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
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}
