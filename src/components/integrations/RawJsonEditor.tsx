import React, { useState } from "react";
import { CheckCircle, Code, Copy, RefreshCw } from "lucide-react";
import type { Integration } from "../../models/appTypes";
import { useAppContext } from "../../store/AppStore";

interface RawJsonEditorProps {
  integration: Integration;
}

const RawJsonEditor: React.FC<RawJsonEditorProps> = ({ integration }) => {
  const { dispatch } = useAppContext();
  const [jsonText, setJsonText] = useState(() => JSON.stringify(integration, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleValidateAndSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      // Basic validation
      if (!parsed.id || !parsed.config) {
        throw new Error("Invalid schema: missing 'id' or 'config'");
      }
      
      // If config changed since last successful test, mark it for retest
      let updatedStatus = parsed.status;
      if (
        parsed.lastSuccessfulTestAt && 
        JSON.stringify(parsed.config) !== JSON.stringify(integration.config)
      ) {
        updatedStatus = "needs_retest";
      }

      const updatedIntegration = { ...parsed, status: updatedStatus, updatedAt: new Date().toISOString() };
      
      dispatch({ type: "UPDATE_INTEGRATION", payload: updatedIntegration });
      dispatch({
        type: "ADD_ACTIVITY",
        payload: {
          id: `evt_${Math.random().toString(36).substr(2, 9)}`,
          integrationId: parsed.id,
          campaignId: parsed.campaignId,
          eventType: "updated",
          message: "Integration updated via Raw JSON Editor.",
          createdAt: new Date().toISOString(),
          actor: "User"
        }
      });

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Raw JSON Definition</h3>
          <p className="text-xs text-slate-500">Edit the normalized integration object directly. Changes to config may require re-testing.</p>
        </div>
        <div className="flex gap-2">
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
          onClick={() => navigator.clipboard.writeText(jsonText)}
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
