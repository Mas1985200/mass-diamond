// ==========================================================
// Mass Diamond — AI Provider Layer
// Production-oriented multi-provider execution layer.
//
// Supported providers:
// - OpenAI
// - Anthropic
// - Gemini
// - Groq
//
// Supported capability modes:
// - GENERAL_CHAT
// - SEARCH
// - VISION
// - IMAGE
// - VOICE
// - VIDEO
// - EDUCATION
// - TRADE
// - MARKETPLACE
// - REAL_ESTATE
// - BUSINESS
// - ADVERTISING
//
// The provider layer is responsible for model execution.
// Capability-specific business logic belongs above this layer.
// ==========================================================

import type { Capability } from "./router.ts";

/* ==========================================================
 * Types
 * ========================================================== */

export type AIProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq";

export type MessageRole =
  | "system"
  | "user"
  | "assistant";

export type TextContentPart = {
  type: "text";
  text: string;
};

export type ImageContentPart = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type AudioContentPart = {
  type: "audio_url";
  audio_url: {
    url: string;
  };
};

export type MessageContent =
  | string
  | Array<TextContentPart | ImageContentPart | AudioContentPart>;

export interface AIMessage {
  role: MessageRole;
  content: MessageContent;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderRequest {
  messages: AIMessage[];

  capability?: Capability;

  provider?: AIProvider | string | null;

  model?: string | null;

  temperature?: number;

  maxTokens?: number;

  topP?: number;

  timeoutMs?: number;

  allowFallback?: boolean;

  metadata?: Record<string, unknown>;
}

export interface ProviderResponse {
  content: string;

  provider: AIProvider;

  model: string;

  finishReason?: string | null;

  usage?: AIUsage;

  requestId?: string | null;

  raw?: unknown;
}

export interface ProviderErrorInfo {
  provider: AIProvider;

  status?: number;

  code?: string;

  retryable: boolean;

  message: string;
}

/* ==========================================================
 * Errors
 * ========================================================== */

export class AIProviderError extends Error {
  readonly provider: AIProvider;

  readonly status?: number;

  readonly code?: string;

  readonly retryable: boolean;

  constructor(info: ProviderErrorInfo) {
    super(info.message);

    this.name = "AIProviderError";

    this.provider = info.provider;
    this.status = info.status;
    this.code = info.code;
    this.retryable = info.retryable;
  }
}

/* ==========================================================
 * Configuration
 * ========================================================== */

const DEFAULT_TIMEOUT_MS = 60_000;

const DEFAULT_MAX_TOKENS = 4_096;

const DEFAULT_TEMPERATURE = 0.7;

const PROVIDER_ORDER: AIProvider[] = [
  "openai",
  "anthropic",
  "gemini",
  "groq",
];

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai:
    Deno.env.get("OPENAI_MODEL") ??
    "gpt-4.1",

  anthropic:
    Deno.env.get("ANTHROPIC_MODEL") ??
    "claude-sonnet-4-6",

  gemini:
    Deno.env.get("GEMINI_MODEL") ??
    "gemini-3.7-flash",

  groq:
    Deno.env.get("GROQ_MODEL") ??
    "openai/gpt-oss-120b",
};

const API_KEYS: Record<
  AIProvider,
  string | undefined
> = {
  openai: Deno.env.get("OPENAI_API_KEY"),

  anthropic: Deno.env.get(
    "ANTHROPIC_API_KEY",
  ),

  gemini: Deno.env.get(
    "GEMINI_API_KEY",
  ),

  groq: Deno.env.get(
    "GROQ_API_KEY",
  ),
};

/* ==========================================================
 * Provider metadata
 * ========================================================== */

export interface ProviderInfo {
  provider: AIProvider;

  available: boolean;

  defaultModel: string;

  supportsText: boolean;

  supportsVision: boolean;

  supportsImageGeneration: boolean;

  supportsAudio: boolean;

  supportsVideo: boolean;
}

