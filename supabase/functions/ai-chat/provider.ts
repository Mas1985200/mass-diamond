const PROVIDER_TIMEOUT_MS = 25_000;
const MAX_PROVIDER_ERROR_LENGTH = 500;

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

export class NoProviderConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured");
    this.name = "NoProviderConfiguredError";
  }
}

export class ProviderTimeoutError extends Error {
  constructor(providerName: string) {
    super(`${providerName} provider request timed out`);
    this.name = "ProviderTimeoutError";
  }
}

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

function providerTimeoutError(
  providerName: string,
): ProviderTimeoutError {
  return new ProviderTimeoutError(providerName);
}

function sanitizeProviderError(
  status: number,
  body: string,
): string {
  const normalized = body
    .replace(
      /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
      "Bearer [redacted]",
    )
    .replace(
      /\b(?:sk|gsk)_[A-Za-z0-9_-]+\b/g,
      "[redacted-key]",
    )
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PROVIDER_ERROR_LENGTH);

  return normalized
    ? `Provider request failed (${status}): ${normalized}`
    : `Provider request failed (${status})`;
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
    const systemMessage = messages.find(
      (message) => message.role === "system",
    );

    const conversationMessages = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));

    const { controller, timeoutId } =
      createTimeoutController(PROVIDER_TIMEOUT_MS);

    try {
      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            ...(systemMessage
              ? { system: systemMessage.content }
              : {}),
            messages: conversationMessages,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();

        throw new Error(
          sanitizeProviderError(
            response.status,
            body,
          ),
        );
      }

      const data = await response.json();

      const contentBlocks: unknown[] =
        Array.isArray(data.content)
          ? data.content
          : [];

      const textBlocks = contentBlocks
        .filter(
          (
            block: unknown,
          ): block is {
            type: string;
            text?: unknown;
          } =>
            typeof block === "object" &&
            block !== null &&
            !Array.isArray(block) &&
            "type" in block,
        )
        .filter(
          (block: {
            type: string;
            text?: unknown;
          }) => block.type === "text",
        );

      const content = textBlocks
        .map((block) =>
          typeof block.text === "string"
            ? block.text
            : "",
        )
        .filter(Boolean)
        .join("\n");

      if (!content) {
        throw new Error(
          "Anthropic provider returned an empty completion",
        );
      }

      return {
        content,
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
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw providerTimeoutError(this.name);
      }

      throw error;
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
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1",
            messages,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();

        throw new Error(
          sanitizeProviderError(
            response.status,
            body,
          ),
        );
      }

      const data = await response.json();

      const content =
        typeof data.choices?.[0]?.message?.content ===
        "string"
          ? data.choices[0].message.content
          : "";

      if (!content) {
        throw new Error(
          "OpenAI provider returned an empty completion",
        );
      }

      return {
        content,
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
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw providerTimeoutError(this.name);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

class GroqProvider implements AIProvider {
  name = "groq";

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
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();

        throw new Error(
          sanitizeProviderError(
            response.status,
            body,
          ),
        );
      }

      const data = await response.json();

      const content =
        typeof data.choices?.[0]?.message?.content ===
        "string"
          ? data.choices[0].message.content
          : "";

      if (!content) {
        throw new Error(
          "Groq provider returned an empty completion",
        );
      }

      return {
        content,
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
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw providerTimeoutError(this.name);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function getProvider(): AIProvider {
  const providerName = Deno.env
    .get("AI_PROVIDER")
    ?.trim()
    .toLowerCase();

  const apiKey = Deno.env
    .get("AI_PROVIDER_API_KEY")
    ?.trim();

  if (
    !providerName ||
    providerName === "none" ||
    !apiKey
  ) {
    throw new NoProviderConfiguredError();
  }

  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider(apiKey);

    case "openai":
      return new OpenAIProvider(apiKey);

    case "groq":
      return new GroqProvider(apiKey);

    default:
      throw new Error(
        `Unknown AI_PROVIDER: ${providerName}`,
      );
  }
}
