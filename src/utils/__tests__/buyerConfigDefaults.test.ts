import { describe, expect, it } from "vitest";
import type { Integration } from "../../models/appTypes";
import {
  denormalizeSchedule,
  inferDestination,
  inferDestinationMode,
  inferDialIvr,
  inferDuplicateRules,
  inferErrorSettings,
  inferFilters,
  inferRecordingSettings,
  inferRequest,
  inferRevenueSettings,
  normalizeSchedule,
} from "../buyerConfigDefaults";

function integration(overrides: Partial<Integration> = {}): Integration {
  return {
    id: "int_t",
    campaignId: "camp_t",
    name: "Test",
    direction: "buyer",
    type: "rtb",
    platformPreset: "custom",
    status: "draft",
    config: {},
    createdAt: "2026-01-01T00:00:00Z",
    createdBy: "User",
    updatedAt: "2026-01-01T00:00:00Z",
    updatedBy: "User",
    usageCount: 0,
    errorRate: 0,
    ...overrides,
  };
}

describe("buyerConfigDefaults", () => {
  it("infers destination mode from explicit setting", () => {
    expect(
      inferDestinationMode(
        integration({ config: { destinationMode: "static_sip" } })
      )
    ).toBe("static_sip");
  });

  it("infers static_number for static_number type without overrides", () => {
    expect(inferDestinationMode(integration({ type: "static_number" }))).toBe(
      "static_number"
    );
  });

  it("infers dynamic_number_from_response when destinationNumberPath is present", () => {
    expect(
      inferDestinationMode(
        integration({
          config: { responseParsing: { destinationNumberPath: "$.number" } },
        })
      )
    ).toBe("dynamic_number_from_response");
  });

  it("infers static_sip when only sipAddress is set", () => {
    expect(
      inferDestinationMode(
        integration({ type: "sip", config: { sipAddress: "sip:test@x" } })
      )
    ).toBe("static_sip");
  });

  it("derives destination details from legacy config", () => {
    const result = inferDestination(
      integration({
        config: {
          destinationNumber: "+18005550000",
          responseParsing: { destinationNumberPath: "$.phone" },
        },
      })
    );
    expect(result.number).toBe("+18005550000");
    expect(result.dynamicNumberPath).toBe("$.phone");
  });

  it("infers request settings with backward-compatible defaults", () => {
    const result = inferRequest({
      method: "POST",
      url: "https://x.test",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeoutSeconds: 4,
    });
    expect(result.method).toBe("POST");
    expect(result.url).toBe("https://x.test");
    expect(result.contentType).toBe("application/x-www-form-urlencoded");
    expect(result.timeoutSeconds).toBe(4);
    expect(result.authenticationMode).toBe("none");
  });

  it("returns sensible defaults for duplicate/recording/error/dialIvr/filters", () => {
    expect(inferDuplicateRules({}).mode).toBe("campaign_default");
    expect(inferRecordingSettings({}).mode).toBe("account_default");
    expect(inferErrorSettings({}).mode).toBe("ring_tree_default");
    expect(inferDialIvr({}).enabled).toBe(false);
    expect(inferFilters({})).toEqual([]);
  });

  it("infers revenue override from legacy payout fields", () => {
    const revenue = inferRevenueSettings({
      payout: 25,
      conversionDurationSeconds: 90,
    });
    expect(revenue.mode).toBe("override");
    expect(revenue.payout).toBe(25);
  });
});

