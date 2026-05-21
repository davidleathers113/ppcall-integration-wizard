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

export type CapOnMode = "connected_calls" | "converted_calls" | "revenue";

export interface IntegrationCaps {
  daily?: number;
  hourly?: number;
  capOn?: CapOnMode;
  global?: number;
  monthly?: number;
  concurrency?: number;
}

export interface IntegrationScheduleBreak {
  day?: string;
  startTime: string;
  endTime: string;
}

export interface IntegrationScheduleDayRule {
  day: string;
  enabled: boolean;
  startTime?: string;
  endTime?: string;
}

export interface IntegrationSchedule {
  timezone: string;
  days: string[];
  startTime: string;
  endTime: string;
  mode?: "always_open" | "basic" | "advanced";
  breaks?: IntegrationScheduleBreak[];
  dayRules?: IntegrationScheduleDayRule[];
}

export type DestinationMode =
  | "static_number"
  | "static_sip"
  | "dynamic_number_from_response"
  | "dynamic_sip_from_response";

export interface DestinationConfig {
  number?: string;
  sipAddress?: string;
  sipHeaders?: Record<string, string>;
  dynamicNumberPath?: string;
  dynamicSipPath?: string;
}

export type BuyerDestinationKind =
  | "direct_number"
  | "direct_sip"
  | "rtb"
  | "webhook"
  | "generic_api";

export type RevenueRecoveryMode = "buyer_default" | "enabled" | "disabled";

export interface CallHandlingConfig {
  connectionTimeoutSeconds?: number;
  revenueRecovery?: RevenueRecoveryMode;
}

export interface CapUsage {
  globalUsed?: number;
  monthlyUsed?: number;
  dailyUsed?: number;
  hourlyUsed?: number;
  currentConcurrency?: number;
}

export type ShareableTagsMode = "campaign_default" | "buyer_default" | "override";

export interface ShareableTagsConfig {
  mode: ShareableTagsMode;
  shareInboundCallId?: boolean;
  tags?: string[];
}

export type PredictiveRoutingMode = "campaign_default" | "estimated_revenue";

export interface PredictiveRoutingConfig {
  mode: PredictiveRoutingMode;
  priorityBump?: number;
}

export type AuthenticationMode = "none" | "api_key" | "bearer_token" | "basic";
export type RequestContentType =
  | "application/json"
  | "application/x-www-form-urlencoded"
  | "text/plain";

export interface RequestConfig {
  method?: "GET" | "POST";
  url?: string;
  authenticationMode?: AuthenticationMode;
  contentType?: RequestContentType;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown> | string;
  timeoutSeconds?: number;
}

export interface ParsingStep {
  id: string;
  type:
    | "json_path"
    | "static_value"
    | "normalize_phone"
    | "number_parse"
    | "text_contains";
  value: string;
}

export interface ResponseParsingPipelines {
  acceptance?: ParsingStep[];
  destination?: ParsingStep[];
  bid?: ParsingStep[];
  duration?: ParsingStep[];
  rejection?: ParsingStep[];
}

export type DuplicateRulesMode =
  | "campaign_default"
  | "buyer_default"
  | "do_not_restrict"
  | "restrict";

export interface DuplicateRules {
  mode: DuplicateRulesMode;
  windowMinutes?: number;
}

export type RecordingMode = "account_default" | "enabled" | "disabled";

export interface RecordingSettings {
  mode: RecordingMode;
}

export type RevenueMode = "campaign_default" | "buyer_default" | "override";

export interface RevenueSettings {
  mode: RevenueMode;
  payout?: number;
  minimumRevenue?: number;
  conversionDurationSeconds?: number;
  dynamicBidPath?: string;
  dynamicDurationPath?: string;
}

export type ErrorMode = "ring_tree_default" | "custom";
export type ErrorFallbackBehavior =
  | "continue_to_next_buyer"
  | "stop_routing"
  | "mark_failed";

export interface ErrorSettings {
  mode: ErrorMode;
  fallbackBehavior?: ErrorFallbackBehavior;
}

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "in_list"
  | "not_in_list"
  | "exists"
  | "does_not_exist";

export interface FilterRule {
  id: string;
  group: "and" | "or";
  field: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
}

export interface DialIvrSettings {
  enabled: boolean;
  digits?: string;
}

export interface ShareableSpecConfig {
  slug: string;
  createdAt: string;
  createdBy: string;
  revokedAt?: string;
  expiresAt?: string;
  visibleFields?: string[];
  endpointOverride?: string;
  notes?: string;
  defaultSourceId?: string;
}

export interface PublisherSource {
  id: string;
  name: string;
  publisherId: string;
  sourceId?: string;
  subAffiliateId?: string;
  status: IntegrationStatus;
  requiredFields: string[];
  postingUrl?: string;
  caps?: IntegrationCaps;
  payoutOverride?: number;
  lastUsedAt?: string;
  usageCount: number;
  errorRate: number;
}

export interface BuyerTarget {
  id: string;
  name: string;
  status: IntegrationStatus;
  priority: number;
  weight: number;
  type: IntegrationType;
  config: IntegrationConfig;
  caps?: IntegrationCaps;
  schedule?: IntegrationSchedule;
  lastTestedAt?: string;
  lastSuccessfulTestAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  errorRate: number;
}

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
    pipelines?: ResponseParsingPipelines;
  };
  timeoutSeconds?: number;
  expiresInSeconds?: number;
  payout?: number;
  conversionDurationSeconds?: number;
  caps?: IntegrationCaps;
  schedule?: IntegrationSchedule;
  publisherSources?: PublisherSource[];
  buyerTargets?: BuyerTarget[];
  routing?: {
    strategy: "priority" | "weighted" | "round_robin" | "waterfall";
    fallbackTargetId?: string;
  };
  destinationMode?: DestinationMode;
  destination?: DestinationConfig;
  request?: RequestConfig;
  duplicateRules?: DuplicateRules;
  recordingSettings?: RecordingSettings;
  revenueSettings?: RevenueSettings;
  errorSettings?: ErrorSettings;
  filters?: FilterRule[];
  dialIvr?: DialIvrSettings;
  buyerDestinationKind?: BuyerDestinationKind;
  callHandling?: CallHandlingConfig;
  capUsage?: CapUsage;
  shareableTags?: ShareableTagsConfig;
  predictiveRouting?: PredictiveRoutingConfig;
  shareableSpec?: ShareableSpecConfig;
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
    | "target_tested"
    | "activated"
    | "used"
    | "source_used"
    | "target_used"
    | "failed"
    | "paused"
    | "archived"
    | "marked_stale";
  message: string;
  createdAt: string;
  actor: string;
}
