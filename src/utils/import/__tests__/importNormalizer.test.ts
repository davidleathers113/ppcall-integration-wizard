import { describe, expect, it } from "vitest";
import { autoMapColumn } from "../importSchema";
import { normalizeImportRow, parseList } from "../importNormalizer";

const mappings = ["integration_name", "campaign", "direction", "type", "method", "url", "required_fields", "headers_json", "accepted_path", "destination_number_path"].map(autoMapColumn);

describe("import normalizer", () => {
  it("normalizes a valid buyer RTB row", () => {
    const result = normalizeImportRow({
      rowNumber: 2,
      raw: {
        integration_name: " Buyer ",
        campaign: "HVAC Inbound",
        direction: "Buyer",
        type: "RTB",
        method: "post",
        url: "https://buyer.example/ping",
        required_fields: "caller_id|zip",
        headers_json: '{"Authorization":"Bearer test"}',
        accepted_path: "$.accepted",
        destination_number_path: "$.phone_number"
      }
    }, mappings, "camp_hvac");
    expect(result.normalized?.direction).toBe("buyer");
    expect(result.normalized?.config.method).toBe("POST");
    expect(result.normalized?.config.requiredFields).toEqual(["caller_id", "zip"]);
    expect(result.normalized?.config.headers?.Authorization).toBe("Bearer test");
  });

  it("parses list fields and reports invalid JSON fields", () => {
    expect(parseList("caller_id;zip|state")).toEqual(["caller_id", "zip", "state"]);
    const result = normalizeImportRow({ rowNumber: 2, raw: { integration_name: "Buyer", campaign: "HVAC", direction: "buyer", type: "rtb", headers_json: "{bad" } }, mappings, "camp_hvac");
    expect(result.errors.some(error => error.code === "invalid_json_field")).toBe(true);
  });

  describe("direct target import", () => {
    const directMappings = [
      "integration_name",
      "campaign",
      "direction",
      "type",
      "buyer_destination_kind",
      "target_mode",
      "number",
      "sip_address",
      "connection_timeout_seconds",
      "daily_cap",
      "concurrency_cap",
      "schedule_timezone",
      "schedule_mode",
      "duplicate_mode",
      "duplicate_window_minutes",
      "payout",
      "conversion_duration_seconds",
      "status",
    ].map(autoMapColumn);

    it("normalizes a direct number target", () => {
      const result = normalizeImportRow(
        {
          rowNumber: 2,
          raw: {
            integration_name: "Acme Direct Number",
            campaign: "HVAC Inbound",
            direction: "buyer",
            type: "static_number",
            buyer_destination_kind: "direct_number",
            target_mode: "number",
            number: "+18005551212",
            connection_timeout_seconds: "30",
            daily_cap: "100",
            concurrency_cap: "5",
            schedule_timezone: "America/New_York",
            schedule_mode: "always_open",
            duplicate_mode: "buyer_default",
            payout: "35",
            conversion_duration_seconds: "120",
          },
        },
        directMappings,
        "camp_hvac"
      );
      expect(result.errors).toEqual([]);
      const config = result.normalized?.config;
      expect(config?.buyerDestinationKind).toBe("direct_number");
      expect(config?.destinationMode).toBe("static_number");
      expect(config?.destination?.number).toBe("+18005551212");
      expect(config?.callHandling?.connectionTimeoutSeconds).toBe(30);
      expect(config?.caps?.daily).toBe(100);
      expect(config?.caps?.concurrency).toBe(5);
      expect(config?.schedule?.mode).toBe("always_open");
      expect(config?.duplicateRules?.mode).toBe("buyer_default");
    });

    it("normalizes a direct sip target", () => {
      const result = normalizeImportRow(
        {
          rowNumber: 2,
          raw: {
            integration_name: "Acme Direct SIP",
            campaign: "HVAC Inbound",
            direction: "buyer",
            type: "sip",
            buyer_destination_kind: "direct_sip",
            target_mode: "sip",
            sip_address: "sip:buyer@example.com",
            connection_timeout_seconds: "30",
            daily_cap: "50",
            concurrency_cap: "5",
            schedule_timezone: "America/New_York",
            payout: "35",
            conversion_duration_seconds: "120",
          },
        },
        directMappings,
        "camp_hvac"
      );
      expect(result.errors).toEqual([]);
      const config = result.normalized?.config;
      expect(config?.buyerDestinationKind).toBe("direct_sip");
      expect(config?.destination?.sipAddress).toBe("sip:buyer@example.com");
    });

    it("flags missing destination for direct number", () => {
      const result = normalizeImportRow(
        {
          rowNumber: 2,
          raw: {
            integration_name: "Acme Direct Number",
            campaign: "HVAC Inbound",
            direction: "buyer",
            type: "static_number",
            buyer_destination_kind: "direct_number",
            target_mode: "number",
            payout: "35",
            conversion_duration_seconds: "120",
          },
        },
        directMappings,
        "camp_hvac"
      );
      expect(result.errors.some(e => e.code === "missing_destination")).toBe(true);
    });

    it("downgrades imported active direct target to needs_testing", () => {
      const result = normalizeImportRow(
        {
          rowNumber: 2,
          raw: {
            integration_name: "Acme Direct Number",
            campaign: "HVAC Inbound",
            direction: "buyer",
            type: "static_number",
            buyer_destination_kind: "direct_number",
            target_mode: "number",
            number: "+18005551212",
            payout: "35",
            conversion_duration_seconds: "120",
            status: "active",
          },
        },
        directMappings,
        "camp_hvac"
      );
      expect(result.normalized?.status).toBe("needs_testing");
      expect(result.warnings.some(w => w.code === "active_downgraded")).toBe(true);
    });
  });
});
