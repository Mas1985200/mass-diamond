import { describe, it, expect } from "vitest";
import { CAPABILITY_ROUTES } from "@/lib/capabilities";

describe("CAPABILITY_ROUTES", () => {
  it("maps every non-GENERAL_CHAT capability to a route", () => {
    expect(CAPABILITY_ROUTES.SEARCH).toBe("/search");
    expect(CAPABILITY_ROUTES.MARKETPLACE).toBe("/marketplace");
    expect(CAPABILITY_ROUTES.REAL_ESTATE).toBe("/real-estate");
    expect(CAPABILITY_ROUTES.BUSINESS).toBe("/businesses");
  });

  it("has exactly 4 routable capabilities (GENERAL_CHAT has no dedicated page)", () => {
    expect(Object.keys(CAPABILITY_ROUTES)).toHaveLength(4);
  });
});
