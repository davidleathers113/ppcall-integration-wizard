import React, { useState } from "react";
import { Upload, AlertCircle, CheckCircle, FileText, Download } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { validateImports, type ValidationResult } from "../../utils/importParser";

const BulkImport: React.FC = () => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const [importType, setImportType] = useState<"csv" | "json">("csv");
  const [content, setContent] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleValidate = () => {
    if (content.trim()) {
      setValidationResults(validateImports(content, importType, state.campaigns));
      setImportMessage(null);
    }
  };

  const handleImport = () => {
    const importableRows = validationResults.filter(result => result.status !== "error" && result.parsedData);
    if (importableRows.length === 0) {
      setImportMessage("No valid rows are ready to import.");
      return;
    }

    const importedIntegrations = actions.bulkImportIntegrations(importableRows.map(result => ({
        campaignId: result.parsedData!.campaignId!,
        name: result.parsedData!.name!,
        direction: result.parsedData!.direction!,
        type: result.parsedData!.type!,
        platformPreset: result.parsedData!.platformPreset || "custom",
        status: result.parsedData!.status || "draft",
        config: result.parsedData!.config || {}
      })));

    setContent("");
    setValidationResults([]);
    setImportMessage(`Imported ${importedIntegrations.length} integration${importedIntegrations.length === 1 ? "" : "s"}.`);
  };

  const handleDownloadTemplate = () => {
    const template = "integration_name,type,direction,campaign_id,url,method,platform_preset,timeout_seconds,destination_number,payout\nPremier RTB,rtb,buyer,camp_hvac,https://buyer.example/ping,POST,ringba_rtb,3,,\nStatic Buyer,static_number,buyer,camp_hvac,,,,,+18005551212,25";
    void navigator.clipboard.writeText(template);
    setImportMessage("Template copied to clipboard.");
  };

  const readyCount = validationResults.filter(result => result.status === "ready").length;
  const warningCount = validationResults.filter(result => result.status === "warning").length;
  const errorCount = validationResults.filter(result => result.status === "error").length;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bulk Import</h2>
          <p className="text-slate-500">Add multiple integrations at once via CSV or JSON.</p>
        </div>
        <button onClick={handleDownloadTemplate} className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
          <Download size={16} />
          Copy Template
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex gap-4 mb-4 border-b border-slate-100 pb-4">
              <button 
                onClick={() => setImportType("csv")}
                className={`text-sm font-medium pb-2 border-b-2 transition-all ${importType === "csv" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400"}`}
              >
                CSV Import
              </button>
              <button 
                onClick={() => setImportType("json")}
                className={`text-sm font-medium pb-2 border-b-2 transition-all ${importType === "json" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-400"}`}
              >
                JSON Import
              </button>
            </div>

            <textarea 
              className="w-full h-64 p-4 font-mono text-sm bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder={importType === "csv" ? "integration_name,type,direction,campaign...\nPremier RTB,rtb,buyer,camp_hvac..." : '[\n  {\n    "name": "Premier RTB",\n    "type": "rtb",\n    "direction": "buyer"\n  }\n]'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1">
                  <FileText size={16} />
                  <span className="text-xs">Supports UTF-8</span>
                </div>
                <div className="flex items-center gap-1">
                  <Upload size={16} />
                  <span className="text-xs">Max 50 rows</span>
                </div>
              </div>
              <button 
                onClick={handleValidate}
                disabled={!content.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all"
              >
                Validate Data
              </button>
            </div>
          </Card>

          {importMessage && (
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 text-sm">
              {importMessage}
            </div>
          )}

          {validationResults.length > 0 && (
            <Card title="Validation Results" subtitle="Review issues before importing">
              <div className="space-y-2">
                {validationResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 w-4">#{res.row}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{res.name}</p>
                        <p className={`text-xs ${res.status === "error" ? "text-red-500" : res.status === "warning" ? "text-yellow-600" : "text-slate-500"}`}>
                          {res.message}
                        </p>
                      </div>
                    </div>
                    <Badge variant={res.status === "ready" ? "success" : res.status === "warning" ? "warning" : "error"}>
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-purple-900">Summary</p>
                  <p className="text-xs text-purple-700">{readyCount} ready, {warningCount} warning, {errorCount} error</p>
                </div>
                <button 
                  onClick={handleImport}
                  disabled={readyCount + warningCount === 0}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700"
                >
                  Import Valid Rows
                </button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Import Instructions">
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span>Ensure <strong>campaign_id</strong> exists before importing.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span>Default <strong>timeout</strong> is 3 seconds if not provided.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span>Status will default to <strong>draft</strong>.</span>
              </li>
              <li className="flex gap-2">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <span>Duplicate <strong>integration_name</strong> will be flagged.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
