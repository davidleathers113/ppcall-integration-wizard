import { useMemo } from "react";
import type { ActivityEvent, BuyerTarget, Campaign, Integration, IntegrationConfig, PublisherSource, TestRun } from "../models/appTypes";
import { nowIso } from "../utils/clock";
import { createId } from "../utils/id";
import { simulateIntegrationTest } from "../utils/testSimulation";
import { createInitialState } from "./appReducer";
import { selectIntegrationById, selectLatestTestRunForIntegration } from "./selectors";
import { useAppContext } from "./AppStore";

interface ActionMeta {
  actor?: string;
  message?: string;
}

type NewIntegrationInput = Pick<Integration, "campaignId" | "name" | "direction" | "type" | "platformPreset" | "config"> & Partial<Pick<Integration, "status">>;

function activity(integration: Integration, eventType: ActivityEvent["eventType"], message: string, actor = "User", at = nowIso()): ActivityEvent {
  return {
    id: createId("evt"),
    integrationId: integration.id,
    campaignId: integration.campaignId,
    eventType,
    message,
    createdAt: at,
    actor
  };
}

export function useAppActions() {
  const { state, dispatch } = useAppContext();

  return useMemo(() => ({
    createCampaign(input: Pick<Campaign, "name" | "vertical" | "status">) {
      const at = nowIso();
      const campaign: Campaign = {
        id: createId("camp"),
        name: input.name,
        vertical: input.vertical,
        status: input.status,
        createdAt: at
      };
      dispatch({ type: "CREATE_CAMPAIGN", payload: campaign });
      return campaign;
    },

    createIntegration(input: NewIntegrationInput, meta: ActionMeta = {}) {
      const at = nowIso();
      const actor = meta.actor || "User";
      const integration: Integration = {
        id: createId("int"),
        campaignId: input.campaignId,
        name: input.name,
        direction: input.direction,
        type: input.type,
        platformPreset: input.platformPreset,
        status: input.status || "draft",
        config: input.config,
        createdAt: at,
        createdBy: actor,
        updatedAt: at,
        updatedBy: actor,
        usageCount: 0,
        errorRate: 0
      };
      dispatch({ type: "CREATE_INTEGRATION", payload: integration });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "created", meta.message || `Created draft integration ${integration.name}.`, actor, at) });
      return integration;
    },

    updateIntegration(id: string, patch: Partial<Omit<Integration, "id">> & { config?: IntegrationConfig }, meta: ActionMeta = {}) {
      const current = selectIntegrationById(state, id);
      if (!current) return undefined;
      const at = nowIso();
      const actor = meta.actor || "User";
      const configChanged = patch.config !== undefined && JSON.stringify(patch.config) !== JSON.stringify(current.config);
      const updated: Integration = {
        ...current,
        ...patch,
        id: current.id,
        status: configChanged && current.lastSuccessfulTestAt ? "needs_retest" : patch.status || current.status,
        updatedAt: at,
        updatedBy: actor
      };
      dispatch({ type: "UPDATE_INTEGRATION", payload: updated });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(updated, "updated", meta.message || `Updated ${updated.name}.`, actor, at) });
      return updated;
    },

    createPublisherSource(integrationId: string, input: Omit<PublisherSource, "id" | "usageCount" | "errorRate" | "status"> & Partial<Pick<PublisherSource, "status" | "usageCount" | "errorRate">>, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, integrationId);
      if (!integration) return undefined;
      const source: PublisherSource = {
        id: createId("src"),
        status: input.status || "draft",
        usageCount: input.usageCount || 0,
        errorRate: input.errorRate || 0,
        ...input
      };
      const updated = {
        ...integration,
        config: {
          ...integration.config,
          publisherSources: [...(integration.config.publisherSources || []), source]
        }
      };
      this.updateIntegration(integrationId, { config: updated.config }, { actor: meta.actor, message: meta.message || `Added publisher source ${source.name}.` });
      return source;
    },

    updatePublisherSource(integrationId: string, sourceId: string, patch: Partial<PublisherSource>, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, integrationId);
      if (!integration) return undefined;
      const sources = integration.config.publisherSources || [];
      const source = sources.find(item => item.id === sourceId);
      if (!source) return undefined;
      const updatedSource = { ...source, ...patch };
      this.updateIntegration(integrationId, {
        config: {
          ...integration.config,
          publisherSources: sources.map(item => item.id === sourceId ? updatedSource : item)
        }
      }, { actor: meta.actor, message: meta.message || `Updated publisher source ${updatedSource.name}.` });
      return updatedSource;
    },

    archivePublisherSource(integrationId: string, sourceId: string, meta: ActionMeta = {}) {
      return this.updatePublisherSource(integrationId, sourceId, { status: "archived" }, meta);
    },

    createBuyerTarget(integrationId: string, input: Omit<BuyerTarget, "id" | "usageCount" | "errorRate" | "status"> & Partial<Pick<BuyerTarget, "status" | "usageCount" | "errorRate">>, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, integrationId);
      if (!integration) return undefined;
      const target: BuyerTarget = {
        id: createId("target"),
        status: input.status || "draft",
        usageCount: input.usageCount || 0,
        errorRate: input.errorRate || 0,
        ...input
      };
      this.updateIntegration(integrationId, {
        config: {
          ...integration.config,
          buyerTargets: [...(integration.config.buyerTargets || []), target]
        }
      }, { actor: meta.actor, message: meta.message || `Added buyer target ${target.name}.` });
      return target;
    },

    updateBuyerTarget(integrationId: string, targetId: string, patch: Partial<BuyerTarget>, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, integrationId);
      if (!integration) return undefined;
      const targets = integration.config.buyerTargets || [];
      const target = targets.find(item => item.id === targetId);
      if (!target) return undefined;
      const updatedTarget = { ...target, ...patch };
      this.updateIntegration(integrationId, {
        config: {
          ...integration.config,
          buyerTargets: targets.map(item => item.id === targetId ? updatedTarget : item)
        }
      }, { actor: meta.actor, message: meta.message || `Updated buyer target ${updatedTarget.name}.` });
      return updatedTarget;
    },

    archiveBuyerTarget(integrationId: string, targetId: string, meta: ActionMeta = {}) {
      return this.updateBuyerTarget(integrationId, targetId, { status: "archived" }, meta);
    },

    markPublisherSourceUsed(integrationId: string, sourceId: string) {
      const integration = selectIntegrationById(state, integrationId);
      const source = integration?.config.publisherSources?.find(item => item.id === sourceId);
      if (!integration || !source) return;
      const at = nowIso();
      this.updatePublisherSource(integrationId, sourceId, {
        usageCount: source.usageCount + 1,
        lastUsedAt: at
      }, { actor: "System", message: `Marked publisher source ${source.name} as used.` });
    },

    markBuyerTargetUsed(integrationId: string, targetId: string) {
      const integration = selectIntegrationById(state, integrationId);
      const target = integration?.config.buyerTargets?.find(item => item.id === targetId);
      if (!integration || !target) return;
      const at = nowIso();
      this.updateBuyerTarget(integrationId, targetId, {
        usageCount: target.usageCount + 1,
        lastUsedAt: at
      }, { actor: "System", message: `Marked buyer target ${target.name} as used.` });
    },

    runIntegrationTest(id: string, inputTokens?: Record<string, string>) {
      const integration = selectIntegrationById(state, id);
      if (!integration) return undefined;
      const testRun: TestRun = simulateIntegrationTest(integration, inputTokens);
      dispatch({ type: "RUN_TEST", payload: { integrationId: id, testRun } });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "tested", `Integration test ${testRun.status} in ${testRun.responseTimeMs}ms.`, "System", testRun.createdAt) });
      return testRun;
    },

    activateIntegration(id: string, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, id);
      if (!integration) return { ok: false, message: "Integration not found." };
      const latestTest = selectLatestTestRunForIntegration(state, id);
      if (latestTest?.status !== "passed") {
        return { ok: false, message: "Activation blocked: run and pass a stored integration test first." };
      }
      const at = nowIso();
      dispatch({ type: "ACTIVATE_INTEGRATION", payload: { integrationId: id, at } });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "activated", meta.message || `Activated ${integration.name}.`, meta.actor || "User", at) });
      return { ok: true, message: "Integration activated." };
    },

    pauseIntegration(id: string, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, id);
      if (!integration) return;
      const at = nowIso();
      dispatch({ type: "PAUSE_INTEGRATION", payload: { integrationId: id, at } });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "paused", meta.message || `Paused ${integration.name}.`, meta.actor || "User", at) });
    },

    archiveIntegration(id: string, meta: ActionMeta = {}) {
      const integration = selectIntegrationById(state, id);
      if (!integration) return;
      const at = nowIso();
      dispatch({ type: "ARCHIVE_INTEGRATION", payload: { integrationId: id, at } });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "archived", meta.message || `Archived ${integration.name}.`, meta.actor || "User", at) });
    },

    bulkImportIntegrations(rows: NewIntegrationInput[], meta: ActionMeta = {}) {
      const created = rows.map(row => {
        const at = nowIso();
        const actor = meta.actor || "Bulk Importer";
        return {
          id: createId("int"),
          campaignId: row.campaignId,
          name: row.name,
          direction: row.direction,
          type: row.type,
          platformPreset: row.platformPreset,
          status: row.status || "draft",
          config: row.config,
          createdAt: at,
          createdBy: actor,
          updatedAt: at,
          updatedBy: actor,
          usageCount: 0,
          errorRate: 0
        } satisfies Integration;
      });
      dispatch({ type: "BULK_IMPORT", payload: created });
      created.forEach(integration => {
        dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "created", `Imported ${integration.name} via Bulk CSV/JSON import.`, meta.actor || "Bulk Importer", integration.createdAt) });
      });
      return created;
    },

    applyAIConfigToDraft(input: NewIntegrationInput) {
      const at = nowIso();
      const integration: Integration = {
        id: createId("int"),
        campaignId: input.campaignId,
        name: input.name,
        direction: input.direction,
        type: input.type,
        platformPreset: input.platformPreset,
        status: input.status || "draft",
        config: input.config,
        createdAt: at,
        createdBy: "AI Assistant",
        updatedAt: at,
        updatedBy: "AI Assistant",
        usageCount: 0,
        errorRate: 0
      };
      dispatch({ type: "CREATE_INTEGRATION", payload: integration });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "created", "Draft integration created from AI Assistant.", "AI Assistant", at) });
      return integration;
    },

    markIntegrationUsed(id: string) {
      const integration = selectIntegrationById(state, id);
      if (!integration) return;
      const at = nowIso();
      dispatch({ type: "MARK_USED", payload: { integrationId: id, at } });
      dispatch({ type: "ADD_ACTIVITY", payload: activity(integration, "used", `Marked ${integration.name} as used in mock traffic.`, "System", at) });
    },

    resetMockData() {
      dispatch({ type: "HYDRATE", payload: createInitialState() });
    }
  }), [dispatch, state]);
}
