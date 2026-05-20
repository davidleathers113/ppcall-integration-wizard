import Papa from "papaparse";
import type { ImportIssue, ParseResult, ParsedImportRow } from "./importSchema";

export function parseCsvImport(content: string, maxRows = 50): ParseResult {
  const errors: ImportIssue[] = [];
  // Remove BOM (Byte Order Mark) if present - using string methods instead of regex
  let cleaned = content;
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.trim()) {
    return { rows: [], headers: [], errors: [{ code: "empty_file", message: "CSV content is empty." }] };
  }

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: header => {
      // Remove BOM from header if present - using string methods instead of regex
      let clean = header;
      if (clean.charCodeAt(0) === 0xFEFF) {
        clean = clean.substring(1);
      }
      return clean.trim();
    },
  });

  const headers = parsed.meta.fields?.filter(Boolean) || [];
  if (headers.length === 0) errors.push({ code: "missing_header", message: "CSV must include a header row." });
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
  duplicateHeaders.forEach(header => errors.push({ field: header, code: "duplicate_header", message: `Duplicate header '${header}'.` }));
  parsed.errors.forEach(error => errors.push({ code: "parse_error", message: error.message, field: error.row !== undefined ? `row ${error.row + 2}` : undefined }));

  const rows: ParsedImportRow[] = parsed.data
    .filter(row => Object.values(row).some(value => String(value || "").trim()))
    .map((raw, index) => ({
      rowNumber: index + 2,
      raw: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.trim(), String(value ?? "").trim()]))
    }));

  if (rows.length > maxRows) errors.push({ code: "too_many_rows", message: `Import supports a maximum of ${maxRows} rows.` });
  return { rows, headers, errors };
}

export function parseJsonImport(content: string, maxRows = 50): ParseResult {
  if (!content.trim()) return { rows: [], headers: [], errors: [{ code: "empty_file", message: "JSON content is empty." }] };
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return { rows: [], headers: [], errors: [{ code: "json_not_array", message: "JSON import must be an array of objects." }] };
    }
    const rows: ParsedImportRow[] = parsed.map((item, index) => ({
      rowNumber: index + 1,
      raw: Object.fromEntries(Object.entries((item && typeof item === "object" ? item : {}) as Record<string, unknown>).map(([key, value]) => [key, stringifyValue(value)]))
    }));
    const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row.raw))));
    const errors: ImportIssue[] = rows.length > maxRows ? [{ code: "too_many_rows", message: `Import supports a maximum of ${maxRows} rows.` }] : [];
    return { rows, headers, errors };
  } catch (error) {
    return { rows: [], headers: [], errors: [{ code: "invalid_json", message: error instanceof Error ? error.message : "Invalid JSON." }] };
  }
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
