import { describe, expect, it } from "vitest";
import type { Integration, TestRun } from "../../models/appTypes";
import { appReducer, createInitialState } from "../appReducer";

describe("appReducer", () => {
  it("creates and updates integrations", () => {
    const state = createInitialState();
    const integration: Integration = {
      id: "int_new",
      campaignId: "camp_hvac",
      name: "New",
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
      errorRate: 0
    };
    const created = appReducer(state, { type: "CREATE_INTEGRATION", payload: integration });
    expect(created.integrations.some(item => item.id === "int_new")).toBe(true);
    const updated = appReducer(created, { type: "UPDATE_INTEGRATION", payload: { ...integration, name: "Updated" } });
    expect(updated.integrations.find(item => item.id === "int_new")?.name).toBe("Updated");
  });

  it("stores test runs and transitions integration status", () => {
    const state = createInitialState();
    const integration = state.integrations[0];
    const testRun: TestRun = {
      id: "test_1",
      integrationId: integration.id,
      status: "passed",
      requestPreview: {},
      rawResponse: {},
      parsedResult: {},
      checklist: [],
      responseTimeMs: 200,
      createdAt: "2026-05-20T00:00:00Z"
    };
    const next = appReducer(state, { type: "RUN_TEST", payload: { integrationId: integration.id, testRun } });
    expect(next.testRuns).toHaveLength(1);
    expect(next.integrations.find(item => item.id === integration.id)?.lastSuccessfulTestAt).toBe(testRun.createdAt);
  });

  it("marks used and resets mock data", () => {
    const state = createInitialState();
    const id = state.integrations[0].id;
    const used = appReducer(state, { type: "MARK_USED", payload: { integrationId: id, at: "2026-05-20T00:00:00Z" } });
    expect(used.integrations[0].usageCount).toBe(state.integrations[0].usageCount + 1);
    expect(appReducer(used, { type: "RESET_DATA" }).testRuns).toHaveLength(0);
  });
});
