// Run with: deno test supabase/functions/ai-chat/router.test.ts
// Tests the fallback/normalization logic in classifyCapability without
// making a real network call, by stubbing the AIProvider.

import { assertEquals } from "jsr:@std/assert@1";
import { classifyCapability } from "./router.ts";
import type { AIProvider } from "./provider.ts";

function stubProvider(reply: string): AIProvider {
  return {
    name: "stub",
    async complete() {
      return { content: reply };
    }
  };
}

Deno.test("classifyCapability returns an exact match verbatim", async () => {
  const result = await classifyCapability(stubProvider("MARKETPLACE"), "I want to sell my phone");
  assertEquals(result, "MARKETPLACE");
});

Deno.test("classifyCapability is case-insensitive", async () => {
  const result = await classifyCapability(stubProvider("real_estate"), "find me an apartment");
  assertEquals(result, "REAL_ESTATE");
});

Deno.test("classifyCapability tolerates extra whitespace/punctuation", async () => {
  const result = await classifyCapability(stubProvider("  BUSINESS.\n"), "find a persian restaurant");
  assertEquals(result, "BUSINESS");
});

Deno.test("classifyCapability falls back to GENERAL_CHAT on an unrecognized reply", async () => {
  const result = await classifyCapability(stubProvider("I'm not sure"), "hello");
  assertEquals(result, "GENERAL_CHAT");
});
