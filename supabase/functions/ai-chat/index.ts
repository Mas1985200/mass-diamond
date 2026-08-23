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
// - If capability is SEARCH and TAVILY_API_KEY is configured, performs
//   a real web search via Tavily and gives the AI the results to answer from.
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

    const capability: Capability = body.capability ?? (await classifyCapability(provider, message));

    // If this is a search-intent message and Tavily is configured, run a
    // real web search and hand the results to the model as context.
    let searchContext = "";
    if (capability === "SEARCH") {
      searchContext = await searchWeb(message);
    }

    const systemPrompt = buildSystemPrompt(capability, language, body.country, body.city, searchContext);

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

// Calls Tavily's search API and returns a compact, formatted context
// block the model can cite from. Returns an empty string (never throws)
// if the key is missing or the request fails, so search issues never
// break the chat experience.
async function searchWeb(query: string): Promise<string> {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) return "";

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: false
      })
    });

    if (!res.ok) return "";

    const data = await res.json();
    const results = (data.results ?? []) as Array<{ title: string; url: string; content: string }>;

    if (results.length === 0) return "";

    return results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content.slice(0, 400)}`)
      .join("\n\n");
  } catch (e) {
    console.error("Tavily search error:", e);
    return "";
  }
}

function buildSystemPrompt(
  capability: Capability,
  language?: string,
  country?: string,
  city?: string,
  searchContext?: string
) {
  const base = `You are the Mass Diamond assistant, a helpful multilingual assistant for a global marketplace, real estate, and business-directory app. Respond in ${language ?? "the user's language"}. The user is located in ${city ?? "an unspecified city"}, ${country ?? "an unspecified country"}.`;

  switch (capability) {
    case "MARKETPLACE":
      return `${base} The user wants to buy or sell an item on the marketplace. Guide them step by step: ask for photos, price, condition, and location if missing, and explain that AI-suggested prices are estimates, never guarantees. Do not claim to have created a listing yourself — direct them to use the listing form, which you can describe.`;
    case "REAL_ESTATE":
      return `${base} The user has a real-estate request (renting or buying/selling property). Ask clarifying questions about type, budget, bedrooms, and location as needed, and explain results come from the platform's property database.`;
    case "BUSINESS":
      return `${base} The user wants to find a local business (restaurant, shop, service). Ask about cuisine/category and location as needed, and explain results come from the platform's verified business directory.`;
    case "SEARCH":
      if (searchContext) {
        return `${base} The user has a general search intent. Use the following live web search results to answer accurately and cite sources by their number in brackets, e.g. [1]. If the results don't answer the question, say so honestly.\n\nSearch results:\n${searchContext}`;
      }
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
