import { calculateFreshnessStatus } from "../utils/freshness";
import type { AppState } from "./appReducer";

export const selectCampaignById = (state: AppState, id: string) =>
  state.campaigns.find(campaign => campaign.id === id);

export const selectIntegrationById = (state: AppState, id: string) =>
  state.integrations.find(integration => integration.id === id);

export const selectIntegrationsByCampaign = (state: AppState, campaignId: string) =>
  state.integrations.filter(integration => integration.campaignId === campaignId);

export const selectLatestTestRunForIntegration = (state: AppState, integrationId: string) =>
  state.testRuns
    .filter(testRun => testRun.integrationId === integrationId)
    .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

export const selectActivityForIntegration = (state: AppState, integrationId: string) =>
  state.activityEvents.filter(event => event.integrationId === integrationId);

export const selectDashboardStats = (state: AppState) => {
  const integrationsWithStatus = state.integrations.map(integration => ({
    ...integration,
    currentStatus: calculateFreshnessStatus(integration)
  }));

  return {
    active: integrationsWithStatus.filter(integration => integration.currentStatus === "active").length,
    needsTesting: integrationsWithStatus.filter(integration => integration.currentStatus === "needs_testing" || integration.currentStatus === "needs_retest").length,
    failing: integrationsWithStatus.filter(integration => integration.currentStatus === "failing").length,
    stale: integrationsWithStatus.filter(integration => integration.currentStatus === "stale" || integration.currentStatus === "dormant").length,
    usedThisWeek: integrationsWithStatus.filter(integration => {
      if (!integration.lastUsedAt) return false;
      const days = (new Date().getTime() - new Date(integration.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length,
  };
};

export const selectIntegrationsNeedingAttention = (state: AppState) =>
  state.integrations
    .map(integration => ({ ...integration, currentStatus: calculateFreshnessStatus(integration) }))
    .filter(integration => ["failing", "stale", "needs_retest", "needs_testing"].includes(integration.currentStatus));
