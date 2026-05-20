import React, { useState } from "react";
import { CheckCircle, Code, Copy, RefreshCw } from "lucide-react";
import type { Integration, IntegrationDirection, IntegrationStatus, IntegrationType } from "../../models/appTypes";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";

interface RawJsonEditorProps {
  integration: Integration;
}

const RawJsonEditor: React.FC<RawJsonEditorProps> = ({ integration }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const [jsonText, setJsonText] = useState(() => JSON.stringify(integration, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleValidateAndSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      assertIntegration(parsed);
      if (parsed.id !== integration.id && state.integrations.some(item => item.id === parsed.id)) {
        throw new Error("Invalid schema: id collides with another integration");
      }
      if (!state.campaigns.some(campaign => campaign.id === parsed.campaignId)) {
        throw new Error("Invalid schema: campaignId does not match an existing campaign");
      }
      
      // If config changed since last successful test, mark it for retest
      let updatedStatus = parsed.status;
      if (
        parsed.lastSuccessfulTestAt && 
        JSON.stringify(parsed.config) !== JSON.stringify(integration.config)
      ) {
        updatedStatus = "needs_retest";
      }

      actions.updateIntegration(integration.id, { ...parsed, status: updatedStatus }, { message: "Integration updated via Raw JSON Editor." });

      setError(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Invalid JSON syntax");
      }
    }
  };

  const handleReset = () => {
    setJsonText(JSON.stringify(integration, null, 2));
    setError(null);
  };

  const handleFormat = () => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
      setError(null);
    } catch {
      setError("Invalid JSON syntax");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    } catch {
      setError("Could not copy JSON to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Raw JSON Definition</h3>
          <p className="text-xs text-slate-500">Edit the normalized integration object directly. Changes to config may require re-testing.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleFormat}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"
          >
            <Code size={14} /> Format JSON
          </button>
          <button 
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"
          >
            <RefreshCw size={14} /> Reset
          </button>
          <button 
            onClick={handleValidateAndSave}
            className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-1"
          >
            {isSaved ? <CheckCircle size={14} /> : <Code size={14} />}
            {isSaved ? "Saved" : "Validate & Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <strong>Validation Error:</strong> {error}
        </div>
      )}

      <div className="relative">
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-[600px] p-4 bg-slate-900 text-blue-300 font-mono text-sm rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          spellCheck={false}
        />
        <button 
          onClick={handleCopy}
          className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Copy to clipboard"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
};

export default RawJsonEditor;

const directions: IntegrationDirection[] = ["publisher", "buyer"];
const types: IntegrationType[] = ["static_number", "rtb", "sip", "webhook", "generic_api"];
const statuses: IntegrationStatus[] = ["draft", "needs_testing", "test_passed", "active", "active_unused", "dormant", "stale", "needs_retest", "failing", "paused", "archived"];

function assertIntegration(value: unknown): asserts value is Integration {
  if (!value || typeof value !== "object") throw new Error("Invalid schema: expected object");
  const candidate = value as Partial<Integration>;
  const required: Array<keyof Integration> = ["id", "campaignId", "name", "direction", "type", "platformPreset", "status", "config", "createdAt", "createdBy", "updatedAt", "updatedBy", "usageCount", "errorRate"];
  const missing = required.find(field => candidate[field] === undefined || candidate[field] === "");
  if (missing) throw new Error(`Invalid schema: missing '${missing}'`);
  if (!directions.includes(candidate.direction as IntegrationDirection)) throw new Error("Invalid schema: bad direction");
  if (!types.includes(candidate.type as IntegrationType)) throw new Error("Invalid schema: bad type");
  if (!statuses.includes(candidate.status as IntegrationStatus)) throw new Error("Invalid schema: bad status");
  if (typeof candidate.config !== "object" || candidate.config === null) throw new Error("Invalid schema: config must be an object");
}
