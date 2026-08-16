// ==========================================================
// Mass Diamond — AI provider abstraction
// Add new providers by implementing AIProvider and registering
// them in getProvider(). The rest of the app never talks to a
// specific vendor SDK directly.
// ==========================================================

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProviderResponse {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIProvider {
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

    if (!res.ok) {
      throw new Error(`Anthropic provider error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");

    return {
      content: text,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens
    };
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
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: messages.map((m) => ({ role: m.role, content: m.content }))
      })
    });

    if (!res.ok) {
      throw new Error(`OpenAI provider error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens
    };
  }
}

/**
 * NoProviderConfigured is NOT a fake AI response. It throws, and the
 * calling function is responsible for returning a clear
 * "CONFIGURATION REQUIRED" state to the client — never a simulated
 * assistant reply.
 */
export class NoProviderConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured");
  }
}

export function getProvider(): AIProvider {
  const providerName = Deno.env.get("AI_PROVIDER");
  const apiKey = Deno.env.get("AI_PROVIDER_API_KEY");

  if (!providerName || providerName === "none" || !apiKey) {
    throw new NoProviderConfiguredError();
  }

  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    default:
      throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
  }
}
