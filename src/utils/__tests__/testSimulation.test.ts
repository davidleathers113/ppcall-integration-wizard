import { describe, expect, it } from "vitest";
import type { Integration, IntegrationConfig } from "../../models/appTypes";
import { simulateIntegrationTest } from "../testSimulation";

function integration(config: IntegrationConfig, overrides: Partial<Integration> = {}): Integration {
  return {
    id: "int_test",
    campaignId: "camp_hvac",
    name: "Test",
    direction: "buyer",
    type: "rtb",
    platformPreset: "custom",
    status: "draft",
    config,
    createdAt: "2026-01-01T00:00:00Z",
    createdBy: "User",
    updatedAt: "2026-01-01T00:00:00Z",
    updatedBy: "User",
    usageCount: 0,
    errorRate: 0,
    ...overrides
  };
}

const validRtbConfig: IntegrationConfig = {
  url: "https://buyer.example/ping",
  method: "POST",
  requestBody: { caller_id: "{{caller_id}}", zip: "{{zip}}" },
  responseParsing: { acceptedPath: "$.accepted", acceptedValue: true, destinationNumberPath: "$.phone_number", bidPath: "$.bid" },
  timeoutSeconds: 3
};

describe("simulateIntegrationTest", () => {
  it("passes a valid buyer RTB and returns full run fields", () => {
    const run = simulateIntegrationTest(integration(validRtbConfig));
    expect(run.status).toBe("passed");
    expect(run.requestPreview).toBeTruthy();
    expect(run.rawResponse).toBeTruthy();
    expect(run.parsedResult).toBeTruthy();
    expect(run.checklist.length).toBeGreaterThan(0);
    expect(run.responseTimeMs).toBeGreaterThan(0);
    expect(run.createdAt).toBeTruthy();
  });

  it("fails invalid buyer RTB config", () => {
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, url: undefined })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, method: undefined })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, requestBody: { zip: "{{zip}}" } })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, requestBody: { caller_id: "{{caller_id}}" } })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, responseParsing: undefined })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, responseParsing: { destinationNumberPath: "$.phone_number" } })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, responseParsing: { acceptedPath: "$.accepted" } })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ ...validRtbConfig, timeoutSeconds: 6 })).status).toBe("failed");
  });

  it("fails invalid static buyers", () => {
    expect(simulateIntegrationTest(integration({ payout: 10, conversionDurationSeconds: 60 }, { type: "static_number" })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ destinationNumber: "+1800", conversionDurationSeconds: 60 }, { type: "static_number" })).status).toBe("failed");
    expect(simulateIntegrationTest(integration({ destinationNumber: "+1800", payout: 10 }, { type: "static_number" })).status).toBe("failed");
  });

  it("validates publisher RTB requirements", () => {
    const publisher = integration({ publisherId: "pub_1", postingUrl: "https://post.test", requiredFields: ["caller_id", "zip"], expiresInSeconds: 30 }, { direction: "publisher", type: "rtb" });
    expect(simulateIntegrationTest(publisher).status).toBe("passed");
    expect(simulateIntegrationTest({ ...publisher, config: { ...publisher.config, publisherId: undefined } }).status).toBe("failed");
    expect(simulateIntegrationTest({ ...publisher, config: { ...publisher.config, postingUrl: undefined } }).status).toBe("failed");
    expect(simulateIntegrationTest({ ...publisher, config: { ...publisher.config, requiredFields: [] } }).status).toBe("failed");
    expect(simulateIntegrationTest({ ...publisher, config: { ...publisher.config, requiredFields: ["zip"] } }).status).toBe("failed");
    expect(simulateIntegrationTest({ ...publisher, config: { ...publisher.config, expiresInSeconds: undefined } }).status).toBe("failed");
  });

  it("fails when dynamic destination mode lacks a parser path", () => {
    const run = simulateIntegrationTest(
      integration({ ...validRtbConfig, destinationMode: "dynamic_number_from_response", responseParsing: { acceptedPath: "$.accepted", acceptedValue: true, destinationNumberPath: "" } })
    );
    expect(run.status).toBe("failed");
  });

  it("warns when caps are not configured", () => {
    const run = simulateIntegrationTest(integration(validRtbConfig));
    const item = run.checklist.find(entry => entry.label === "Caps configured");
    expect(item?.status).toBe("warning");
  });

  it("fails when a numeric cap is non-positive", () => {
    const run = simulateIntegrationTest(
      integration({ ...validRtbConfig, caps: { daily: 0 } })
    );
    expect(run.status).toBe("failed");
    expect(run.checklist.some(item => item.label === "Caps valid" && item.status === "fail")).toBe(true);
  });

  it("fails when restrict duplicates mode lacks a window", () => {
    const run = simulateIntegrationTest(
      integration({ ...validRtbConfig, duplicateRules: { mode: "restrict" } })
    );
    expect(run.status).toBe("failed");
  });

  it("passes when restrict duplicates includes a positive window", () => {
    const run = simulateIntegrationTest(
      integration({ ...validRtbConfig, duplicateRules: { mode: "restrict", windowMinutes: 30 } })
    );
    expect(run.status).toBe("passed");
  });

  it("fails when schedule omits a timezone", () => {
    const run = simulateIntegrationTest(
      integration({
        ...validRtbConfig,
        schedule: { timezone: "", days: ["Mon"], startTime: "09:00", endTime: "17:00" }
      })
    );
    expect(run.status).toBe("failed");
  });

  it("warns when schedule is always open", () => {
    const run = simulateIntegrationTest(
      integration({
        ...validRtbConfig,
        schedule: { timezone: "UTC", days: [], startTime: "00:00", endTime: "23:59", mode: "always_open" }
      })
    );
    expect(run.checklist.some(item => item.label === "Schedule" && item.status === "warning")).toBe(true);
  });

  it("fails when revenue override has no payout or bid path", () => {
    const run = simulateIntegrationTest(
      integration({ ...validRtbConfig, revenueSettings: { mode: "override" } })
    );
    expect(run.status).toBe("failed");
  });

  it("warns when recording is disabled", () => {
    const run = simulateIntegrationTest(
      integration({ ...validRtbConfig, recordingSettings: { mode: "disabled" } })
    );
    expect(run.checklist.some(item => item.label === "Call recording" && item.status === "warning")).toBe(true);
  });

  it("supports legacy configs without advanced fields (backward compat)", () => {
    const legacyConfig = {
      method: "POST" as const,
      url: "https://legacy.example/ping",
      requestBody: { caller_id: "{{caller_id}}", zip: "{{zip}}" },
      responseParsing: { acceptedPath: "$.accepted", acceptedValue: true, destinationNumberPath: "$.phone_number" },
      timeoutSeconds: 3
    };
    const run = simulateIntegrationTest(integration(legacyConfig));
    expect(run.status).toBe("passed");
  });
});
