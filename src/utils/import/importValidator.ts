import { PRESETS } from "../../data/mockData";
import type { ColumnMapping, ImportFieldKey, ImportIssue, ImportValidationResult, NewIntegrationImportInput, ParsedImportRow, ValidationContext } from "./importSchema";
import { IMPORT_FIELDS, IMPORT_FIELD_KEYS, resolveCampaignId } from "./importSchema";
import { normalizeImportRow } from "./importNormalizer";

export function validateColumnMappings(mappings: ColumnMapping[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const mappedFields = mappings.map(mapping => mapping.targetField).filter((field): field is ImportFieldKey => Boolean(field));
  Object.entries(IMPORT_FIELDS).forEach(([field, meta]) => {
    const importField = field as ImportFieldKey;
    if (meta.required && !mappedFields.includes(importField)) issues.push({ field, code: "missing_required_mapping", message: `${meta.label} must be mapped.` });
  });
  mappedFields.forEach(field => {
    if (!IMPORT_FIELD_KEYS.includes(field as never)) issues.push({ field, code: "invalid_mapping", message: `Invalid mapped field '${field}'.` });
    if (mappedFields.filter(item => item === field).length > 1) issues.push({ field, code: "duplicate_mapping", message: `${field} is mapped more than once.` });
  });
  return uniqueIssues(issues);
}

export function validateRows(rows: ParsedImportRow[], mappings: ColumnMapping[], context: ValidationContext): ImportValidationResult[] {
  const nameCounts = new Map<string, number>();
  rows.forEach(row => {
    const name = valueFor(row, mappings, "integration_name").toLowerCase();
    if (name) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });

  return rows.map(row => {
    const campaignValue = valueFor(row, mappings, "campaign");
    const campaignId = resolveCampaignId(campaignValue, context.campaigns);
    const normalized = normalizeImportRow(row, mappings, campaignId);
    const warnings = [...normalized.warnings];
    const errors = [...normalized.errors];
    const name = normalized.normalized?.name || valueFor(row, mappings, "integration_name") || `Row ${row.rowNumber}`;

    if (nameCounts.get(name.toLowerCase()) && nameCounts.get(name.toLowerCase())! > 1) {
      warnings.push({ field: "integration_name", code: "duplicate_in_file", message: "Duplicate integration name within this import file.", fix: "Update existing integrations will be supported in a later version." });
    }
    if (context.integrations.some(integration => integration.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      warnings.push({ field: "integration_name", code: "duplicate_existing", message: "An integration with this name already exists.", fix: "Update existing integrations will be supported in a later version." });
    }

    if (normalized.normalized) businessRules(normalized.normalized, errors, warnings);
    const severity = errors.length ? "error" : warnings.length ? "warning" : "ready";
    return { rowNumber: row.rowNumber, name, severity, errors, warnings, normalized: normalized.normalized };
  });
}

function businessRules(row: NewIntegrationImportInput, errors: ImportIssue[], warnings: ImportIssue[]) {
  const config = row.config;
  if (row.direction === "buyer" && ["rtb", "generic_api", "webhook"].includes(row.type)) {
    if (!config.url) errors.push({ field: "url", code: "url_required", message: "Buyer API-style integrations require URL." });
    if (!config.method) errors.push({ field: "method", code: "method_required", message: "Buyer API-style integrations require method." });
    if ((row.type === "rtb" || row.type === "generic_api") && !config.responseParsing?.acceptedPath) warnings.push({ field: "accepted_path", code: "parser_recommended", message: "Buyer RTB/API rows should include response parser fields." });
  }
  if (row.direction === "buyer" && row.type === "static_number") {
    if (!config.destinationNumber) errors.push({ field: "destination_number", code: "destination_required", message: "Static buyer requires destination number." });
    if (!config.payout) warnings.push({ field: "payout", code: "payout_recommended", message: "Static buyer should include payout." });
    if (!config.conversionDurationSeconds) warnings.push({ field: "conversion_duration_seconds", code: "duration_recommended", message: "Static buyer should include conversion duration." });
  }
  if (row.direction === "publisher") {
    if (!config.publisherId) errors.push({ field: "publisher_id", code: "publisher_required", message: "Publisher integrations require publisher_id." });
    if (row.type === "rtb") {
      if (!config.postingUrl) errors.push({ field: "posting_url", code: "posting_url_required", message: "Publisher RTB requires posting_url." });
      if (!config.requiredFields?.length) errors.push({ field: "required_fields", code: "required_fields_required", message: "Publisher RTB requires required_fields." });
      if (!config.expiresInSeconds) errors.push({ field: "expires_in_seconds", code: "expiration_required", message: "Publisher RTB requires expires_in_seconds." });
      if (config.requiredFields?.length && !config.requiredFields.includes("caller_id")) warnings.push({ field: "required_fields", code: "caller_id_recommended", message: "required_fields should include caller_id." });
    }
    if (row.type === "static_number" && !config.destinationNumber) errors.push({ field: "destination_number", code: "publisher_static_destination", message: "Publisher static number requires destination_number." });
    if (row.type === "sip" && !config.sipAddress) errors.push({ field: "sip_address", code: "publisher_sip_required", message: "Publisher SIP requires sip_address." });
  }
  if (row.platformPreset !== "custom" && !PRESETS[row.platformPreset]) warnings.push({ field: "platform_preset", code: "unknown_preset", message: "Unknown preset falls back to custom." });
}

function valueFor(row: ParsedImportRow, mappings: ColumnMapping[], field: string): string {
  const mapping = mappings.find(item => item.targetField === field);
  return mapping ? row.raw[mapping.sourceColumn]?.trim() || "" : "";
}

function uniqueIssues(issues: ImportIssue[]): ImportIssue[] {
  return issues.filter((issue, index) => issues.findIndex(item => item.field === issue.field && item.code === issue.code) === index);
}
