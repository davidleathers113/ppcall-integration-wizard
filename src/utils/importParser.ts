import type { IntegrationDirection, IntegrationType, IntegrationStatus, Integration, IntegrationConfig } from "../models/appTypes";
import { PRESETS } from "../data/mockData";

type CampaignLookup = string | { id: string; name: string };

export interface ValidationResult {
  row: number;
  name: string;
  status: "ready" | "warning" | "error";
  message: string;
  parsedData?: Partial<Integration>;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function validateImports(content: string, type: "csv" | "json", existingCampaigns: CampaignLookup[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const seenNames = new Set<string>();
  
  if (type === "csv") {
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return [{ row: 0, name: "File", status: "error", message: "CSV must contain a header row and at least one data row" }];
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (vals.length !== headers.length) {
        results.push({ row: i, name: "Unknown", status: "error", message: "Column count mismatch" });
        continue;
      }
      
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => record[h] = vals[idx]);
      
      validateRow(record, i, existingCampaigns, results, seenNames);
    }
  } else {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        return [{ row: 0, name: "JSON", status: "error", message: "JSON must be an array of objects" }];
      }
      
      parsed.forEach((item: Record<string, unknown>, index) => {
        validateRow(normalizeRecord(item), index + 1, existingCampaigns, results, seenNames);
      });
    } catch {
      return [{ row: 0, name: "JSON", status: "error", message: "Invalid JSON format" }];
    }
  }
  
  return results;
}

function validateRow(record: Record<string, string>, rowIndex: number, existingCampaigns: CampaignLookup[], results: ValidationResult[], seenNames: Set<string>) {
  const name = record.integration_name || record.name;
  const direction = (record.direction || "").toLowerCase() as IntegrationDirection;
  const integrationType = (record.type || "").toLowerCase() as IntegrationType;
  const campaign = resolveCampaign(record.campaign || record.campaign_id, existingCampaigns);
  
  if (!name) {
    results.push({ row: rowIndex, name: `Row ${rowIndex}`, status: "error", message: "Missing required field: integration_name" });
    return;
  }
  
  if (direction !== "publisher" && direction !== "buyer") {
    results.push({ row: rowIndex, name, status: "error", message: "Direction must be 'publisher' or 'buyer'" });
    return;
  }

  if (!integrationType || !["static_number", "rtb", "sip", "webhook", "generic_api"].includes(integrationType)) {
    results.push({ row: rowIndex, name, status: "error", message: "Invalid integration type" });
    return;
  }

  if (!campaign || !existingCampaigns.includes(campaign)) {
    results.push({ row: rowIndex, name, status: "error", message: "Campaign ID does not match any existing campaign" });
    return;
  }

  let status: "ready" | "warning" | "error" = "ready";
  let message = "Ready to import";

  if (seenNames.has(name)) {
    status = "warning";
    message = "Duplicate integration name in import file";
  }
  seenNames.add(name);

  const timeout = record.timeout_seconds || record.timeout;
  let parsedTimeout = 3;
  if (!timeout) {
    status = "warning";
    message = "Missing timeout; defaulting to 3s";
  } else {
    parsedTimeout = parseInt(timeout, 10);
  }

  const configUrl = record.url || "";
  const configMethod = record.method || "POST";
  
  if (direction === "buyer" && (integrationType === "rtb" || integrationType === "generic_api" || integrationType === "webhook")) {
    if (!configUrl) {
      status = "error";
      message = "Buyer API integrations require an endpoint URL";
    }
  }
  if (direction === "buyer" && integrationType === "static_number" && !record.destination_number) {
    status = "error";
    message = "Static buyer integrations require destination_number";
  }

  const preset = record.platform_preset || record.preset;
  let baseConfig: IntegrationConfig = {};
  if (preset && PRESETS[preset]) {
    baseConfig = { ...PRESETS[preset].config };
  } else if (preset) {
    status = "warning";
    message = `Unknown preset '${preset}', falling back to custom setup`;
  }

  if (status !== "error") {
    const finalConfig: IntegrationConfig = {
      ...baseConfig,
      timeoutSeconds: parsedTimeout,
      ...(configUrl ? { url: configUrl } : {}),
      ...(isHttpMethod(configMethod) ? { method: configMethod } : {}),
      ...(record.destination_number ? { destinationNumber: record.destination_number } : {}),
      ...(record.payout ? { payout: parseFloat(record.payout) } : {})
    };

    results.push({
      row: rowIndex,
      name,
      status,
      message,
      parsedData: {
        campaignId: campaign,
        name,
        direction,
        type: integrationType,
        platformPreset: preset && PRESETS[preset] ? preset : "custom",
        status: (record.status as IntegrationStatus) || "draft",
        config: finalConfig
      }
    });
  } else {
    results.push({ row: rowIndex, name, status, message });
  }
}

function isHttpMethod(value: string): value is NonNullable<IntegrationConfig["method"]> {
  return value === "GET" || value === "POST";
}

function normalizeRecord(item: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)]));
}

function resolveCampaign(value: string, existingCampaigns: CampaignLookup[]): string {
  const normalized = value.trim().toLowerCase();
  const match = existingCampaigns.find(campaign => {
    if (typeof campaign === "string") return campaign.toLowerCase() === normalized;
    return campaign.id.toLowerCase() === normalized || campaign.name.toLowerCase() === normalized;
  });
  return typeof match === "string" ? match : match?.id || "";
}
