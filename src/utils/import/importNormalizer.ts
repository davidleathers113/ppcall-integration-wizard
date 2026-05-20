import type {
  BuyerDestinationKind,
  CapOnMode,
  IntegrationConfig,
  IntegrationStatus,
  ShareableTagsConfig,
} from "../../models/appTypes";
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
  // Direct target "number" alias takes precedence if provided.
  const numberValue = values.number || values.destination_number;
  assignString(config, "destinationNumber", numberValue);
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
  const global = parseOptionalNumber(values.global_cap, errors, "global_cap", true);
  const monthly = parseOptionalNumber(values.monthly_cap, errors, "monthly_cap", true);
  const concurrency = parseOptionalNumber(values.concurrency_cap, errors, "concurrency_cap", true);
  if (
    daily !== undefined ||
    hourly !== undefined ||
    global !== undefined ||
    monthly !== undefined ||
    concurrency !== undefined ||
    values.cap_on
  ) {
    const capOn: CapOnMode | undefined =
      values.cap_on === "connected_calls" ||
      values.cap_on === "converted_calls" ||
      values.cap_on === "revenue"
        ? values.cap_on
        : undefined;
    config.caps = {
      daily,
      hourly,
      global,
      monthly,
      concurrency,
      capOn,
    };
  }
  const scheduleDays = parseList(values.schedule_days);
  if (
    values.schedule_timezone ||
    scheduleDays.length ||
    values.schedule_start_time ||
    values.schedule_end_time ||
    values.schedule_mode
  ) {
    const mode =
      values.schedule_mode === "always_open" ||
      values.schedule_mode === "basic" ||
      values.schedule_mode === "advanced"
        ? values.schedule_mode
        : "basic";
    config.schedule = {
      timezone: values.schedule_timezone || "America/New_York",
      days: scheduleDays.length ? scheduleDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: values.schedule_start_time || "09:00",
      endTime: values.schedule_end_time || "17:00",
      mode,
    };
  }

  // Direct target fields
  const kind = normalizeBuyerDestinationKind(values.buyer_destination_kind, values.target_mode, type);
  if (kind) config.buyerDestinationKind = kind;

  parseJsonRecord(values.sip_headers_json, "sip_headers_json", errors, sipHeaders => {
    const headers = stringifyRecord(sipHeaders);
    config.destination = { ...(config.destination || {}), sipHeaders: headers };
  });

  if (kind === "direct_number") {
    config.destinationMode = "static_number";
    const number = numberValue;
    if (number) {
      config.destination = { ...(config.destination || {}), number };
    } else {
      errors.push(issue("number", "missing_destination", "Direct Number Target requires a destination number."));
    }
  } else if (kind === "direct_sip") {
    config.destinationMode = "static_sip";
    if (values.sip_address) {
      config.destination = { ...(config.destination || {}), sipAddress: values.sip_address };
    } else {
      errors.push(issue("sip_address", "missing_sip", "Direct SIP Target requires a SIP address."));
    }
  }

  const connectionTimeout = parseOptionalNumber(
    values.connection_timeout_seconds,
    errors,
    "connection_timeout_seconds",
    true
  );
  const revenueRecovery = normalizeRevenueRecovery(values.revenue_recovery);
  if (connectionTimeout !== undefined || revenueRecovery !== undefined) {
    config.callHandling = {
      connectionTimeoutSeconds: connectionTimeout,
      revenueRecovery,
    };
  }

  if (values.dial_ivr_enabled || values.dial_ivr_digits) {
    config.dialIvr = {
      enabled: parseBoolean(values.dial_ivr_enabled),
      digits: values.dial_ivr_digits || undefined,
    };
  }

  if (values.recordings) {
    if (["account_default", "enabled", "disabled"].includes(values.recordings)) {
      config.recordingSettings = { mode: values.recordings as "account_default" | "enabled" | "disabled" };
    } else {
      warnings.push(issue("recordings", "invalid_recordings", `Unknown recordings value '${values.recordings}'.`));
    }
  }

  if (values.duplicate_mode) {
    if (
      ["campaign_default", "buyer_default", "do_not_restrict", "restrict"].includes(values.duplicate_mode)
    ) {
      const duplicateWindow = parseOptionalNumber(
        values.duplicate_window_minutes,
        errors,
        "duplicate_window_minutes",
        true
      );
      config.duplicateRules = {
        mode: values.duplicate_mode as "campaign_default" | "buyer_default" | "do_not_restrict" | "restrict",
        windowMinutes: duplicateWindow,
      };
      if (config.duplicateRules.mode === "restrict" && duplicateWindow === undefined) {
        errors.push(issue("duplicate_window_minutes", "missing_window", "Restrict duplicates requires a window."));
      }
    } else {
      warnings.push(issue("duplicate_mode", "invalid_duplicate_mode", `Unknown duplicate_mode '${values.duplicate_mode}'.`));
    }
  }

  if (values.shareable_tags_mode || values.shareable_tags || values.share_inbound_call_id) {
    const shareableTagsMode: ShareableTagsConfig["mode"] =
      values.shareable_tags_mode === "buyer_default" ||
      values.shareable_tags_mode === "campaign_default" ||
      values.shareable_tags_mode === "override"
        ? values.shareable_tags_mode
        : "buyer_default";
    config.shareableTags = {
      mode: shareableTagsMode,
      shareInboundCallId: parseBoolean(values.share_inbound_call_id),
      tags: parseList(values.shareable_tags),
    };
  }

  if (values.predictive_routing_mode || values.priority_bump) {
    config.predictiveRouting = {
      mode:
        values.predictive_routing_mode === "estimated_revenue" ? "estimated_revenue" : "campaign_default",
      priorityBump: parseOptionalNumber(values.priority_bump, errors, "priority_bump", true) ?? 0,
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

function normalizeBuyerDestinationKind(
  value: string | undefined,
  targetMode: string | undefined,
  type: string | undefined
): BuyerDestinationKind | undefined {
  if (value) {
    if (
      value === "direct_number" ||
      value === "direct_sip" ||
      value === "rtb" ||
      value === "webhook" ||
      value === "generic_api"
    ) {
      return value;
    }
  }
  if (targetMode === "number" && type === "static_number") return "direct_number";
  if (targetMode === "sip" && type === "sip") return "direct_sip";
  return undefined;
}

function normalizeRevenueRecovery(value: string | undefined): "buyer_default" | "enabled" | "disabled" | undefined {
  if (value === "buyer_default" || value === "enabled" || value === "disabled") return value;
  return undefined;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lowered = value.trim().toLowerCase();
  return lowered === "true" || lowered === "yes" || lowered === "1";
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
  if (!value) return [];
  // Split on comma, semicolon, or pipe — using string methods (no regex).
  const tokens: string[] = [];
  let current = "";
  for (const ch of value) {
    if (ch === "," || ch === ";" || ch === "|") {
      tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  tokens.push(current);
  return tokens.map(item => item.trim()).filter(Boolean);
}

function issue(field: string, code: string, message: string, fix?: string): ImportIssue {
  return { field, code, message, fix };
}
