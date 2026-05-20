import { describe, expect, it } from "vitest";
import { extractJsonPath } from "../jsonPath";

describe("extractJsonPath", () => {
  const payload = { accepted: true, phone_number: "+1800", lead: { payout: 42, nested: null } };

  it("extracts simple and nested values", () => {
    expect(extractJsonPath(payload, "$.accepted")).toBe(true);
    expect(extractJsonPath(payload, "$.phone_number")).toBe("+1800");
    expect(extractJsonPath(payload, "$.lead.payout")).toBe(42);
  });

  it("returns undefined for missing or invalid paths without throwing", () => {
    expect(extractJsonPath(payload, "$.missing")).toBeUndefined();
    expect(extractJsonPath(payload, "$.lead.nested.value")).toBeUndefined();
    expect(extractJsonPath("not-object", "$.accepted")).toBeUndefined();
    expect(() => extractJsonPath(undefined, "$.accepted")).not.toThrow();
  });
});
