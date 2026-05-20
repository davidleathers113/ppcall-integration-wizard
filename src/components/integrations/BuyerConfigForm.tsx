import React from "react";
import type { Integration, IntegrationConfig } from "../../models/appTypes";
import { useAppActions } from "../../store/useAppActions";

interface BuyerConfigFormProps {
  integration: Integration;
}

const BuyerConfigForm: React.FC<BuyerConfigFormProps> = ({ integration }) => {
  const actions = useAppActions();
  
  const updateConfig = <Key extends keyof IntegrationConfig>(key: Key, value: IntegrationConfig[Key]) => {
    actions.updateIntegration(integration.id, {
      config: {
        ...integration.config,
        [key]: value
      }
    }, { message: "Updated buyer config." });
  };

  const updateResponseParsing = (key: string, value: string) => {
    actions.updateIntegration(integration.id, {
      config: {
        ...integration.config,
        responseParsing: {
          ...integration.config.responseParsing,
          [key]: value
        }
      }
    }, { message: "Updated response parsing config." });
  };

  const config = integration.config;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Endpoint Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Method</label>
            <select 
              className="w-full p-2 border rounded-lg text-sm bg-white"
              value={config.method || "POST"}
              onChange={(e) => updateConfig("method", e.target.value as IntegrationConfig["method"])}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg text-sm font-mono"
              value={config.url || ""}
              onChange={(e) => updateConfig("url", e.target.value)}
              placeholder="https://api.buyer.example/ping"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Response Parsing (JSONPath)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Accepted Status Path</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg text-sm font-mono"
              value={config.responseParsing?.acceptedPath || ""}
              onChange={(e) => updateResponseParsing("acceptedPath", e.target.value)}
              placeholder="$.accepted"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination Number Path</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg text-sm font-mono"
              value={config.responseParsing?.destinationNumberPath || ""}
              onChange={(e) => updateResponseParsing("destinationNumberPath", e.target.value)}
              placeholder="$.phone_number"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bid/Payout Path</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg text-sm font-mono"
              value={config.responseParsing?.bidPath || ""}
              onChange={(e) => updateResponseParsing("bidPath", e.target.value)}
              placeholder="$.bid"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reject Reason Path</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg text-sm font-mono"
              value={config.responseParsing?.rejectReasonPath || ""}
              onChange={(e) => updateResponseParsing("rejectReasonPath", e.target.value)}
              placeholder="$.reason"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Settings & Limits</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Timeout (seconds)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded-lg text-sm"
              value={config.timeoutSeconds || 3}
              onChange={(e) => updateConfig("timeoutSeconds", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Daily Cap</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded-lg text-sm"
              value={config.caps?.daily || ""}
              onChange={(e) => updateConfig("caps", { ...config.caps, daily: Number(e.target.value) })}
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concurrency Limit</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded-lg text-sm"
              value={config.caps?.hourly || ""}
              onChange={(e) => updateConfig("caps", { ...config.caps, hourly: Number(e.target.value) })}
              placeholder="Unlimited"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerConfigForm;
