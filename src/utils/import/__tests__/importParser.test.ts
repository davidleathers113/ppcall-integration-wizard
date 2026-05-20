import { describe, expect, it } from "vitest";
import { parseCsvImport, parseJsonImport } from "../importParser";

describe("import parser", () => {
  it("parses quoted commas, escaped quotes, CRLF, and BOM", () => {
    const csv = '\uFEFFintegration_name,campaign,direction,type\r\n"Buyer, Tampa",HVAC Inbound,buyer,rtb\r\n"Buyer ""Quoted""",HVAC Inbound,buyer,rtb';
    const result = parseCsvImport(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows[0].raw.integration_name).toBe("Buyer, Tampa");
    expect(result.rows[1].raw.integration_name).toBe('Buyer "Quoted"');
  });

  it("surfaces CSV parse errors and max row errors", () => {
    expect(parseCsvImport('"unterminated\nvalue').errors.some(error => error.code === "parse_error")).toBe(true);
    const manyRows = `integration_name,campaign,direction,type\n${Array.from({ length: 51 }, (_, index) => `Name ${index},HVAC Inbound,buyer,rtb`).join("\n")}`;
    expect(parseCsvImport(manyRows).errors.some(error => error.code === "too_many_rows")).toBe(true);
  });

  it("parses JSON arrays and reports invalid JSON/non-array", () => {
    expect(parseJsonImport('[{"integration_name":"Buyer","campaign":"HVAC Inbound"}]').rows[0].raw.integration_name).toBe("Buyer");
    expect(parseJsonImport("{bad").errors[0].code).toBe("invalid_json");
    expect(parseJsonImport('{"integration_name":"Buyer"}').errors[0].code).toBe("json_not_array");
  });
});
