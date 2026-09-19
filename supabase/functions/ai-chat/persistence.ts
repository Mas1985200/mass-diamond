import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

export interface PersistConversationInput {
  userId: string;
  conversationId?: string | null;
  title?: string | null;
  language?: string | null;
  capability?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PersistMessageInput {
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  capability?: string | null;
  provider?: string | null;
  model?: string | null;
  language?: string | null;
  requestId?: string | null;
  attachments?: unknown[];
  metadata?: Record<string, unknown>;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface PersistenceResult<T> {
  data: T | null;
  error: Error | null;
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

export function createPersistenceClient(
  authorizationHeader?: string | null,
): SupabaseClient {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: authorizationHeader
          ? {
              Authorization: authorizationHeader,
            }
          : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export async function getOrCreateConversation(
  client: SupabaseClient,
  input: PersistConversationInput,
): Promise<PersistenceResult<{ id: string }>> {
  try {
    if (input.conversationId) {
      const { data, error } = await client
        .from("conversations")
        .select("id")
        .eq("id", input.conversationId)
        .eq("user_id", input.userId)
        .maybeSingle();

      if (error) {
        return {
          data: null,
          error: new Error(
            `Failed to load conversation: ${error.message}`,
          ),
        };
      }

      if (data?.id) {
        return {
          data: {
            id: data.id,
          },
          error: null,
        };
      }
    }

    const { data, error } = await client
      .from("conversations")
      .insert({
        user_id: input.userId,
        title: input.title ?? null,
        language: input.language ?? "en",
        last_capability: input.capability ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        data: null,
        error: new Error(
          `Failed to create conversation: ${
            error?.message ?? "Unknown database error"
          }`,
        ),
      };
    }

    return {
      data: {
        id: data.id,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unknown persistence error"),
    };
  }
}

export async function persistMessage(
  client: SupabaseClient,
  input: PersistMessageInput,
): Promise<PersistenceResult<{ id: string }>> {
  try {
    const { data, error } = await client
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        user_id: input.userId,
        role: input.role,
        content: input.content,
        capability: input.capability ?? null,
        provider: input.provider ?? null,
        model: input.model ?? null,
        language: input.language ?? null,
        request_id: input.requestId ?? null,
        attachments: input.attachments ?? [],
        metadata: input.metadata ?? {},
        prompt_tokens: input.promptTokens ?? null,
        completion_tokens: input.completionTokens ?? null,
        total_tokens: input.totalTokens ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        data: null,
        error: new Error(
          `Failed to persist message: ${
            error?.message ?? "Unknown database error"
          }`,
        ),
      };
    }

    return {
      data: {
        id: data.id,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unknown persistence error"),
    };
  }
}
