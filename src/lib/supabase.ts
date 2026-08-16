import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Loud, visible warning rather than silently degrading — the app's
  // UI also surfaces "Configuration required" states wherever this
  // matters (see src/components/ConfigRequired.tsx).
  // eslint-disable-next-line no-console
  console.warn(
    "[Mass Diamond] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

// A dummy local placeholder avoids crashing the app when unconfigured,
// but every call against it will fail — callers must check
// isSupabaseConfigured or handle errors and show a configuration state.
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "public-anon-placeholder");
