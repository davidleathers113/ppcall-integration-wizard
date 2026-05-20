export type CampaignStatus = "draft" | "active" | "paused";

export interface Campaign {
  id: string;
  name: string;
  vertical: string;
  status: CampaignStatus;
  createdAt: string;
}

export type IntegrationDirection = "publisher" | "buyer";

export type IntegrationType =
  | "static_number"
  | "rtb"
  | "sip"
  | "webhook"
  | "generic_api";

export type IntegrationStatus =
  | "draft"
  | "needs_testing"
  | "test_passed"
  | "active"
  | "active_unused"
  | "dormant"
  | "stale"
  | "needs_retest"
  | "failing"
  | "paused"
  | "archived";

export interface IntegrationConfig {
  method?: "GET" | "POST";
  url?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  destinationNumber?: string;
  sipAddress?: string;
  postingUrl?: string;
  publisherId?: string;
  requiredFields?: string[];
  acceptedResponse?: Record<string, unknown>;
  rejectedResponse?: Record<string, unknown>;
  responseParsing?: {
    acceptedPath?: string;
    acceptedValue?: string | boolean | number;
    destinationNumberPath?: string;
    sipAddressPath?: string;
    bidPath?: string;
    conversionDurationPath?: string;
    expiresInSecondsPath?: string;
    rejectReasonPath?: string;
  };
  timeoutSeconds?: number;
  expiresInSeconds?: number;
  payout?: number;
  conversionDurationSeconds?: number;
  caps?: {
    daily?: number;
    hourly?: number;
  };
  schedule?: {
    timezone: string;
    days: string[];
    startTime: string;
    endTime: string;
  };
}

export interface Integration {
  id: string;
  campaignId: string;
  name: string;
  direction: IntegrationDirection;
  type: IntegrationType;
  platformPreset: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  activatedAt?: string;
  lastTestedAt?: string;
  lastSuccessfulTestAt?: string;
  lastUsedAt?: string;
  lastSuccessfulCallAt?: string;
  usageCount: number;
  errorRate: number;
}

export interface TestChecklistItem {
  label: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

export interface TestRun {
  id: string;
  integrationId: string;
  status: "passed" | "failed";
  requestPreview: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
  parsedResult: Record<string, unknown>;
  checklist: TestChecklistItem[];
  responseTimeMs: number;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  integrationId: string;
  campaignId: string;
  eventType:
    | "created"
    | "updated"
    | "tested"
    | "activated"
    | "used"
    | "failed"
    | "paused"
    | "archived"
    | "marked_stale";
  message: string;
  createdAt: string;
  actor: string;
}
