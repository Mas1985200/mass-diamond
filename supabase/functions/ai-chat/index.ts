// ==========================================================
// Mass Diamond — AI Chat Edge Function
// Central orchestration layer
//
// Responsibilities:
// - Request validation
// - Authentication-aware execution
// - Capability routing
// - Provider execution
// - Search/media capability preparation
// - Conversation persistence
// - Message persistence
// - Usage metadata
// - Safe error handling
// ==========================================================

import {
  normalizeRouterInput,
  routeRequest,
  type Capability,
  type RouterAttachment,
  type RouterMessage,
} from "./router.ts";

import {
  generateAIResponse,
  type AIMessage,
  type ProviderResponse,
  type AIProvider,
} from "./provider.ts";

import {
  createPersistenceClient,
  getOrCreateConversation,
  persistMessage,
} from "./persistence.ts";

/* ==========================================================
 * Environment
 * ========================================================== */

const TAVILY_API_KEY =
  Deno.env.get("TAVILY_API_KEY") ?? "";

const DEFAULT_MAX_MESSAGE_LENGTH = 50_000;
const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 50;

/* ==========================================================
 * CORS
 * ========================================================== */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
  "Content-Type":
    "application/json; charset=utf-8",
};

/* ==========================================================
 * Request types
 * ========================================================== */

interface ChatRequest {
  message?: unknown;
  messages?: unknown;
  capability?: unknown;
  provider?: unknown;
  model?: unknown;
  language?: unknown;
  attachments?: unknown;
  conversationId?: unknown;
  sessionId?: unknown;
  userId?: unknown;
  temperature?: unknown;
  maxTokens?: unknown;
  topP?: unknown;
  allowFallback?: unknown;
  useWebSearch?: unknown;
  metadata?: unknown;
}

interface NormalizedChatRequest {
  message: string;
  messages: AIMessage[];
  capability?: string | null;
  provider?: AIProvider | string | null;
  model?: string | null;
  language?: string | null;
  attachments: RouterAttachment[];
  conversationId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  allowFallback: boolean;
  useWebSearch: boolean;
  metadata?: Record<string, unknown>;
}

/* ==========================================================
 * Response types
 * ========================================================== */

interface ChatResponse {
  success: true;
  content: string;
  capability: Capability;
  language: string;
  provider: AIProvider;
  model: string;
  conversationId?: string | null;
  requestId?: string | null;
  usage?: ProviderResponse["usage"];
  search?: SearchResult;
  meta: {
    fallbackUsed: boolean;
    persistenceEnabled: boolean;
    timestamp: string;
  };
}

/* ==========================================================
 * Search types
 * ========================================================== */

interface SearchResult {
  query: string;
  answer?: string;
  results: SearchItem[];
  provider: "tavily";
}

interface SearchItem {
  title: string;
  url: string;
  content?: string;
  score?: number;
}

/* ==========================================================
 * Utilities
 * ========================================================== */

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: corsHeaders,
    },
  );
}

