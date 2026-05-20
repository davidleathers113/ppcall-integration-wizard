import type { Integration, IntegrationStatus } from "../models/appTypes";

export interface FreshnessDetails {
  daysSinceLastUse: number | null;
  daysSinceLastSuccessfulTest: number | null;
  editedAfterLastSuccessfulTest: boolean;
  status: IntegrationStatus;
  reason: string;
  recommendedAction: string;
}

export function getDaysSince(dateString?: string, now: Date = new Date()): number {
  if (!dateString) return 999;
  const lastDate = new Date(dateString);
  
  if (lastDate > now) return 0;
  
  const diffTime = now.getTime() - lastDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateFreshnessStatus(integration: Integration, now: Date = new Date()): IntegrationStatus {
  return getFreshnessDetails(integration, now).status;
}

export function getFreshnessDetails(integration: Integration, now: Date = new Date()): FreshnessDetails {
  const daysSinceLastUse = integration.lastUsedAt ? getDaysSince(integration.lastUsedAt, now) : null;
  const daysSinceLastSuccessfulTest = integration.lastSuccessfulTestAt ? getDaysSince(integration.lastSuccessfulTestAt, now) : null;
  const editedAfterLastSuccessfulTest = Boolean(
    integration.lastSuccessfulTestAt &&
    new Date(integration.updatedAt) > new Date(integration.lastSuccessfulTestAt)
  );

  if (integration.status === "paused" || integration.status === "archived" || integration.status === "draft") {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: integration.status,
      reason: `Integration is ${integration.status}.`,
      recommendedAction: integration.status === "draft" ? "Complete configuration and run a test." : "No action required unless this status should change."
    };
  }

  if (!integration.lastTestedAt) {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "needs_testing",
      reason: "No test has been run.",
      recommendedAction: "Run the integration test console."
    };
  }

  if (editedAfterLastSuccessfulTest) {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "needs_retest",
      reason: "Configuration was edited after the last successful test.",
      recommendedAction: "Run a new test before activation or routing traffic."
    };
  }

  if (integration.errorRate > 0.2) {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "failing",
      reason: "Error rate is above 20%.",
      recommendedAction: "Inspect recent failures and retest the integration."
    };
  }

  if (integration.status === "active" && integration.usageCount === 0) {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "active_unused",
      reason: "Integration is active but has no usage.",
      recommendedAction: "Confirm routing rules and publisher traffic."
    };
  }

  if (integration.status === "active" && daysSinceLastUse !== null && daysSinceLastUse >= 30) {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "stale",
      reason: "No recorded usage in 30+ days.",
      recommendedAction: "Review whether this integration should be archived or revalidated."
    };
  }

  if (integration.status === "active" && daysSinceLastUse !== null && daysSinceLastUse >= 7) {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "dormant",
      reason: "No recorded usage in 7+ days.",
      recommendedAction: "Check campaign traffic and routing priority."
    };
  }

  if (integration.status === "active") {
    return {
      daysSinceLastUse,
      daysSinceLastSuccessfulTest,
      editedAfterLastSuccessfulTest,
      status: "active",
      reason: "Integration is active and fresh.",
      recommendedAction: "No action required."
    };
  }

  return {
    daysSinceLastUse,
    daysSinceLastSuccessfulTest,
    editedAfterLastSuccessfulTest,
    status: "test_passed",
    reason: "Latest freshness checks are satisfied but integration is not active.",
    recommendedAction: "Activate when ready."
  };
}
