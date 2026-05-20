import type { Integration, IntegrationStatus } from "../models/appTypes";

export function getDaysSince(dateString?: string): number {
  if (!dateString) return 999;
  const lastDate = new Date(dateString);
  const now = new Date();
  
  if (lastDate > now) return 0;
  
  const diffTime = now.getTime() - lastDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateFreshnessStatus(integration: Integration): IntegrationStatus {
  if (integration.status === "paused" || integration.status === "archived" || integration.status === "draft") {
    return integration.status;
  }

  if (!integration.lastTestedAt) {
    return "needs_testing";
  }

  if (
    integration.lastSuccessfulTestAt &&
    new Date(integration.updatedAt) > new Date(integration.lastSuccessfulTestAt)
  ) {
    return "needs_retest";
  }

  if (integration.errorRate > 0.2) {
    return "failing";
  }

  if (integration.status === "active" && integration.usageCount === 0) {
    return "active_unused";
  }

  const daysSinceLastUse = getDaysSince(integration.lastUsedAt);

  if (integration.status === "active" && daysSinceLastUse >= 30) {
    return "stale";
  }

  if (integration.status === "active" && daysSinceLastUse >= 7) {
    return "dormant";
  }

  // If it's active and none of the above applied, it's just active.
  if (integration.status === "active") {
    return "active";
  }

  return "test_passed";
}
