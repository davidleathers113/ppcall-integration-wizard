import React, { useState } from "react";
import { Upload, AlertCircle, CheckCircle, FileText, Download } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";
import type { IntegrationDirection, IntegrationType, IntegrationStatus } from "../../models/appTypes";

const BulkImport: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [importType, setImportType] = useState<"csv" | "json">("csv");
  const [content, setContent] = useState("");
  const [isValidated, setIsValidated] = useState(false);

  // Simplified logic for prototype purposes
  const mockValidationResults = [
    { row: 1, name: "Premier Home Services", status: "ready", message: "Ready to import" },
    { row: 2, name: "Coastal Plumbing", status: "ready", message: "Ready to import" },
    { row: 3, name: "Disability Intake", status: "warning", message: "Missing timeout; defaulting to 3s" },
    { row: 4, name: "Unknown Buyer", status: "error", message: "Missing required field: URL" },
  ];

  const handleValidate = () => {
    if (content.trim()) {
      setIsValidated(true);
    }
  };

  const handleImport = () => {
    // In a real flow, this would parse content and dispatch mapped objects
    const mockIntegration = {
      id: `int_${Math.random().toString(36).substr(2, 9)}`,
      campaignId: state.campaigns[0].id,
      name: "Imported Integration " + Math.floor(Math.random() * 100),
      direction: "buyer" as IntegrationDirection,
      type: "rtb" as IntegrationType,
      platformPreset: "ringba_rtb",
      status: "needs_testing" as IntegrationStatus,
      config: { url: "https://api.imported.com/ping" },
      createdAt: new Date().toISOString(),
      createdBy: "Bulk Importer",
      updatedAt: new Date().toISOString(),
      updatedBy: "Bulk Importer",
      usageCount: 0,
      errorRate: 0
    };
    
    dispatch({ type: "CREATE_INTEGRATION", payload: mockIntegration });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        integrationId: mockIntegration.id,
        campaignId: mockIntegration.campaignId,
        eventType: "created",
        message: "Imported integration via Bulk CSV/JSON import.",
        createdAt: new Date().toISOString(),
        actor: "Bulk Importer"
      }
    });

    setContent("");
    setIsValidated(false);
    alert("Import successful! (Simulated)");
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bulk Import</h2>
          <p className="text-slate-500">Add multiple integrations at once via CSV or JSON.</p>
        </div>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
          <Download size={16} />
          Download Template
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

          {isValidated && (
            <Card title="Validation Results" subtitle="Review issues before importing">
              <div className="space-y-2">
                {mockValidationResults.map((res, i) => (
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
                  <p className="text-xs text-purple-700">2 ready, 1 warning, 1 error</p>
                </div>
                <button 
                  onClick={handleImport}
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