export function getProviderInfo(): ProviderInfo[] {
  return [
    {
      provider: "openai",
      available: Boolean(API_KEYS.openai),
      defaultModel: DEFAULT_MODELS.openai,
      supportsText: true,
      supportsVision: true,
      supportsImageGeneration: true,
      supportsAudio: true,
      supportsVideo: true,
    },

    {
      provider: "anthropic",
      available: Boolean(API_KEYS.anthropic),
      defaultModel: DEFAULT_MODELS.anthropic,
      supportsText: true,
      supportsVision: true,
      supportsImageGeneration: false,
      supportsAudio: false,
      supportsVideo: false,
    },

    {
      provider: "gemini",
      available: Boolean(API_KEYS.gemini),
      defaultModel: DEFAULT_MODELS.gemini,
      supportsText: true,
      supportsVision: true,
      supportsImageGeneration: true,
      supportsAudio: true,
      supportsVideo: true,
    },

    {
      provider: "groq",
      available: Boolean(API_KEYS.groq),
      defaultModel: DEFAULT_MODELS.groq,
      supportsText: true,
      supportsVision: true,
      supportsImageGeneration: false,
      supportsAudio: true,
      supportsVideo: false,
    },
  ];
}

/* ==========================================================
 * Helpers
 * ========================================================== */

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

function normalizeProvider(
  value: unknown,
): AIProvider | null {
  if (
    value === "openai" ||
    value === "anthropic" ||
    value === "gemini" ||
    value === "groq"
  ) {
    return value;
  }

  return null;
}

function getApiKey(
  provider: AIProvider,
): string | undefined {
  return API_KEYS[provider];
}

function getModel(
  provider: AIProvider,
  requestedModel?: string | null,
): string {
  return (
    requestedModel?.trim() ||
    DEFAULT_MODELS[provider]
  );
}

function hasApiKey(
  provider: AIProvider,
): boolean {
  return Boolean(getApiKey(provider));
}

function isRetryableStatus(
  status: number,
): boolean {
  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status >= 500
  );
}

function sanitizeErrorMessage(
  value: unknown,
): string {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value
      .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(
        /AIza[A-Za-z0-9_-]+/g,
        "[redacted]",
      )
      .slice(0, 1_000);
  }

  return "AI provider request failed.";
}

async function readJsonSafely(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      rawText: text.slice(0, 4_000),
    };
  }
}

function getProviderErrorMessage(
  payload: unknown,
): string {
  if (!payload) {
    return "AI provider returned an empty response.";
  }

  if (
    typeof payload === "object" &&
    payload !== null
  ) {
    const object =
      payload as Record<string, unknown>;

    const error =
      object.error;

    if (
      typeof error === "object" &&
      error !== null
    ) {
      const errorObject =
        error as Record<string, unknown>;

      if (
        typeof errorObject.message ===
        "string"
      ) {
        return sanitizeErrorMessage(
          errorObject.message,
        );
      }
    }

    if (
      typeof object.message === "string"
    ) {
      return sanitizeErrorMessage(
        object.message,
      );
    }
  }

  return "AI provider request failed.";
}

/* ==========================================================
 * Timeout-safe fetch
 * ========================================================== */

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "AI provider request timed out.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* ==========================================================
 * Content helpers
 * ========================================================== */

function normalizeContentForOpenAI(
  content: MessageContent,
): unknown {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => {
    if (part.type === "text") {
      return {
        type: "text",
        text: part.text,
      };
    }

    if (part.type === "image_url") {
      return {
        type: "image_url",
        image_url: {
          url: part.image_url.url,
          ...(part.image_url.detail
            ? {
                detail:
                  part.image_url.detail,
              }
            : {}),
        },
      };
    }

    if (part.type === "audio_url") {
      return {
        type: "input_audio",
        input_audio: {
          data: part.audio_url.url,
        },
      };
    }

    return {
      type: "text",
      text: "",
    };
  });
}

function extractText(
  content: unknown,
): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          typeof part === "string"
        ) {
          return part;
        }

        if (
          part &&
          typeof part === "object"
        ) {
          const object =
            part as Record<
              string,
              unknown
            >;

          if (
            typeof object.text ===
            "string"
          ) {
            return object.text;
          }
        }

        return "";
      })
      .filter(Boolean)
      .join("");
  }

  return "";
}

/* ==========================================================
 * OpenAI-compatible providers
 * ========================================================== */