function errorResponse(
  message: string,
  status = 400,
  code = "BAD_REQUEST",
): Response {
  return jsonResponse(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    status,
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function stringValue(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function booleanValue(
  value: unknown,
  fallback: boolean,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function numberValue(
  value: unknown,
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  return value;
}

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

function sanitizeMessage(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKC")
    .slice(
      0,
      DEFAULT_MAX_MESSAGE_LENGTH,
    )
    .trim();
}

function safeMetadata(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return value;
}

/* ==========================================================
 * Request parsing
 * ========================================================== */

async function parseRequest(
  request: Request,
): Promise<NormalizedChatRequest> {
  let body: ChatRequest;

  try {
    body =
      (await request.json()) as ChatRequest;
  } catch {
    throw new RequestError(
      "Request body must be valid JSON.",
      "INVALID_JSON",
    );
  }

  const message =
    sanitizeMessage(
      body.message,
    );

  const rawMessages =
    Array.isArray(body.messages)
      ? body.messages
      : [];

  const messages =
    normalizeMessages(
      rawMessages,
    );

  /*
   * If a direct message was supplied, append it as
   * the latest user message unless it is already present.
   */

  if (
    message &&
    (
      messages.length === 0 ||
      messages[messages.length - 1]
        ?.content !== message
    )
  ) {
    messages.push({
      role: "user",
      content: message,
    });
  }

  if (messages.length === 0) {
    throw new RequestError(
      "A message is required.",
      "EMPTY_MESSAGE",
    );
  }

  const attachments =
    normalizeAttachments(
      body.attachments,
    );

  const temperature =
    numberValue(
      body.temperature,
    );

  const maxTokens =
    numberValue(
      body.maxTokens,
    );

  const topP =
    numberValue(
      body.topP,
    );

  return {
    message:
      message ||
      extractLatestUserMessage(
        messages,
      ),

    messages,

    capability:
      stringValue(
        body.capability,
      ),

    provider:
      stringValue(
        body.provider,
      ),

    model:
      stringValue(
        body.model,
      ),

    language:
      stringValue(
        body.language,
      ),

    attachments,

    conversationId:
      stringValue(
        body.conversationId,
      ),

    sessionId:
      stringValue(
        body.sessionId,
      ),

    userId:
      stringValue(
        body.userId,
      ),

    temperature:
      temperature === undefined
        ? undefined
        : clamp(
            temperature,
            0,
            2,
          ),

    maxTokens:
      maxTokens === undefined
        ? undefined
        : clamp(
            Math.floor(
              maxTokens,
            ),
            1,
            32_768,
          ),

    topP:
      topP === undefined
        ? undefined
        : clamp(
            topP,
            0,
            1,
          ),

    allowFallback:
      booleanValue(
        body.allowFallback,
        true,
      ),

    useWebSearch:
      booleanValue(
        body.useWebSearch,
        false,
      ),

    metadata:
      safeMetadata(
        body.metadata,
      ),
  };
}

function normalizeMessages(
  value: unknown[],
): AIMessage[] {
  return value
    .filter(isRecord)
    .map((message) => {
      const role =
        message.role;

      const content =
        message.content;

      if (
        role !== "system" &&
        role !== "user" &&
        role !== "assistant"
      ) {
        return null;
      }

      if (
        typeof content === "string"
      ) {
        return {
          role,
          content:
            content.slice(
              0,
              DEFAULT_MAX_MESSAGE_LENGTH,
            ),
        };
      }

      if (
        Array.isArray(content)
      ) {
        const parts =
          content
            .filter(isRecord)
            .map((part) => {
              if (
                part.type ===
                  "text" &&
                typeof part.text ===
                  "string"
              ) {
                return {
                  type: "text" as const,
                  text:
                    part.text.slice(
                      0,
                      DEFAULT_MAX_MESSAGE_LENGTH,
                    ),
                };
              }

              if (
                part.type ===
                  "image_url" &&
                isRecord(
                  part.image_url,
                ) &&
                typeof
                  part.image_url.url ===
                  "string"
              ) {
                return {
                  type:
                    "image_url" as const,

                  image_url: {
                    url:
                      part.image_url
                        .url,

                    detail:
                      part.image_url
                        .detail ===
                      "low" ||
                      part.image_url
                        .detail ===
                      "high" ||
                      part.image_url
                        .detail ===
                      "auto"
                        ? part.image_url
                            .detail
                        : "auto",
                  },
                };
              }

              return null;
            })
            .filter(
              (
                part,
              ): part is NonNullable<
                typeof part
              > =>
                part !== null,
            );

        if (parts.length) {
          return {
            role,
            content: parts,
          };
        }
      }

      return null;
    })
    .filter(
      (
        message,
      ): message is AIMessage =>
        message !== null,
    )
    .slice(
      -MAX_HISTORY_LIMIT,
    );
}

function normalizeAttachments(
  value: unknown,
): RouterAttachment[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((attachment) => {
      const type =
        attachment.type;

      const normalizedType =
        type === "image" ||
        type === "audio" ||
        type === "video" ||
        type === "file" ||
        type === "document"
          ? type
          : "unknown";

      return {
        type:
          normalizedType,

        mimeType:
          stringValue(
            attachment.mimeType,
          ),

        name:
          stringValue(
            attachment.name,
          ),

        url:
          stringValue(
            attachment.url,
          ),
      };
    })
    .slice(0, 10);
}

function extractLatestUserMessage(
  messages: AIMessage[],
): string {
  for (
    let index =
      messages.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (
      messages[index].role ===
      "user"
    ) {
      return extractText(
        messages[index].content,
      );
    }
  }

  return "";
}

function extractText(
  content: AIMessage["content"],
): string {
  if (
    typeof content ===
    "string"
  ) {
    return content;
  }

  return content
    .map((part) =>
      part.type === "text"
        ? part.text
        : "",
    )
    .filter(Boolean)
    .join("\n");
}

/* ==========================================================
 * Router integration
 * ========================================================== */

function createRouterMessages(
  messages: AIMessage[],
): RouterMessage[] {
  return messages.map(
    (message) => ({
      role: message.role,
      content:
        extractText(
          message.content,
        ),
    }),
  );
}

/* ==========================================================
 * System instructions
 * ========================================================== */

function getCapabilitySystemPrompt(
  capability: Capability,
): string {
  switch (capability) {
    case "SEARCH":
      return `
You are Mass Diamond Search.
When current or external information is required, use the available search layer.
Clearly distinguish verified information from assumptions.
Do not invent sources, prices, availability, locations or current events.
`.trim();

    case "VISION":
      return `
You are Mass Diamond Vision.
Analyze visual content carefully.
Describe only what can reasonably be determined from the supplied media.
If something cannot be identified reliably, say so.
`.trim();

    case "IMAGE":
      return `
You are Mass Diamond Image.
Help create, edit, transform and plan professional visual content.
For actual image generation or editing, return a clear structured instruction for the image execution layer.
`.trim();

    case "VOICE":
      return `
You are Mass Diamond Voice.
Handle speech, transcription, spoken responses and audio workflows.
Preserve the user's intended language and meaning.
`.trim();

    case "VIDEO":
      return `
You are Mass Diamond Video.
Handle video understanding, creation planning, editing instructions and video workflows.
For actual rendering, delegate to the video execution layer.
`.trim();

    case "EDUCATION":
      return `
You are Mass Diamond Education.
Teach clearly and progressively.
Adapt explanations to the learner's level and language.
Prefer structured lessons, examples, exercises and checks for understanding.
`.trim();

    case "TRADE":
      return `
You are Mass Diamond Global Trade.
Help with international trade, suppliers, manufacturers, products, import/export workflows and market research.
Do not invent supplier identities, prices, certifications or availability.
Separate verified data from estimates.
`.trim();

    case "MARKETPLACE":
      return `
You are Mass Diamond Marketplace.
Help users discover, compare, buy, sell and manage products and listings.
Never fabricate product availability, seller information, pricing or reviews.
`.trim();

    case "REAL_ESTATE":
      return `
You are Mass Diamond Real Estate.
Help users search, compare and understand property information.
Do not fabricate listings, prices, addresses, ownership information or availability.
`.trim();

    case "BUSINESS":
      return `
You are Mass Diamond Business.
Help users discover, understand and interact with businesses and local services.
Use verified external information when current business information is requested.
`.trim();

    case "ADVERTISING":
      return `
You are Mass Diamond Advertising.
Create professional advertising concepts, copy, campaign structures, SEO content and media plans.
Do not claim an advertisement has been published or submitted unless the publishing layer actually confirms it.
`.trim();

    case "GENERAL_CHAT":
    default:
      return `
You are Mass Diamond, a multilingual AI assistant.
Be accurate, useful, clear and direct.
Use the user's language naturally.
Do not invent facts, sources, actions or completed operations.
`.trim();
  }
}

/* ==========================================================
 * Search
 * ========================================================== */

async function performWebSearch(
  query: string,
): Promise<SearchResult | null> {
  if (!TAVILY_API_KEY) {
    return null;
  }

  if (!query.trim()) {
    return null;
  }

  try {
    const response =
      await fetch(
        "https://api.tavily.com/search",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            api_key:
              TAVILY_API_KEY,

            query:
              query.slice(
                0,
                4_000,
              ),

            search_depth:
              "advanced",

            include_answer:
              true,

            include_raw_content:
              false,

            max_results: 8,
          }),
        },
      );

    if (!response.ok) {
      return null;
    }

    const data =
      (await response.json()) as Record<
        string,
        unknown
      >;

    const rawResults =
      Array.isArray(
        data.results,
      )
        ? data.results
        : [];

    const results =
      rawResults
        .filter(isRecord)
        .map((result) => ({
          title:
            typeof result.title ===
            "string"
              ? result.title
              : "",

          url:
            typeof result.url ===
            "string"
              ? result.url
              : "",

          content:
            typeof result.content ===
            "string"
              ? result.content
              : undefined,

          score:
            typeof result.score ===
            "number"
              ? result.score
              : undefined,
        }))
        .filter(
          (result) =>
            Boolean(
              result.title &&
              result.url,
            ),
        );

    return {
      query,

      answer:
        typeof data.answer ===
        "string"
          ? data.answer
          : undefined,

      results,

      provider: "tavily",
    };
  } catch {
    return null;
  }
}

/* ==========================================================
 * Search context
 * ========================================================== */

function buildSearchContext(
  search: SearchResult,
): string {
  const sources =
    search.results
      .slice(0, 8)
      .map(
        (
          result,
          index,
        ) =>
          `[Source ${index + 1}]
Title: ${result.title}
URL: ${result.url}
Content: ${result.content ?? ""}
`,
      )
      .join("\n");

  return `
WEB SEARCH RESULTS

Query:
${search.query}

Search answer:
${search.answer ?? ""}

${sources}

Use these results as external evidence.
Do not invent information that is not supported by the results.
When referencing information from a result, preserve the source URL in the final structured response metadata when possible.
`.trim();
}

/* ==========================================================
 * Capability-specific preparation
 * ========================================================== */

async function prepareCapabilityContext(
  request: NormalizedChatRequest,
  capability: Capability,
): Promise<{
  messages: AIMessage[];
  search?: SearchResult;
}> {
  let messages =
    [...request.messages];

  let search:
    | SearchResult
    | undefined;

  const shouldSearch =
    capability === "SEARCH" ||
    request.useWebSearch;

  if (shouldSearch) {
    search =
      (await performWebSearch(
        request.message,
      )) ??
      undefined;

    if (search) {
      messages = [
        {
          role: "system",
          content:
            buildSearchContext(
              search,
            ),
        },

        ...messages,
      ];
    }
  }

  messages = [
    {
      role: "system",
      content:
        getCapabilitySystemPrompt(
          capability,
        ),
    },

    ...messages,
  ];

  return {
    messages,
    search,
  };
}

/* ==========================================================
 * Persistence
 * ========================================================== */

async function persistChatExchange(
  request: NormalizedChatRequest,
  capability: Capability,
  language: string,
  result: ProviderResponse,
  authorizationHeader: string | null,
): Promise<{
  conversationId: string | null;
  enabled: boolean;
}> {
  /*
   * Persistence requires a user identity.
   * Anonymous AI requests remain supported.
   */
  if (!request.userId) {
    return {
      conversationId:
        request.conversationId ??
        null,
      enabled: false,
    };
  }

  try {
    const client =
      createPersistenceClient(
        authorizationHeader,
      );

    const conversation =
      await getOrCreateConversation(
        client,
        {
          userId:
            request.userId,

          conversationId:
            request.conversationId,

          title:
            request.message
              .slice(0, 120) ||
            null,

          language,

          capability,

          metadata:
            request.metadata ??
            {},
        },
      );

    if (
      conversation.error ||
      !conversation.data
    ) {
      console.error(
        "[Mass Diamond] Conversation persistence failed:",
        conversation.error?.message ??
          "Unknown error",
      );

      return {
        conversationId:
          request.conversationId ??
          null,
        enabled: false,
      };
    }

    const conversationId =
      conversation.data.id;

    /*
     * Persist the latest user message.
     */
    const userMessage =
      await persistMessage(
        client,
        {
          conversationId,
          userId:
            request.userId,
          role: "user",
          content:
            request.message,
          capability,
          language,
          requestId:
            result.requestId ??
            null,
          attachments:
            request.attachments,
          metadata:
            request.metadata ??
            {},
        },
      );

    if (userMessage.error) {
      console.error(
        "[Mass Diamond] User message persistence failed:",
        userMessage.error.message,
      );
    }

    /*
     * Persist the AI response.
     */
    const assistantMessage =
      await persistMessage(
        client,
        {
          conversationId,
          userId:
            request.userId,
          role: "assistant",
          content:
            result.content,
          capability,
          provider:
            result.provider,
          model:
            result.model,
          language,
          requestId:
            result.requestId ??
            null,
          metadata:
            request.metadata ??
            {},
          promptTokens:
            result.usage?.promptTokens ??
            null,
          completionTokens:
            result.usage
              ?.completionTokens ??
            null,
          totalTokens:
            result.usage?.totalTokens ??
            null,
        },
      );

    if (assistantMessage.error) {
      console.error(
        "[Mass Diamond] Assistant message persistence failed:",
        assistantMessage.error.message,
      );
    }

    return {
      conversationId,
      enabled:
        !userMessage.error &&
        !assistantMessage.error,
    };
  } catch (error) {
    console.error(
      "[Mass Diamond] Persistence error:",
      error instanceof Error
        ? error.message
        : "Unknown persistence error",
    );

    return {
      conversationId:
        request.conversationId ??
        null,
      enabled: false,
    };
  }
}

/* ==========================================================
 * Main execution
 * ========================================================== */

async function handleChat(
  request: NormalizedChatRequest,
  authorizationHeader: string | null,
): Promise<ChatResponse> {
  const normalizedRouterInput =
    normalizeRouterInput({
      message:
        request.message,

      capability:
        request.capability,

      language:
        request.language,

      attachments:
        request.attachments,

      previousMessages:
        createRouterMessages(
          request.messages,
        ),

      metadata:
        request.metadata,
    });

  const routing =
    routeRequest(
      normalizedRouterInput,
    );

  const capability =
    routing.capability;

  const language =
    routing.language;

  const prepared =
    await prepareCapabilityContext(
      request,
      capability,
    );

  const result =
    await generateAIResponse({
      messages:
        prepared.messages,

      capability,

      provider:
        request.provider,

      model:
        request.model,

      temperature:
        request.temperature,

      maxTokens:
        request.maxTokens,

      topP:
        request.topP,

      allowFallback:
        request.allowFallback,

      metadata:
        request.metadata,
    });

  const requestedProvider =
    stringValue(
      request.provider,
    );

  const fallbackUsed =
    Boolean(
      requestedProvider &&
      requestedProvider !==
        result.provider,
    );

  /*
   * Persistence happens only after the AI response
   * has successfully completed.
   *
   * Persistence failure never destroys a valid AI response.
   */
  const persistence =
    await persistChatExchange(
      request,
      capability,
      language,
      result,
      authorizationHeader,
    );

  return {
    success: true,

    content:
      result.content,

    capability,

    language,

    provider:
      result.provider,

    model:
      result.model,

    conversationId:
      persistence.conversationId,

    requestId:
      result.requestId,

    usage:
      result.usage,

    search:
      prepared.search,

    meta: {
      fallbackUsed,

      persistenceEnabled:
        persistence.enabled,

      timestamp:
        new Date().toISOString(),
    },
  };
}

/* ==========================================================
 * Authentication
 * ========================================================== */

function extractBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers.get(
      "Authorization",
    );

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i,
    );

  return match?.[1] ?? null;
}

/* ==========================================================
 * Request error
 * ========================================================== */

class RequestError extends Error {
  readonly code: string;

  constructor(
    message: string,
    code: string,
  ) {
    super(message);

    this.name =
      "RequestError";

    this.code = code;
  }
}

/* ==========================================================
 * HTTP handler
 * ========================================================== */

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders,
        },
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return errorResponse(
        "Only POST requests are supported.",
        405,
        "METHOD_NOT_ALLOWED",
      );
    }

    const authorizationHeader =
      request.headers.get(
        "Authorization",
      );

    try {
      const parsed =
        await parseRequest(
          request,
        );

      const response =
        await handleChat(
          parsed,
          authorizationHeader,
        );

      return jsonResponse(
        response,
        200,
      );
    } catch (error) {
      if (
        error instanceof
        RequestError
      ) {
        return errorResponse(
          error.message,
          400,
          error.code,
        );
      }

      /*
       * Never expose provider internals,
       * API keys or upstream response bodies.
       */

      console.error(
        "[Mass Diamond] ai-chat error:",
        error instanceof Error
          ? error.message
          : "Unknown error",
      );

      return errorResponse(
        "Mass Diamond could not complete the request.",
        500,
        "AI_EXECUTION_ERROR",
      );
    }
  },
);
