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
  complete(
    messages: AIMessage[],
    opts?: { language?: string },
  ): Promise<AIProviderResponse>;
}

const PROVIDER_TIMEOUT_MS = 25_000;
const MAX_PROVIDER_ERROR_LENGTH = 500;

function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return { controller, timeoutId };
}

function sanitizeProviderError(status: number, body: string): string {
  const normalized = body
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROVIDER_ERROR_LENGTH);

  return normalized
    ? `Provider request failed (${status}): ${normalized}`
    : `Provider request failed (${status})`;
}

function providerTimeoutError(providerName: string): Error {
  return new Error(`${providerName} provider request timed out`);
}

class AnthropicProvider implements AIProvider {
  name = "anthropic";

  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: AIMessage[],
    _opts?: { language?: string },
  ): Promise<AIProviderResponse> {
    const system = messages.find((m) => m.role === "system")?.content;

    const rest = messages.filter((m) => m.role !== "system");

    const { controller, timeoutId } =
      createTimeoutController(PROVIDER_TIMEOUT_MS);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          ...(system ? { system } : {}),
          messages: rest.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(sanitizeProviderError(res.status, body));
      }

      const data = await res.json();

      const text = (data.content ?? [])
        .filter(
          (block: unknown): block is { type: string; text: string } =>
            typeof block === "object" &&
            block !== null &&
            "type" in block &&
            "text" in block &&
            typeof block.type === "string" &&
            typeof block.text === "string",
        )
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      return {
        content: text,
        inputTokens:
          typeof data.usage?.input_tokens === "number"
            ? data.usage.input_tokens
            : undefined,
        outputTokens:
          typeof data.usage?.output_tokens === "number"
            ? data.usage.output_tokens
            : undefined,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw providerTimeoutError(this.name);
      }

      if (
        error instanceof Error &&
        error.message.includes("timed out")
      ) {
        throw error;
      }

      throw error instanceof Error
        ? error
        : new Error("Anthropic provider request failed");
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

class OpenAIProvider implements AIProvider {
  name = "openai";

  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: AIMessage[],
    _opts?: { language?: string },
  ): Promise<AIProviderResponse> {
    const { controller, timeoutId } =
      createTimeoutController(PROVIDER_TIMEOUT_MS);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(sanitizeProviderError(res.status, body));
      }

      const data = await res.json();

      const content = data.choices?.[0]?.message?.content;

      return {
        content: typeof content === "string" ? content.trim() : "",
        inputTokens:
          typeof data.usage?.prompt_tokens === "number"
            ? data.usage.prompt_tokens
            : undefined,
        outputTokens:
          typeof data.usage?.completion_tokens === "number"
            ? data.usage.completion_tokens
            : undefined,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw providerTimeoutError(this.name);
      }

      if (
        error instanceof Error &&
        error.message.includes("timed out")
      ) {
        throw error;
      }

      throw error instanceof Error
        ? error
        : new Error("OpenAI provider request failed");
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * NoProviderConfigured is NOT a fake AI response.
 *
 * It throws, and the calling function is responsible for returning
 * a clear CONFIGURATION_REQUIRED state to the client.
 */
export class NoProviderConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured");
    this.name = "NoProviderConfiguredError";
  }
}

export function getProvider(): AIProvider {
  const providerName = Deno.env.get("AI_PROVIDER")?.trim().toLowerCase();
  const apiKey = Deno.env.get("AI_PROVIDER_API_KEY")?.trim();

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