async function callOpenAICompatible(
  provider: "openai" | "groq",
  request: ProviderRequest,
): Promise<ProviderResponse> {
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    throw new AIProviderError({
      provider,
      code: "MISSING_API_KEY",
      retryable: false,
      message:
        `${provider} API key is not configured.`,
    });
  }

  const model = getModel(
    provider,
    request.model,
  );

  const endpoint =
    provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions";

  const temperature = clamp(
    request.temperature ??
      DEFAULT_TEMPERATURE,
    0,
    2,
  );

  const maxTokens = clamp(
    request.maxTokens ??
      DEFAULT_MAX_TOKENS,
    1,
    32_768,
  );

  const body = {
    model,

    messages: request.messages.map(
      (message) => ({
        role: message.role,
        content:
          normalizeContentForOpenAI(
            message.content,
          ),
      }),
    ),

    temperature,

    max_tokens: maxTokens,

    ...(typeof request.topP ===
    "number"
      ? {
          top_p: clamp(
            request.topP,
            0,
            1,
          ),
        }
      : {}),
  };

  let response: Response;

  try {
    response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
      request.timeoutMs ??
        DEFAULT_TIMEOUT_MS,
    );
  } catch (error) {
    throw new AIProviderError({
      provider,
      code: "NETWORK_ERROR",
      retryable: true,
      message:
        error instanceof Error
          ? sanitizeErrorMessage(
              error.message,
            )
          : "Network request failed.",
    });
  }

  const payload =
    await readJsonSafely(response);

  if (!response.ok) {
    throw new AIProviderError({
      provider,
      status: response.status,
      code: "PROVIDER_HTTP_ERROR",
      retryable:
        isRetryableStatus(
          response.status,
        ),
      message:
        getProviderErrorMessage(
          payload,
        ),
    });
  }

  const data =
    payload as Record<
      string,
      unknown
    >;

  const choices =
    Array.isArray(data.choices)
      ? data.choices
      : [];

  const firstChoice =
    choices[0] as
      | Record<string, unknown>
      | undefined;

  const message =
    firstChoice?.message as
      | Record<string, unknown>
      | undefined;

  const content =
    extractText(
      message?.content,
    );

  if (!content) {
    throw new AIProviderError({
      provider,
      code: "EMPTY_RESPONSE",
      retryable: true,
      message:
        "AI provider returned no usable text.",
    });
  }

  const usage =
    data.usage as
      | Record<string, unknown>
      | undefined;

  return {
    content,

    provider,

    model,

    finishReason:
      typeof firstChoice?.finish_reason ===
      "string"
        ? firstChoice.finish_reason
        : null,

    usage: usage
      ? {
          promptTokens:
            Number(
              usage.prompt_tokens ?? 0,
            ),

          completionTokens:
            Number(
              usage.completion_tokens ??
                0,
            ),

          totalTokens:
            Number(
              usage.total_tokens ?? 0,
            ),
        }
      : undefined,

    requestId:
      typeof data.id === "string"
        ? data.id
        : null,

    raw: data,
  };
}

/* ==========================================================
 * Anthropic
 * ========================================================== */

function convertForAnthropic(
  content: MessageContent,
): unknown {
  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => {
    if (part.type === "text") {
      return {
        type: "text",
        text: part.text,
      };
    }

    /*
     * Anthropic accepts base64 image sources.
     * Remote image URLs are intentionally not fetched here.
     * That belongs in the Vision/media layer.
     */
    if (
      part.type === "image_url" &&
      part.image_url.url.startsWith(
        "data:",
      )
    ) {
      const match =
        part.image_url.url.match(
          /^data:([^;]+);base64,(.+)$/,
        );

      if (match) {
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: match[1],
            data: match[2],
          },
        };
      }
    }

    return {
      type: "text",
      text:
        "[Unsupported media content]",
    };
  });
}

