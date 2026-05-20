import { describe, expect, it } from "vitest";
import type { Integration } from "../../models/appTypes";
import { calculateFreshnessStatus, getDaysSince, getFreshnessDetails } from "../freshness";

const now = new Date("2026-05-20T00:00:00Z");

function integration(overrides: Partial<Integration>): Integration {
  return {
    id: "int_test",
    campaignId: "camp_hvac",
    name: "Test",
    direction: "buyer",
    type: "rtb",
    platformPreset: "custom",
    status: "active",
    config: {},
    createdAt: "2026-01-01T00:00:00Z",
    createdBy: "User",
    updatedAt: "2026-01-01T00:00:00Z",
    updatedBy: "User",
    usageCount: 1,
    errorRate: 0,
    lastTestedAt: "2026-01-02T00:00:00Z",
    lastSuccessfulTestAt: "2026-01-02T00:00:00Z",
    lastUsedAt: "2026-05-19T00:00:00Z",
    ...overrides
  };
}

describe("freshness", () => {
  it("preserves terminal/manual statuses", () => {
    expect(calculateFreshnessStatus(integration({ status: "draft" }), now)).toBe("draft");
    expect(calculateFreshnessStatus(integration({ status: "paused" }), now)).toBe("paused");
    expect(calculateFreshnessStatus(integration({ status: "archived" }), now)).toBe("archived");
  });

  it("detects needs_testing and needs_retest", () => {
    expect(calculateFreshnessStatus(integration({ lastTestedAt: undefined }), now)).toBe("needs_testing");
    expect(calculateFreshnessStatus(integration({ updatedAt: "2026-02-01T00:00:00Z" }), now)).toBe("needs_retest");
  });

  it("detects failing and active_unused", () => {
    expect(calculateFreshnessStatus(integration({ errorRate: 0.21 }), now)).toBe("failing");
    expect(calculateFreshnessStatus(integration({ usageCount: 0 }), now)).toBe("active_unused");
  });

  it("detects stale, dormant, and active", () => {
    expect(calculateFreshnessStatus(integration({ lastUsedAt: "2026-04-01T00:00:00Z" }), now)).toBe("stale");
    expect(calculateFreshnessStatus(integration({ lastUsedAt: "2026-05-10T00:00:00Z" }), now)).toBe("dormant");
    expect(calculateFreshnessStatus(integration({ lastUsedAt: "2026-05-19T00:00:00Z" }), now)).toBe("active");
  });

  it("does not return negative day counts for future dates", () => {
    expect(getDaysSince("2026-06-01T00:00:00Z", now)).toBe(0);
  });

  it("returns freshness details", () => {
    const details = getFreshnessDetails(integration({ errorRate: 0.3 }), now);
    expect(details.status).toBe("failing");
    expect(details.reason).toContain("Error rate");
    expect(details.recommendedAction.length).toBeGreaterThan(0);
  });
});
