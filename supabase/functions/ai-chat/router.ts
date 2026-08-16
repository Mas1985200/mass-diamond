// ==========================================================
// Mass Diamond — capability router
// Classifies a user message into one of the platform capabilities.
// Uses the same AI provider with a constrained system prompt so
// classification quality improves as the underlying model does.
// Designed so new capabilities can be added by extending the enum
// and the ROUTING_SYSTEM_PROMPT.
// ==========================================================

import type { AIProvider } from "./provider.ts";

export type Capability = "GENERAL_CHAT" | "SEARCH" | "MARKETPLACE" | "REAL_ESTATE" | "BUSINESS";

const ROUTING_SYSTEM_PROMPT = `You are a routing classifier for the Mass Diamond app.
Classify the user's message into exactly one capability:
- GENERAL_CHAT: general questions, conversation, help, anything not below.
- SEARCH: general web/product search intent not specific to marketplace/real estate/business.
- MARKETPLACE: buying/selling goods (electronics, vehicles, furniture, etc.), including "I want to sell my X".
- REAL_ESTATE: renting or buying/selling property, apartments, houses, land.
- BUSINESS: finding local businesses, restaurants, shops, services near the user.

Respond with ONLY the capability name, nothing else.`;

export async function classifyCapability(provider: AIProvider, userMessage: string): Promise<Capability> {
  const result = await provider.complete([
    { role: "system", content: ROUTING_SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ]);

  const normalized = result.content.trim().toUpperCase();
  const valid: Capability[] = ["GENERAL_CHAT", "SEARCH", "MARKETPLACE", "REAL_ESTATE", "BUSINESS"];
  return (valid.find((c) => normalized.includes(c)) ?? "GENERAL_CHAT") as Capability;
}