async function callAnthropic(
  request: ProviderRequest,
): Promise<ProviderResponse> {
  const provider: AIProvider =
    "anthropic";

  const apiKey =
    getApiKey(provider);

  if (!apiKey) {
    throw new AIProviderError({
      provider,
      code: "MISSING_API_KEY",
      retryable: false,
      message:
        "Anthropic API key is not configured.",
    });
  }

  const model = getModel(
    provider,
    request.model,
  );

  const systemMessages =
    request.messages
      .filter(
        (message) =>
          message.role === "system",
      )
      .map((message) =>
        extractText(message.content),
      )
      .filter(Boolean);

  const messages =
    request.messages
      .filter(
        (message) =>
          message.role !== "system",
      )
      .map((message) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",

        content:
          convertForAnthropic(
            message.content,
          ),
      }));

  const body = {
    model,

    max_tokens: clamp(
      request.maxTokens ??
        DEFAULT_MAX_TOKENS,
      1,
      32_768,
    ),

    ...(systemMessages.length
      ? {
          system:
            systemMessages.join(
              "\n\n",
            ),
        }
      : {}),

    messages,

    ...(typeof request.temperature ===
    "number"
      ? {
          temperature: clamp(
            request.temperature,
            0,
            1,
          ),
        }
      : {}),
  };

  let response: Response;

  try {
    response = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",

          "x-api-key": apiKey,

          "anthropic-version":
            "2023-06-01",
        },

        body: JSON.stringify(body),
      },
      request.timeoutMs ??
        DEFAULT_TIMEOUT_MS,
    );
  } catch (error) {
    throw new AIProviderError({
      provider,
      code: "NETWORK_ERROR",
      retryable: true,
      message:
        error instanceof Error
          ? sanitizeErrorMessage(
              error.message,
            )
          : "Network request failed.",
    });
  }

  const payload =
    await readJsonSafely(response);

  if (!response.ok) {
    throw new AIProviderError({
      provider,
      status: response.status,
      code: "PROVIDER_HTTP_ERROR",
      retryable:
        isRetryableStatus(
          response.status,
        ),
      message:
        getProviderErrorMessage(
          payload,
        ),
    });
  }

  const data =
    payload as Record<
      string,
      unknown
    >;

  const contentBlocks =
    Array.isArray(data.content)
      ? data.content
      : [];

  const content =
    contentBlocks
      .map((block) => {
        if (
          block &&
          typeof block === "object"
        ) {
          const item =
            block as Record<
              string,
              unknown
            >;

          return typeof item.text ===
            "string"
            ? item.text
            : "";
        }

        return "";
      })
      .filter(Boolean)
      .join("");

  if (!content) {
    throw new AIProviderError({
      provider,
      code: "EMPTY_RESPONSE",
      retryable: true,
      message:
        "Anthropic returned no usable text.",
    });
  }

  const usage =
    data.usage as
      | Record<string, unknown>
      | undefined;

  return {
    content,

    provider,

    model,

    finishReason:
      typeof data.stop_reason ===
      "string"
        ? data.stop_reason
        : null,

    usage: usage
      ? {
          promptTokens:
            Number(
              usage.input_tokens ?? 0,
            ),

          completionTokens:
            Number(
              usage.output_tokens ?? 0,
            ),

          totalTokens:
            Number(
              Number(
                usage.input_tokens ?? 0,
              ) +
                Number(
                  usage.output_tokens ??
                    0,
                ),
            ),
        }
      : undefined,

    requestId:
      typeof data.id === "string"
        ? data.id
        : null,

    raw: data,
  };
}

/* ==========================================================
 * Gemini
 * ========================================================== */

