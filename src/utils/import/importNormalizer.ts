import type { IntegrationConfig, IntegrationStatus } from "../../models/appTypes";
import { PRESETS } from "../../data/mockData";
import type { ColumnMapping, ImportFieldKey, ImportIssue, NewIntegrationImportInput, ParsedImportRow } from "./importSchema";

export interface NormalizeResult {
  normalized?: NewIntegrationImportInput;
  errors: ImportIssue[];
  warnings: ImportIssue[];
}

export function normalizeImportRow(row: ParsedImportRow, mappings: ColumnMapping[], campaignId: string | undefined): NormalizeResult {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const values = mappedValues(row, mappings);
  const direction = values.direction?.toLowerCase();
  const type = values.type?.toLowerCase();
  const method = values.method?.toUpperCase();
  const statusInput = values.status?.toLowerCase() as IntegrationStatus | undefined;
  const status = normalizeStatus(statusInput, warnings);

  if (!values.integration_name) errors.push(issue("integration_name", "required", "Integration name is required."));
  if (!campaignId) errors.push(issue("campaign", "unknown_campaign", "Campaign must match an existing campaign ID or name."));
  if (direction !== "buyer" && direction !== "publisher") errors.push(issue("direction", "invalid_direction", "Direction must be buyer or publisher."));
  if (!["static_number", "rtb", "sip", "webhook", "generic_api"].includes(type || "")) errors.push(issue("type", "invalid_type", "Type is invalid."));
  if (method && method !== "GET" && method !== "POST") errors.push(issue("method", "invalid_method", "Method must be GET or POST."));

  const config: IntegrationConfig = {};
  const preset = values.platform_preset || "custom";
  if (preset !== "custom" && PRESETS[preset]) Object.assign(config, PRESETS[preset].config);
  if (preset !== "custom" && !PRESETS[preset]) warnings.push(issue("platform_preset", "unknown_preset", `Unknown preset '${preset}', falling back to custom.`));

  assignString(config, "method", method === "GET" || method === "POST" ? method : undefined);
  assignString(config, "url", values.url);
  assignString(config, "destinationNumber", values.destination_number);
  assignString(config, "sipAddress", values.sip_address);
  assignString(config, "postingUrl", values.posting_url);
  assignString(config, "publisherId", values.publisher_id);
  assignNumber(config, "timeoutSeconds", values.timeout_seconds, errors, "timeout_seconds", true);
  assignNumber(config, "expiresInSeconds", values.expires_in_seconds, errors, "expires_in_seconds", true);
  assignNumber(config, "payout", values.payout, errors, "payout", false);
  assignNumber(config, "conversionDurationSeconds", values.conversion_duration_seconds, errors, "conversion_duration_seconds", false);

  const requiredFields = parseList(values.required_fields);
  if (requiredFields.length) config.requiredFields = requiredFields;

  parseJsonRecord(values.headers_json, "headers_json", errors, value => config.headers = stringifyRecord(value));
  parseJsonRecord(values.query_params_json, "query_params_json", errors, value => config.queryParams = stringifyRecord(value));
  parseJsonRecord(values.request_body_json, "request_body_json", errors, value => config.requestBody = value);

  config.responseParsing = {
    acceptedPath: values.accepted_path || config.responseParsing?.acceptedPath,
    acceptedValue: parseAcceptedValue(values.accepted_value) ?? config.responseParsing?.acceptedValue,
    destinationNumberPath: values.destination_number_path || config.responseParsing?.destinationNumberPath,
    sipAddressPath: values.sip_address_path || config.responseParsing?.sipAddressPath,
    bidPath: values.bid_path || config.responseParsing?.bidPath,
    conversionDurationPath: values.conversion_duration_path || config.responseParsing?.conversionDurationPath,
    expiresInSecondsPath: values.expires_in_seconds_path || config.responseParsing?.expiresInSecondsPath,
    rejectReasonPath: values.reject_reason_path || config.responseParsing?.rejectReasonPath,
  };
  if (Object.values(config.responseParsing).every(value => value === undefined)) delete config.responseParsing;

  const daily = parseOptionalNumber(values.daily_cap, errors, "daily_cap", true);
  const hourly = parseOptionalNumber(values.hourly_cap, errors, "hourly_cap", true);
  if (daily !== undefined || hourly !== undefined) config.caps = { daily, hourly };
  const scheduleDays = parseList(values.schedule_days);
  if (values.schedule_timezone || scheduleDays.length || values.schedule_start_time || values.schedule_end_time) {
    config.schedule = {
      timezone: values.schedule_timezone || "America/New_York",
      days: scheduleDays.length ? scheduleDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: values.schedule_start_time || "09:00",
      endTime: values.schedule_end_time || "17:00"
    };
  }

  if (errors.length || !campaignId || !direction || !type || !values.integration_name) return { errors, warnings };
  return {
    errors,
    warnings,
    normalized: {
      campaignId,
      name: values.integration_name,
      direction: direction as "buyer" | "publisher",
      type: type as NewIntegrationImportInput["type"],
      platformPreset: PRESETS[preset] ? preset : "custom",
      status,
      config
    }
  };
}

function mappedValues(row: ParsedImportRow, mappings: ColumnMapping[]): Partial<Record<ImportFieldKey, string>> {
  const result: Partial<Record<ImportFieldKey, string>> = {};
  mappings.forEach(mapping => {
    if (mapping.targetField) result[mapping.targetField] = row.raw[mapping.sourceColumn]?.trim() || "";
  });
  return result;
}

function normalizeStatus(status: IntegrationStatus | undefined, warnings: ImportIssue[]): IntegrationStatus {
  if (!status) return "draft";
  if (status === "active") {
    warnings.push(issue("status", "active_downgraded", "Imported integrations must pass a test before activation.", "Status changed to needs_testing."));
    return "needs_testing";
  }
  return ["draft", "needs_testing", "test_passed", "paused", "archived"].includes(status) ? status : "draft";
}

function assignString<Key extends keyof IntegrationConfig>(config: IntegrationConfig, key: Key, value: IntegrationConfig[Key] | undefined) {
  if (value !== undefined && value !== "") config[key] = value;
}

function assignNumber(config: IntegrationConfig, key: keyof IntegrationConfig, value: string | undefined, errors: ImportIssue[], field: string, integer: boolean) {
  const parsed = parseOptionalNumber(value, errors, field, integer);
  if (parsed !== undefined) Object.assign(config, { [key]: parsed });
}

function parseOptionalNumber(value: string | undefined, errors: ImportIssue[], field: string, integer: boolean): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || (integer && !Number.isInteger(parsed))) {
    errors.push(issue(field, "invalid_number", `${field} must be a positive ${integer ? "integer" : "number"}.`));
    return undefined;
  }
  return parsed;
}

function parseJsonRecord(value: string | undefined, field: string, errors: ImportIssue[], onValid: (value: Record<string, unknown>) => void) {
  if (!value) return;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected JSON object.");
    onValid(parsed as Record<string, unknown>);
  } catch (error) {
    errors.push(issue(field, "invalid_json_field", `${field} must be valid JSON object.`, error instanceof Error ? error.message : undefined));
  }
}

function stringifyRecord(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, String(item)]));
}

function parseAcceptedValue(value: string | undefined): string | boolean | number | undefined {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const number = Number(value);
  return Number.isFinite(number) && value.trim() !== "" ? number : value;
}

export function parseList(value: string | undefined): string[] {
  return value ? value.split(/[,;|]/).map(item => item.trim()).filter(Boolean) : [];
}

function issue(field: string, code: string, message: string, fix?: string): ImportIssue {
  return { field, code, message, fix };
}
