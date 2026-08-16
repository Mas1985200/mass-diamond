// Mirrors supabase/functions/ai-chat/router.ts — keep in sync.
export type Capability = "GENERAL_CHAT" | "SEARCH" | "MARKETPLACE" | "REAL_ESTATE" | "BUSINESS";

export const CAPABILITY_ROUTES: Record<Exclude<Capability, "GENERAL_CHAT">, string> = {
  SEARCH: "/search",
  MARKETPLACE: "/marketplace",
  REAL_ESTATE: "/real-estate",
  BUSINESS: "/businesses"
};
