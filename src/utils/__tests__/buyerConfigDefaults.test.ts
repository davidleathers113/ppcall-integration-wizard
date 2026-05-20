import { describe, expect, it } from "vitest";
import type { Integration } from "../../models/appTypes";
import {
  inferDestination,
  inferDestinationMode,
  inferDialIvr,
  inferDuplicateRules,
  inferErrorSettings,
  inferFilters,
  inferRecordingSettings,
  inferRequest,
  inferRevenueSettings,
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