describe("normalizeSchedule", () => {
  it("returns 7 disabled days for undefined input", () => {
    const normalized = normalizeSchedule(undefined);
    expect(normalized.dayRules).toHaveLength(7);
    expect(normalized.dayRules.every(rule => !rule.enabled)).toBe(true);
    expect(normalized.timezone).toBe("America/New_York");
    expect(normalized.mode).toBe("basic");
  });

  it("synthesizes dayRules from legacy days+startTime+endTime in basic mode", () => {
    const normalized = normalizeSchedule({
      timezone: "America/Chicago",
      days: ["Mon", "Wed", "Fri"],
      startTime: "08:30",
      endTime: "18:00",
      mode: "basic",
    });
    expect(normalized.timezone).toBe("America/Chicago");
    expect(normalized.dayRules).toHaveLength(7);
    const enabled = normalized.dayRules.filter(rule => rule.enabled);
    expect(enabled.map(r => r.day)).toEqual(["Mon", "Wed", "Fri"]);
    expect(enabled.every(r => r.startTime === "08:30")).toBe(true);
    expect(enabled.every(r => r.endTime === "18:00")).toBe(true);
  });

  it("enables all days for always_open mode", () => {
    const normalized = normalizeSchedule({
      timezone: "UTC",
      days: [],
      startTime: "00:00",
      endTime: "23:59",
      mode: "always_open",
    });
    expect(normalized.dayRules.every(rule => rule.enabled)).toBe(true);
  });

  it("honors explicit dayRules and pads missing days as disabled", () => {
    const normalized = normalizeSchedule({
      timezone: "America/New_York",
      days: [],
      startTime: "09:00",
      endTime: "17:00",
      mode: "advanced",
      dayRules: [
        { day: "Mon", enabled: true, startTime: "07:00", endTime: "13:00" },
        { day: "Tue", enabled: true, startTime: "13:00", endTime: "20:00" },
      ],
    });
    const byDay = Object.fromEntries(normalized.dayRules.map(r => [r.day, r]));
    expect(byDay.Mon.startTime).toBe("07:00");
    expect(byDay.Tue.endTime).toBe("20:00");
    expect(byDay.Sat.enabled).toBe(false);
  });
});

describe("denormalizeSchedule", () => {
  it("round-trips a basic schedule and preserves legacy fields", () => {
    const original = normalizeSchedule({
      timezone: "America/Chicago",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "08:00",
      endTime: "18:00",
      mode: "basic",
    });
    const denormalized = denormalizeSchedule(original);
    expect(denormalized.timezone).toBe("America/Chicago");
    expect(denormalized.mode).toBe("basic");
    expect(denormalized.days).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(denormalized.startTime).toBe("08:00");
    expect(denormalized.endTime).toBe("18:00");
    expect(denormalized.dayRules?.find(r => r.day === "Mon")?.enabled).toBe(true);
  });

  it("picks dominant times when advanced schedule has non-uniform hours", () => {
    const denormalized = denormalizeSchedule({
      timezone: "UTC",
      mode: "advanced",
      dayRules: [
        { day: "Mon", enabled: true, startTime: "09:00", endTime: "17:00" },
        { day: "Tue", enabled: true, startTime: "09:00", endTime: "17:00" },
        { day: "Wed", enabled: true, startTime: "09:00", endTime: "17:00" },
        { day: "Thu", enabled: true, startTime: "10:00", endTime: "20:00" },
        { day: "Fri", enabled: false },
        { day: "Sat", enabled: false },
        { day: "Sun", enabled: false },
      ],
    });
    // Dominant times are 09:00–17:00 (3 days vs 1).
    expect(denormalized.startTime).toBe("09:00");
    expect(denormalized.endTime).toBe("17:00");
    // dayRules preserved verbatim.
    expect(denormalized.dayRules?.[3].startTime).toBe("10:00");
  });

  it("uses default fallback times when no day is enabled", () => {
    const denormalized = denormalizeSchedule({
      timezone: "UTC",
      mode: "basic",
      dayRules: [
        { day: "Mon", enabled: false },
        { day: "Tue", enabled: false },
        { day: "Wed", enabled: false },
        { day: "Thu", enabled: false },
        { day: "Fri", enabled: false },
        { day: "Sat", enabled: false },
        { day: "Sun", enabled: false },
      ],
    });
    expect(denormalized.days).toEqual([]);
    expect(denormalized.startTime).toBe("09:00");
    expect(denormalized.endTime).toBe("17:00");
  });
});
