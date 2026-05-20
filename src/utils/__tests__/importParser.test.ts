import { describe, expect, it } from "vitest";
import { parseCSVLine, validateImports } from "../importParser";

const campaigns = ["camp_hvac", "camp_plumbing"];

describe("importParser", () => {
  it("validates buyer RTB and static CSV rows", () => {
    const csv = [
      "integration_name,type,direction,campaign_id,url,method,destination_number,payout,timeout_seconds",
      "Buyer RTB,rtb,buyer,camp_hvac,https://buyer.example/ping,POST,,,3",
      "Static Buyer,static_number,buyer,camp_hvac,,, +18005551212,25,3"
    ].join("\n");
    const results = validateImports(csv, "csv", campaigns);
    expect(results[0].status).toBe("ready");
    expect(results[1].status).toBe("ready");
  });

  it("reports row-level CSV errors", () => {
    expect(validateImports("integration_name,type,direction,campaign_id\n,rtb,buyer,camp_hvac", "csv", campaigns)[0].status).toBe("error");
    expect(validateImports("integration_name,type,direction,campaign_id\nBad,rtb,side,camp_hvac", "csv", campaigns)[0].message).toContain("Direction");
    expect(validateImports("integration_name,type,direction,campaign_id\nBad,nope,buyer,camp_hvac", "csv", campaigns)[0].message).toContain("Invalid integration type");
    expect(validateImports("integration_name,type,direction,campaign_id\nBad,rtb,buyer,camp_unknown", "csv", campaigns)[0].message).toContain("Campaign");
    expect(validateImports("integration_name,type,direction,campaign_id\nBad,rtb,buyer,camp_hvac", "csv", campaigns)[0].message).toContain("URL");
    expect(validateImports("integration_name,type,direction,campaign_id\nBad,static_number,buyer,camp_hvac", "csv", campaigns)[0].message).toContain("destination_number");
  });

  it("defaults timeout and parses quoted CSV", () => {
    const row = parseCSVLine('"Buyer, With Comma",rtb,buyer');
    expect(row[0]).toBe("Buyer, With Comma");
    const result = validateImports("integration_name,type,direction,campaign_id,url\nBuyer,rtb,buyer,camp_hvac,https://x.test", "csv", campaigns)[0];
    expect(result.status).toBe("warning");
    expect(result.parsedData?.config?.timeoutSeconds).toBe(3);
  });

  it("validates JSON arrays and useful JSON errors", () => {
    expect(validateImports('[{"name":"JSON Buyer","type":"rtb","direction":"buyer","campaign_id":"camp_hvac","url":"https://x.test"}]', "json", campaigns)[0].parsedData?.name).toBe("JSON Buyer");
    expect(validateImports("{bad", "json", campaigns)[0].message).toContain("Invalid JSON");
    expect(validateImports('{"name":"Nope"}', "json", campaigns)[0].message).toContain("array");
    expect(validateImports('[{"name":"Missing"}]', "json", campaigns)[0].status).toBe("error");
  });
});
