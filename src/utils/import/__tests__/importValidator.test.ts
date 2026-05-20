import { describe, expect, it } from "vitest";
import type { Campaign, Integration } from "../../../models/appTypes";
import type { ParsedImportRow } from "../importSchema";
import { autoMapColumn, resolveCampaignId } from "../importSchema";
import { validateRows } from "../importValidator";

const campaigns: Campaign[] = [{ id: "camp_hvac", name: "HVAC Inbound", vertical: "Home Services", status: "active", createdAt: "2026-01-01T00:00:00Z" }];
const existing: Integration[] = [{
  id: "int_existing",
  campaignId: "camp_hvac",
  name: "Existing Buyer",
  direction: "buyer",
  type: "rtb",
  platformPreset: "custom",
  status: "draft",
  config: {},
  createdAt: "2026-01-01T00:00:00Z",
  createdBy: "User",
  updatedAt: "2026-01-01T00:00:00Z",
  updatedBy: "User",
  usageCount: 0,
  errorRate: 0
}];
const mappings = ["integration_name", "campaign", "direction", "type", "platform_preset", "method", "url", "destination_number", "publisher_id", "posting_url", "required_fields", "expires_in_seconds", "status"].map(autoMapColumn);

describe("import validator", () => {
  it("resolves campaign by ID and name", () => {
    expect(resolveCampaignId("camp_hvac", campaigns)).toBe("camp_hvac");
    expect(resolveCampaignId("hvac inbound", campaigns)).toBe("camp_hvac");
  });

  it("validates buyer RTB, static buyer, and publisher RTB rows", () => {
    const rows: ParsedImportRow[] = [
      { rowNumber: 2, raw: { integration_name: "Buyer RTB", campaign: "HVAC Inbound", direction: "buyer", type: "rtb", method: "POST", url: "https://buyer.example" } },
      { rowNumber: 3, raw: { integration_name: "Static Buyer", campaign: "camp_hvac", direction: "buyer", type: "static_number", destination_number: "+18005551212" } },
      { rowNumber: 4, raw: { integration_name: "Publisher RTB", campaign: "camp_hvac", direction: "publisher", type: "rtb", publisher_id: "pub_1", posting_url: "https://post.example", required_fields: "caller_id,zip", expires_in_seconds: "30" } }
    ];
    const results = validateRows(rows, mappings, { campaigns, integrations: [], maxRows: 50 });
    expect(results.every(result => result.severity !== "error")).toBe(true);
  });

  it("reports unknown campaign, duplicate names, existing duplicates, unknown preset, and active downgrade", () => {
    const rows: ParsedImportRow[] = [
      { rowNumber: 2, raw: { integration_name: "Dupe", campaign: "Missing", direction: "buyer", type: "rtb", method: "POST", url: "https://buyer.example", platform_preset: "unknown", status: "active" } },
      { rowNumber: 3, raw: { integration_name: "Dupe", campaign: "camp_hvac", direction: "buyer", type: "rtb", method: "POST", url: "https://buyer.example" } },
      { rowNumber: 4, raw: { integration_name: "Existing Buyer", campaign: "camp_hvac", direction: "buyer", type: "rtb", method: "POST", url: "https://buyer.example" } }
    ];
    const results = validateRows(rows, mappings, { campaigns, integrations: existing, maxRows: 50 });
    expect(results[0].errors.some(error => error.code === "unknown_campaign")).toBe(true);
    expect(results[0].warnings.some(warning => warning.code === "active_downgraded")).toBe(true);
    expect(results[1].warnings.some(warning => warning.code === "duplicate_in_file")).toBe(true);
    expect(results[2].warnings.some(warning => warning.code === "duplicate_existing")).toBe(true);
  });
});
