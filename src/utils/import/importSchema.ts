import type { Campaign, Integration, IntegrationConfig, IntegrationDirection, IntegrationStatus, IntegrationType } from "../../models/appTypes";

export type ImportMode = "csv" | "json";
export type ImportStep = "source" | "mapping" | "validation" | "preview" | "complete";

export type ImportFieldKey =
  | "integration_name"
  | "campaign"
  | "direction"
  | "type"
  | "platform_preset"
  | "status"
  | "method"
  | "url"
  | "destination_number"
  | "sip_address"
  | "publisher_id"
  | "posting_url"
  | "timeout_seconds"
  | "expires_in_seconds"
  | "payout"
  | "conversion_duration_seconds"
  | "required_fields"
  | "headers_json"
  | "query_params_json"
  | "request_body_json"
  | "accepted_path"
  | "accepted_value"
  | "destination_number_path"
  | "sip_address_path"
  | "bid_path"
  | "conversion_duration_path"
  | "expires_in_seconds_path"
  | "reject_reason_path"
  | "daily_cap"
  | "hourly_cap"
  | "schedule_timezone"
  | "schedule_days"
  | "schedule_start_time"
  | "schedule_end_time";

export interface ParsedImportRow {
  rowNumber: number;
  raw: Record<string, string>;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: ImportFieldKey | "";
  confidence?: number;
  required?: boolean;
}

export interface ImportIssue {
  field?: string;
  code: string;
  message: string;
  fix?: string;
}

export interface NewIntegrationImportInput {
  campaignId: string;
  name: string;
  direction: IntegrationDirection;
  type: IntegrationType;
  platformPreset: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
}

export interface ImportValidationResult {
  rowNumber: number;
  name: string;
  severity: "ready" | "warning" | "error";
  errors: ImportIssue[];
  warnings: ImportIssue[];
  normalized?: NewIntegrationImportInput;
}

export interface ImportSession {
  id: string;
  mode: ImportMode;
  rawContent: string;
  parsedRows: ParsedImportRow[];
  columnMappings: ColumnMapping[];
  validationResults: ImportValidationResult[];
  importableRows: ImportValidationResult[];
  importedIntegrationIds: string[];
  createdAt: string;
  status: "draft" | "parsed" | "mapped" | "validated" | "imported" | "failed";
}

export interface ParseResult {
  rows: ParsedImportRow[];
  headers: string[];
  errors: ImportIssue[];
}

export interface ValidationContext {
  campaigns: Campaign[];
  integrations: Integration[];
  maxRows: number;
}

export const IMPORT_FIELDS: Record<ImportFieldKey, { label: string; required?: boolean; aliases: string[] }> = {
  integration_name: { label: "Integration Name", required: true, aliases: ["name", "integration", "integrationName", "integration name"] },
  campaign: { label: "Campaign", required: true, aliases: ["campaign_id", "campaignId", "campaign name"] },
  direction: { label: "Direction", required: true, aliases: ["side", "integration_direction"] },
  type: { label: "Type", required: true, aliases: ["integration_type", "route_type"] },
  platform_preset: { label: "Platform Preset", aliases: ["preset", "platformPreset"] },
  status: { label: "Status", aliases: [] },
  method: { label: "Method", aliases: [] },
  url: { label: "URL", aliases: ["endpoint", "endpoint_url", "ping_url"] },
  destination_number: { label: "Destination Number", aliases: ["phone_number", "transfer_number", "number"] },
  sip_address: { label: "SIP Address", aliases: ["sip"] },
  publisher_id: { label: "Publisher ID", aliases: ["publisherId", "pub_id"] },
  posting_url: { label: "Posting URL", aliases: ["postingUrl", "post_url"] },
  timeout_seconds: { label: "Timeout Seconds", aliases: ["timeout", "timeout_sec"] },
  expires_in_seconds: { label: "Expires In Seconds", aliases: ["expiration", "expireInSeconds"] },
  payout: { label: "Payout", aliases: ["bid", "price"] },
  conversion_duration_seconds: { label: "Conversion Duration Seconds", aliases: ["conversion_duration"] },
  required_fields: { label: "Required Fields", aliases: ["required", "required_tokens"] },
  headers_json: { label: "Headers JSON", aliases: ["headers"] },
  query_params_json: { label: "Query Params JSON", aliases: ["query_params", "params"] },
  request_body_json: { label: "Request Body JSON", aliases: ["request_body", "body"] },
  accepted_path: { label: "Accepted Path", aliases: ["acceptedPath", "response_accepted_path"] },
  accepted_value: { label: "Accepted Value", aliases: ["acceptedValue"] },
  destination_number_path: { label: "Destination Number Path", aliases: ["destination_path", "phone_number_path"] },
  sip_address_path: { label: "SIP Address Path", aliases: ["sip_path"] },
  bid_path: { label: "Bid Path", aliases: ["payout_path"] },
  conversion_duration_path: { label: "Conversion Duration Path", aliases: [] },
  expires_in_seconds_path: { label: "Expires Seconds Path", aliases: ["expiration_path"] },
  reject_reason_path: { label: "Reject Reason Path", aliases: ["reject_path", "reason_path"] },
  daily_cap: { label: "Daily Cap", aliases: ["daily"] },
  hourly_cap: { label: "Hourly Cap", aliases: ["hourly"] },
  schedule_timezone: { label: "Schedule Timezone", aliases: ["timezone"] },
  schedule_days: { label: "Schedule Days", aliases: ["days"] },
  schedule_start_time: { label: "Schedule Start Time", aliases: ["start_time"] },
  schedule_end_time: { label: "Schedule End Time", aliases: ["end_time"] },
};

export const IMPORT_FIELD_KEYS = Object.keys(IMPORT_FIELDS) as ImportFieldKey[];

export function normalizeHeader(value: string): string {
  // Remove BOM (Byte Order Mark) if present - using string methods instead of regex
  let normalized = value.trim();
  if (normalized.charCodeAt(0) === 0xFEFF) {
    normalized = normalized.substring(1);
  }

  // Replace spaces and hyphens with underscores - using string methods instead of regex
  normalized = normalized.toLowerCase();
  const chars = normalized.split('');
  let result = '';
  let lastWasUnderscore = false;

  for (const char of chars) {
    if (char === ' ' || char === '-') {
      if (!lastWasUnderscore && result.length > 0) {
        result += '_';
        lastWasUnderscore = true;
      }
    } else {
      result += char;
      lastWasUnderscore = false;
    }
  }

  return result;
}

export function autoMapColumn(sourceColumn: string): ColumnMapping {
  const normalized = normalizeHeader(sourceColumn);
  for (const field of IMPORT_FIELD_KEYS) {
    const candidates = [field, ...IMPORT_FIELDS[field].aliases].map(normalizeHeader);
    if (candidates.includes(normalized)) {
      return { sourceColumn, targetField: field, confidence: field === normalized ? 1 : 0.85, required: IMPORT_FIELDS[field].required };
    }
  }
  return { sourceColumn, targetField: "", confidence: 0 };
}

export function resolveCampaignId(value: string, campaigns: Campaign[]): string | undefined {
  const normalized = value.trim().toLowerCase();
  return campaigns.find(campaign => campaign.id.toLowerCase() === normalized || campaign.name.trim().toLowerCase() === normalized)?.id;
}
