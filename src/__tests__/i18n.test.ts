import { describe, it, expect } from "vitest";
import { isRtl, SUPPORTED_LANGUAGES, RTL_LANGUAGES } from "@/lib/i18n";

describe("isRtl", () => {
  it("returns true for Persian and Arabic", () => {
    expect(isRtl("fa")).toBe(true);
    expect(isRtl("ar")).toBe(true);
  });

  it("returns false for LTR languages", () => {
    expect(isRtl("en")).toBe(false);
    expect(isRtl("de")).toBe(false);
    expect(isRtl("fr")).toBe(false);
  });

  it("returns false for unknown language codes", () => {
    expect(isRtl("xx")).toBe(false);
  });

  it("keeps RTL_LANGUAGES as a subset of SUPPORTED_LANGUAGES", () => {
    for (const lang of RTL_LANGUAGES) {
      expect(SUPPORTED_LANGUAGES).toContain(lang);
    }
  });

  it("supports exactly the 8 languages from spec section 10", () => {
    expect(SUPPORTED_LANGUAGES).toEqual(["en", "fa", "ar", "tr", "fr", "de", "es", "nl"]);
  });
});
