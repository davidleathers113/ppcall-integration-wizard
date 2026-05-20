import { describe, expect, it } from "vitest";
import {
  normalizePhoneNumber,
  validateDialIvrDigits,
  validateDirectTargetConfig,
  validatePhoneNumber,
  validateSipAddress,
} from "../targetValidation";
import type { IntegrationConfig } from "../../models/appTypes";

describe("validatePhoneNumber", () => {
  it("accepts a valid E.164 number", () => {
    const result = validatePhoneNumber("+12223334444");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("+12223334444");
  });

  it("accepts numbers with separators and normalizes them", () => {
    const result = validatePhoneNumber("+1 (222) 333-4444");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("+12223334444");
  });

  it("rejects empty input", () => {
    const result = validatePhoneNumber("");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("required");
  });

  it("rejects numbers without country code", () => {
    const result = validatePhoneNumber("2223334444");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("+");
  });

  it("rejects invalid characters", () => {
    const result = validatePhoneNumber("+1abc4444");
    expect(result.valid).toBe(false);
  });

  it("rejects too-short numbers", () => {
    const result = validatePhoneNumber("+12345");
    expect(result.valid).toBe(false);
  });

  it("rejects too-long numbers", () => {
    const result = validatePhoneNumber("+12345678901234567");
    expect(result.valid).toBe(false);
  });
});

describe("normalizePhoneNumber", () => {
  it("strips separators while preserving leading plus", () => {
    expect(normalizePhoneNumber("+1 (800) 555-1212")).toBe("+18005551212");
  });

  it("returns empty for empty input", () => {
    expect(normalizePhoneNumber("")).toBe("");
  });
});

describe("validateSipAddress", () => {
  it("accepts user@host SIP URI", () => {
    const result = validateSipAddress("sip:buyer@example.com");
    expect(result.valid).toBe(true);
  });

  it("accepts host-only SIP URI", () => {
    const result = validateSipAddress("sip:example.com");
    expect(result.valid).toBe(true);
  });

  it("accepts sips:// scheme", () => {
    const result = validateSipAddress("sips:buyer@example.com");
    expect(result.valid).toBe(true);
  });

  it("rejects missing scheme", () => {
    const result = validateSipAddress("buyer@example.com");
    expect(result.valid).toBe(false);
  });

  it("rejects empty input", () => {
    const result = validateSipAddress("");
    expect(result.valid).toBe(false);
  });

  it("rejects empty user portion", () => {
    const result = validateSipAddress("sip:@example.com");
    expect(result.valid).toBe(false);
  });

  it("rejects host without dot or port", () => {
    const result = validateSipAddress("sip:buyer@localhost");
    expect(result.valid).toBe(false);
  });
});

describe("validateDialIvrDigits", () => {
  it("accepts plain digits", () => {
    expect(validateDialIvrDigits("1234").valid).toBe(true);
  });

  it("accepts # and w (pause)", () => {
    expect(validateDialIvrDigits("123#www").valid).toBe(true);
  });

  it("accepts known numeric tokens", () => {
    expect(validateDialIvrDigits("www{{zip}}").valid).toBe(true);
  });

  it("warns for unknown tokens", () => {
    const result = validateDialIvrDigits("{{unknown_token}}");
    expect(result.valid).toBe(true);
    expect(result.message).toBeDefined();
  });

  it("rejects unsupported characters", () => {
    expect(validateDialIvrDigits("abc").valid).toBe(false);
  });

  it("rejects empty input", () => {
    expect(validateDialIvrDigits("").valid).toBe(false);
  });
});

describe("validateDirectTargetConfig", () => {
  const baseValidNumber: IntegrationConfig = {
    buyerDestinationKind: "direct_number",
    destinationMode: "static_number",
    destination: { number: "+18005551212" },
    destinationNumber: "+18005551212",
    payout: 35,
    conversionDurationSeconds: 120,
    schedule: {
      timezone: "America/New_York",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "17:00",
      mode: "basic",
    },
    caps: { daily: 100, concurrency: 5 },
  };

  it("returns no errors for a valid direct number target", () => {
    const issues = validateDirectTargetConfig(baseValidNumber, "direct_number");
    expect(issues.filter(i => i.severity === "error")).toHaveLength(0);
  });

  it("flags missing destination number", () => {
    const config: IntegrationConfig = {
      ...baseValidNumber,
      destination: {},
      destinationNumber: undefined,
    };
    const issues = validateDirectTargetConfig(config, "direct_number");
    expect(issues.some(i => i.field === "destination.number" && i.severity === "error")).toBe(true);
  });

  it("flags invalid destination number format", () => {
    const config: IntegrationConfig = {
      ...baseValidNumber,
      destination: { number: "2223334444" },
      destinationNumber: "2223334444",
    };
    const issues = validateDirectTargetConfig(config, "direct_number");
    expect(issues.some(i => i.field === "destination.number" && i.severity === "error")).toBe(true);
  });

  it("flags missing SIP address for direct_sip kind", () => {
    const config: IntegrationConfig = {
      ...baseValidNumber,
      buyerDestinationKind: "direct_sip",
      destinationMode: "static_sip",
      destination: {},
      destinationNumber: undefined,
    };
    const issues = validateDirectTargetConfig(config, "direct_sip");
    expect(issues.some(i => i.field === "destination.sipAddress" && i.severity === "error")).toBe(true);
  });

  it("flags restrict duplicates without window", () => {
    const config: IntegrationConfig = {
      ...baseValidNumber,
      duplicateRules: { mode: "restrict" },
    };
    const issues = validateDirectTargetConfig(config, "direct_number");
    expect(
      issues.some(
        i => i.field === "duplicateRules.windowMinutes" && i.severity === "error"
      )
    ).toBe(true);
  });

  it("flags missing payout and conversion duration", () => {
    const config: IntegrationConfig = {
      ...baseValidNumber,
      payout: undefined,
      conversionDurationSeconds: undefined,
    };
    const issues = validateDirectTargetConfig(config, "direct_number");
    expect(issues.some(i => i.field === "payout" && i.severity === "error")).toBe(true);
    expect(
      issues.some(i => i.field === "conversionDurationSeconds" && i.severity === "error")
    ).toBe(true);
  });
});
