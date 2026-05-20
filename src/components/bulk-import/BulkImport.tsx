import React, { useMemo, useState } from "react";
import { Download, FileText, Upload } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { useToast } from "../shared/ToastProvider";
import { autoMapColumn, IMPORT_FIELDS, IMPORT_FIELD_KEYS, type ColumnMapping, type ImportMode, type ImportStep, type ImportValidationResult, type ParseResult } from "../../utils/import/importSchema";
import { parseCsvImport, parseJsonImport } from "../../utils/import/importParser";
import { validateColumnMappings, validateRows } from "../../utils/import/importValidator";
import { IMPORT_TEMPLATES, type ImportTemplateKey } from "../../utils/import/importTemplates";

const MAX_ROWS = 50;
const stepOrder: ImportStep[] = ["source", "mapping", "validation", "preview", "complete"];

const BulkImport: React.FC = () => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const toast = useToast();
  const [mode, setMode] = useState<ImportMode>("csv");
  const [step, setStep] = useState<ImportStep>("source");
  const [rawContent, setRawContent] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult>({ rows: [], headers: [], errors: [] });
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validationResults, setValidationResults] = useState<ImportValidationResult[]>([]);
  const [includeWarnings, setIncludeWarnings] = useState(false);
  const [filter, setFilter] = useState<"all" | "ready" | "warning" | "error" | "problems">("all");
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState<ImportTemplateKey>("buyer_rtb");

  const counts = useMemo(() => ({
    ready: validationResults.filter(result => result.severity === "ready").length,
    warning: validationResults.filter(result => result.severity === "warning").length,
    error: validationResults.filter(result => result.severity === "error").length,
  }), [validationResults]);

  const eligibleRows = validationResults.filter(result => result.normalized && (result.severity === "ready" || (includeWarnings && result.severity === "warning")));
  const filteredRows = validationResults.filter(result => {
    if (filter === "all") return true;
    if (filter === "problems") return result.severity !== "ready";
    return result.severity === filter;
  });
  const columnIssues = validateColumnMappings(mappings);

  const parseContent = (content = rawContent, importMode = mode) => {
    const result = importMode === "csv" ? parseCsvImport(content, MAX_ROWS) : parseJsonImport(content, MAX_ROWS);
    setParseResult(result);
    setMappings(result.headers.map(autoMapColumn));
    setValidationResults([]);
    setImportedIds([]);
    setMessage(result.errors.length ? "Parsing completed with file-level issues." : `Parsed ${result.rows.length} row${result.rows.length === 1 ? "" : "s"}.`);
    setStep(importMode === "csv" ? "mapping" : "validation");
    if (importMode === "json") validateParsedRows(result, result.headers.map(autoMapColumn));
  };

  const validateParsedRows = (result = parseResult, nextMappings = mappings) => {
    const mappingIssues = validateColumnMappings(nextMappings);
    if (result.errors.length || mappingIssues.length) {
      setValidationResults([]);
      setMessage("Fix parse or mapping errors before row validation.");
      return;
    }
    const results = validateRows(result.rows, nextMappings, { campaigns: state.campaigns, integrations: state.integrations, maxRows: MAX_ROWS });
    setValidationResults(results);
    setStep("validation");
    setMessage(`Validated ${results.length} row${results.length === 1 ? "" : "s"}.`);
  };

  const handleImport = () => {
    const imported = actions.bulkImportIntegrations(eligibleRows.map(row => row.normalized!), { actor: "Bulk Importer" });
    setImportedIds(imported.map(integration => integration.id));
    setStep("complete");
    setMessage(`Imported ${imported.length} integration${imported.length === 1 ? "" : "s"}.`);
    toast.success(`Imported ${imported.length} integration${imported.length === 1 ? "" : "s"} as drafts.`);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setFileMeta({ name: file.name, size: file.size });
    setRawContent(text);
    parseContent(text, mode);
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(IMPORT_TEMPLATES[templateKey].content);
      setMessage("Template copied to clipboard.");
      toast.success("Template copied to clipboard.");
    } catch {
      setMessage("Clipboard copy failed. Select the template text and copy manually.");
      toast.error("Clipboard copy failed.");
    }
  };

  const downloadTemplate = () => {
    const template = IMPORT_TEMPLATES[templateKey];
    const blob = new Blob([template.content], { type: templateKey === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = template.fileName;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Template download started.");
  };

  const setMapping = (sourceColumn: string, targetField: ColumnMapping["targetField"]) => {
    setMappings(current => current.map(mapping => mapping.sourceColumn === sourceColumn ? { ...mapping, targetField } : mapping));
  };

  const resetMappings = () => setMappings(parseResult.headers.map(header => ({ sourceColumn: header, targetField: "", confidence: 0 })));
  const autoMapColumns = () => setMappings(parseResult.headers.map(autoMapColumn));

  return (
    <div data-testid="bulk-import-page" className="space-y-6">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bulk Import</h2>
          <p className="text-slate-500">Import CSV or JSON into normalized draft integrations. Max {MAX_ROWS} rows.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded-lg p-2 text-sm bg-white" value={templateKey} onChange={event => setTemplateKey(event.target.value as ImportTemplateKey)}>
            {Object.entries(IMPORT_TEMPLATES).map(([key, template]) => <option key={key} value={key}>{template.label}</option>)}
          </select>
          <button onClick={copyTemplate} className="text-sm text-purple-600 font-bold">Copy Template</button>
          <button onClick={downloadTemplate} className="text-sm text-purple-600 font-bold flex items-center gap-1"><Download size={16} /> Download</button>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-2">
        {stepOrder.map((item, index) => (
          <div key={item} className={`p-2 rounded-lg text-center text-xs font-bold uppercase ${step === item ? "bg-purple-600 text-white" : stepOrder.indexOf(step) > index ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {index + 1}. {item}
          </div>
        ))}
      </div>

      {message && <div data-testid="bulk-import-message" className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">{message}</div>}
      {parseResult.errors.length > 0 && step !== "mapping" && (
        <div data-testid="bulk-import-error" className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {parseResult.errors.map(issue => (
            <p key={`${issue.code}-${issue.field || issue.message}`}>{issue.field ? `${issue.field}: ` : ""}{issue.message}</p>
          ))}
        </div>
      )}
      {fileMeta && step !== "source" && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FileText size={14} />
          <span>{fileMeta.name} • {(fileMeta.size / 1024).toFixed(1)} KB</span>
        </div>
      )}

      {step === "source" && (
        <Card title="1. Source" subtitle="Paste content or upload a file">
          <div className="flex gap-4 mb-4">
            <button data-testid="bulk-import-mode-csv" onClick={() => setMode("csv")} className={`px-3 py-2 rounded-lg text-sm font-bold ${mode === "csv" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>CSV</button>
            <button data-testid="bulk-import-mode-json" onClick={() => setMode("json")} className={`px-3 py-2 rounded-lg text-sm font-bold ${mode === "json" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>JSON</button>
          </div>
          <label className="block border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-sm text-slate-500 mb-4 cursor-pointer">
            <Upload size={20} className="mx-auto mb-2" />
            Upload {mode.toUpperCase()} file
            <input data-testid="bulk-import-file-input" className="hidden" type="file" accept={mode === "csv" ? ".csv,text/csv" : ".json,application/json"} onChange={event => void handleFile(event.target.files?.[0])} />
          </label>
          {fileMeta && <p className="text-xs text-slate-500 mb-3"><FileText size={14} className="inline mr-1" />{fileMeta.name} • {(fileMeta.size / 1024).toFixed(1)} KB</p>}
          <textarea data-testid="bulk-import-textarea" className="w-full h-72 p-4 font-mono text-sm bg-slate-50 border rounded-xl" value={rawContent} onChange={event => setRawContent(event.target.value)} placeholder={mode === "csv" ? IMPORT_TEMPLATES.buyer_rtb.content : IMPORT_TEMPLATES.json.content} />
          <div className="mt-4 flex justify-end">
            <button data-testid="bulk-import-parse-button" onClick={() => parseContent()} disabled={!rawContent.trim()} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:bg-slate-200">Parse Content</button>
          </div>
        </Card>
      )}

      {step === "mapping" && (
        <Card title="2. Map Columns" subtitle="Auto-map headers to import schema fields">
          <IssueList issues={[...parseResult.errors, ...columnIssues]} />
          <div className="flex gap-2 mb-4">
            <button onClick={autoMapColumns} className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold">Auto-map Columns</button>
            <button onClick={resetMappings} className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold">Reset Mappings</button>
          </div>
          <div className="space-y-2">
            {mappings.map(mapping => (
              <div key={mapping.sourceColumn} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-bold text-slate-900">{mapping.sourceColumn}</p>
                  <p className="text-xs text-slate-400">{mapping.confidence ? `${Math.round(mapping.confidence * 100)}% confidence` : "Unmapped column will be ignored"}</p>
                </div>
                <select className="md:col-span-2 p-2 border rounded-lg bg-white text-sm" value={mapping.targetField} onChange={event => setMapping(mapping.sourceColumn, event.target.value as ColumnMapping["targetField"])}>
                  <option value="">Ignore column</option>
                  {IMPORT_FIELD_KEYS.map(field => <option key={field} value={field}>{IMPORT_FIELDS[field].label}{IMPORT_FIELDS[field].required ? " *" : ""}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button data-testid="bulk-import-validate-button" onClick={() => validateParsedRows()} disabled={parseResult.errors.length > 0 || columnIssues.length > 0} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:bg-slate-200">Validate Rows</button>
          </div>
        </Card>
      )}

      {(step === "validation" || step === "preview") && (
        <Card title={step === "validation" ? "3. Validate Rows" : "4. Preview Normalized Integrations"} subtitle="Review ready, warning, and error rows before import">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Badge variant="success">{counts.ready} ready</Badge>
            <Badge variant="warning">{counts.warning} warnings</Badge>
            <Badge variant="error">{counts.error} errors</Badge>
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              <input
                data-testid="bulk-import-include-warnings"
                type="checkbox"
                checked={includeWarnings}
                onChange={event => setIncludeWarnings(event.target.checked)}
              />
              Include rows with warnings
            </label>
          </div>
          <div className="flex gap-2 mb-4">
            {(["all", "ready", "warning", "error", "problems"] as const).map(item => <button key={item} onClick={() => setFilter(item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === item ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}
          </div>
          <div className="space-y-3">
            {filteredRows.map(result => <ValidationRow key={result.rowNumber} result={result} preview={step === "preview"} />)}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep("mapping")} className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold">Back to Mapping</button>
            {step === "validation" ? (
              <button data-testid="bulk-import-preview-button" onClick={() => setStep("preview")} disabled={eligibleRows.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:bg-slate-200">Preview Import</button>
            ) : (
              <button data-testid="bulk-import-import-button" onClick={handleImport} disabled={eligibleRows.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:bg-slate-200">Import {eligibleRows.length} Rows</button>
            )}
          </div>
        </Card>
      )}

      {step === "complete" && (
        <Card title="5. Import Result">
          <div data-testid="bulk-import-result" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Summary label="Imported" value={importedIds.length} />
            <Summary label="Skipped" value={validationResults.length - importedIds.length} />
            <Summary label="Warnings" value={counts.warning} />
            <Summary label="Errors" value={counts.error} />
          </div>
          {importedIds.length > 0 && (
            <div data-testid="bulk-import-success" className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800">
              Imported {importedIds.length} integration{importedIds.length === 1 ? "" : "s"} as drafts.
            </div>
          )}
          <div className="space-y-2">
            {importedIds.map(id => {
              const integration = state.integrations.find(item => item.id === id);
              return <div key={id} className="p-3 border rounded-lg text-sm text-slate-700">{integration?.name || id} imported as draft/needs testing.</div>;
            })}
          </div>
          <button onClick={() => setStep("source")} className="mt-4 px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold">Start Another Import</button>
        </Card>
      )}
    </div>
  );
};

const IssueList = ({ issues }: { issues: { code: string; message: string; field?: string }[] }) => issues.length ? (
  <div data-testid="bulk-import-error" className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
    {issues.map(issue => <p key={`${issue.code}-${issue.field || issue.message}`}>{issue.field ? `${issue.field}: ` : ""}{issue.message}</p>)}
  </div>
) : null;

const ValidationRow = ({ result, preview }: { result: ImportValidationResult; preview: boolean }) => (
  <details className="border rounded-lg bg-white" open={result.severity !== "ready"}>
    <summary className="cursor-pointer p-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-900">Row {result.rowNumber}: {result.name}</p>
        <p className="text-xs text-slate-500">{result.normalized ? `${result.normalized.campaignId} • ${result.normalized.direction} • ${result.normalized.type} • ${result.normalized.status}` : "Not importable"}</p>
      </div>
      <Badge variant={result.severity === "ready" ? "success" : result.severity === "warning" ? "warning" : "error"}>{result.severity}</Badge>
    </summary>
    <div className="px-3 pb-3 space-y-2">
      {[...result.errors, ...result.warnings].map(issue => <p key={`${issue.code}-${issue.field}`} className={`text-xs ${result.errors.includes(issue) ? "text-red-700" : "text-amber-700"}`}>{issue.field ? `${issue.field}: ` : ""}{issue.message}{issue.fix ? ` ${issue.fix}` : ""}</p>)}
      {preview && result.normalized && <pre className="p-3 bg-slate-900 text-blue-300 rounded-lg text-xs overflow-auto">{JSON.stringify(result.normalized, null, 2)}</pre>}
    </div>
  </details>
);

const Summary = ({ label, value }: { label: string; value: number }) => (
  <div className="p-3 bg-slate-50 rounded-lg border">
    <p className="text-xs text-slate-500 uppercase font-bold">{label}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export default BulkImport;
