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
});