function dataUrlToGeminiPart(
  url: string,
): Record<string, unknown> | null {
  const match =
    url.match(
      /^data:([^;]+);base64,(.+)$/,
    );

  if (!match) {
    return null;
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

function convertForGemini(
  content: MessageContent,
): Array<Record<string, unknown>> {
  if (typeof content === "string") {
    return [
      {
        text: content,
      },
    ];
  }

  return content
    .map((part) => {
      if (part.type === "text") {
        return {
          text: part.text,
        };
      }

      if (
        part.type === "image_url"
      ) {
        const image =
          dataUrlToGeminiPart(
            part.image_url.url,
          );

        return (
          image ?? {
            text:
              "[Image URL requires media processing]",
          }
        );
      }

      return {
        text:
          "[Audio requires audio processing]",
      };
    });
}

async function callGemini(
  request: ProviderRequest,
): Promise<ProviderResponse> {
  const provider: AIProvider =
    "gemini";

  const apiKey =
    getApiKey(provider);

  if (!apiKey) {
    throw new AIProviderError({
      provider,
      code: "MISSING_API_KEY",
      retryable: false,
      message:
        "Gemini API key is not configured.",
    });
  }

  const model = getModel(
    provider,
    request.model,
  );

  const systemMessages =
    request.messages
      .filter(
        (message) =>
          message.role === "system",
      )
      .map((message) =>
        extractText(message.content),
      )
      .filter(Boolean);

  const contents =
    request.messages
      .filter(
        (message) =>
          message.role !== "system",
      )
      .map((message) => ({
        role:
          message.role === "assistant"
            ? "model"
            : "user",

        parts:
          convertForGemini(
            message.content,
          ),
      }));

  const body = {
    ...(systemMessages.length
      ? {
          systemInstruction: {
            parts: [
              {
                text:
                  systemMessages.join(
                    "\n\n",
                  ),
              },
            ],
          },
        }
      : {}),

    contents,

    generationConfig: {
      maxOutputTokens: clamp(
        request.maxTokens ??
          DEFAULT_MAX_TOKENS,
        1,
        32_768,
      ),

      ...(typeof request.temperature ===
      "number"
        ? {
            temperature: clamp(
              request.temperature,
              0,
              2,
            ),
          }
        : {}),

      ...(typeof request.topP ===
      "number"
        ? {
            topP: clamp(
              request.topP,
              0,
              1,
            ),
          }
        : {}),
    },
  };

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`;

  let response: Response;

  try {
    response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(body),
      },
      request.timeoutMs ??
        DEFAULT_TIMEOUT_MS,
    );
  } catch (error) {
    throw new AIProviderError({
      provider,
      code: "NETWORK_ERROR",
      retryable: true,
      message:
        error instanceof Error
          ? sanitizeErrorMessage(
              error.message,
            )
          : "Network request failed.",
    });
  }

  const payload =
    await readJsonSafely(response);

  if (!response.ok) {
    throw new AIProviderError({
      provider,
      status: response.status,
      code: "PROVIDER_HTTP_ERROR",
      retryable:
        isRetryableStatus(
          response.status,
        ),
      message:
        getProviderErrorMessage(
          payload,
        ),
    });
  }

  const data =
    payload as Record<
      string,
      unknown
    >;

  const candidates =
    Array.isArray(
      data.candidates,
    )
      ? data.candidates
      : [];

  const firstCandidate =
    candidates[0] as
      | Record<string, unknown>
      | undefined;

  const candidateContent =
    firstCandidate?.content as
      | Record<string, unknown>
      | undefined;

  const parts =
    Array.isArray(
      candidateContent?.parts,
    )
      ? candidateContent.parts
      : [];

  const content =
    parts
      .map((part) => {
        if (
          part &&
          typeof part === "object"
        ) {
          const item =
            part as Record<
              string,
              unknown
            >;

          return typeof item.text ===
            "string"
            ? item.text
            : "";
        }

        return "";
      })
      .filter(Boolean)
      .join("");

  if (!content) {
    throw new AIProviderError({
      provider,
      code: "EMPTY_RESPONSE",
      retryable: true,
      message:
        "Gemini returned no usable text.",
    });
  }

  const usage =
    data.usageMetadata as
      | Record<string, unknown>
      | undefined;

  return {
    content,

    provider,

    model,

    finishReason:
      typeof firstCandidate?.finishReason ===
      "string"
        ? firstCandidate.finishReason
        : null,

    usage: usage
      ? {
          promptTokens:
            Number(
              usage.promptTokenCount ??
                0,
            ),

          completionTokens:
            Number(
              usage.candidatesTokenCount ??
                0,
            ),

          totalTokens:
            Number(
              usage.totalTokenCount ?? 0,
            ),
        }
      : undefined,

    requestId: null,

    raw: data,
  };
}

/* ==========================================================
 * Capability-aware provider ordering
 * ========================================================== */

function getPreferredProviders(
  capability?: Capability,
  requestedProvider?: string | null,
): AIProvider[] {
  const explicit =
    normalizeProvider(
      requestedProvider,
    );

  const ordered =
    [...PROVIDER_ORDER];

  if (explicit) {
    return [
      explicit,
      ...ordered.filter(
        (provider) =>
          provider !== explicit,
      ),
    ];
  }

  /*
   * Capability-aware ordering.
   *
   * This does not lock Mass Diamond to a single provider.
   * It simply prefers providers with suitable capabilities.
   */

  switch (capability) {
    case "VISION":
      return [
        "openai",
        "gemini",
        "anthropic",
        "groq",
      ];

    case "IMAGE":
      return [
        "openai",
        "gemini",
        "anthropic",
        "groq",
      ];

    case "VOICE":
      return [
        "openai",
        "gemini",
        "groq",
        "anthropic",
      ];

    case "VIDEO":
      return [
        "openai",
        "gemini",
        "anthropic",
        "groq",
      ];

    case "SEARCH":
    case "EDUCATION":
    case "TRADE":
    case "MARKETPLACE":
    case "REAL_ESTATE":
    case "BUSINESS":
    case "ADVERTISING":
    case "GENERAL_CHAT":
    default:
      return ordered;
  }
}

/* ==========================================================
 * Provider execution
 * ========================================================== */

async function executeProvider(
  provider: AIProvider,
  request: ProviderRequest,
): Promise<ProviderResponse> {
  switch (provider) {
    case "openai":
    case "groq":
      return callOpenAICompatible(
        provider,
        request,
      );

    case "anthropic":
      return callAnthropic(request);

    case "gemini":
      return callGemini(request);
  }
}

/* ==========================================================
 * Public AI execution API
 * ========================================================== */

export async function generateAIResponse(
  request: ProviderRequest,
): Promise<ProviderResponse> {
  validateProviderRequest(request);

  const providers =
    getPreferredProviders(
      request.capability,
      request.provider,
    );

  const allowFallback =
    request.allowFallback !== false;

  let lastError:
    | AIProviderError
    | null = null;

  for (
    let index = 0;
    index < providers.length;
    index += 1
  ) {
    const provider =
      providers[index];

    /*
     * Skip providers that are not configured.
     */
    if (!hasApiKey(provider)) {
      continue;
    }

    try {
      return await executeProvider(
        provider,
        request,
      );
    } catch (error) {
      const providerError =
        error instanceof
        AIProviderError
          ? error
          : new AIProviderError({
              provider,
              code:
                "UNKNOWN_PROVIDER_ERROR",
              retryable: true,
              message:
                error instanceof Error
                  ? sanitizeErrorMessage(
                      error.message,
                    )
                  : "Unknown AI provider error.",
            });

      lastError = providerError;

      /*
       * Explicitly requested provider + fallback disabled:
       * stop immediately.
       */
      if (
        !allowFallback ||
        !providerError.retryable
      ) {
        break;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new AIProviderError({
    provider:
      normalizeProvider(
        request.provider,
      ) ?? "openai",

    code:
      "NO_PROVIDER_AVAILABLE",

    retryable: false,

    message:
      "No configured AI provider is available.",
  });
}

/* ==========================================================
 * Validation
 * ========================================================== */

function validateProviderRequest(
  request: ProviderRequest,
): void {
  if (
    !request ||
    !Array.isArray(
      request.messages,
    ) ||
    request.messages.length === 0
  ) {
    throw new AIProviderError({
      provider:
        normalizeProvider(
          request?.provider,
        ) ?? "openai",

      code:
        "INVALID_REQUEST",

      retryable: false,

      message:
        "At least one AI message is required.",
    });
  }

  for (const message of request.messages) {
    if (
      !message ||
      !(
        message.role === "system" ||
        message.role === "user" ||
        message.role === "assistant"
      )
    ) {
      throw new AIProviderError({
        provider:
          normalizeProvider(
            request.provider,
          ) ?? "openai",

        code:
          "INVALID_MESSAGE",

        retryable: false,

        message:
          "Invalid AI message role.",
      });
    }

    if (
      typeof message.content !==
        "string" &&
      !Array.isArray(
        message.content,
      )
    ) {
      throw new AIProviderError({
        provider:
          normalizeProvider(
            request.provider,
          ) ?? "openai",

        code:
          "INVALID_CONTENT",

        retryable: false,

        message:
          "Invalid AI message content.",
      });
    }
  }
}

/* ==========================================================
 * Compatibility aliases
 * ========================================================== */

export const callAIProvider =
  generateAIResponse;

export const generateText =
  generateAIResponse;

/**
 * Simple provider availability helper.
 */
export function isProviderAvailable(
  provider: AIProvider,
): boolean {
  return hasApiKey(provider);
}

/**
 * Returns providers that currently have
 * API credentials configured.
 */
export function getAvailableProviders(): AIProvider[] {
  return PROVIDER_ORDER.filter(
    hasApiKey,
  );
}
