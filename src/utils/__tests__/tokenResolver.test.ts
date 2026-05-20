import { describe, expect, it } from "vitest";
import { resolveObjectTokens, resolveTokens } from "../tokenResolver";

describe("tokenResolver", () => {
  const tokens = { caller_id: "7275551234", zip: "34655", state: "FL" };

  it("resolves one or many tokens and preserves unknown tokens", () => {
    expect(resolveTokens("{{caller_id}}", tokens)).toBe("7275551234");
    expect(resolveTokens("{{ caller_id }}-{{zip}}-{{state}}", tokens)).toBe("7275551234-34655-FL");
    expect(resolveTokens("{{unknown}}", tokens)).toBe("{{unknown}}");
  });

  it("resolves nested objects and arrays while preserving primitives", () => {
    expect(resolveObjectTokens({ lead: { caller: "{{caller_id}}" }, values: ["{{zip}}", 5, true] }, tokens)).toEqual({
      lead: { caller: "7275551234" },
      values: ["34655", 5, true]
    });
  });
});
