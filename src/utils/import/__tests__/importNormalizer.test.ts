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
});
