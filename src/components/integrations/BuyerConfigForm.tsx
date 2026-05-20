import React, { useMemo, useState } from "react";
import type { Integration, IntegrationConfig } from "../../models/appTypes";
import { useAppActions } from "../../store/useAppActions";

interface BuyerConfigFormProps {
  integration: Integration;
}

const BuyerConfigForm: React.FC<BuyerConfigFormProps> = ({ integration }) => {
  const actions = useAppActions();
  const config = integration.config;
  const [headersText, setHeadersText] = useState(() => JSON.stringify(config.headers || { "Content-Type": "application/json" }, null, 2));
  const [queryText, setQueryText] = useState(() => JSON.stringify(config.queryParams || {}, null, 2));
  const [bodyText, setBodyText] = useState(() => JSON.stringify(config.requestBody || {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isApiStyle = ["rtb", "generic_api", "webhook"].includes(integration.type);
  const validation = useMemo(() => {
    const issues: string[] = [];
    if (isApiStyle && !config.url) issues.push("URL is required for RTB/API/webhook buyers.");
    if (isApiStyle && !config.method) issues.push("Method is required for API-style buyers.");
    if (integration.type === "static_number" && !config.destinationNumber) issues.push("Destination number is required for static buyers.");
    if (isApiStyle && !config.responseParsing?.acceptedPath) issues.push("Accepted path is required.");
    if (isApiStyle && !(config.responseParsing?.destinationNumberPath || config.responseParsing?.sipAddressPath)) issues.push("Destination number path or SIP path is required.");
    return issues;
  }, [config, integration.type, isApiStyle]);

  const updateConfig = <Key extends keyof IntegrationConfig>(key: Key, value: IntegrationConfig[Key]) => {
    actions.updateIntegration(integration.id, {
      config: {
        ...integration.config,
        [key]: value
      }
    }, { message: "Updated buyer config." });
  };

  const updateResponseParsing = (key: keyof NonNullable<IntegrationConfig["responseParsing"]>, value: string | boolean | number) => {
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

  const applyJsonField = (key: "headers" | "queryParams" | "requestBody", text: string) => {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected a JSON object.");
      if (key === "headers" || key === "queryParams") {
        const stringRecord = Object.fromEntries(Object.entries(parsed).map(([entryKey, value]) => [entryKey, String(value)]));
        updateConfig(key, stringRecord);
      } else {
        updateConfig(key, parsed);
      }
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON object.");
    }
  };

  const toggleRequiredField = (field: string) => {
    const fields = config.requiredFields || [];
    updateConfig("requiredFields", fields.includes(field) ? fields.filter(item => item !== field) : [...fields, field]);
  };

  return (
    <div className="space-y-8">
      {validation.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
          {validation.map(issue => <p key={issue}>{issue}</p>)}
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Endpoint / Destination</h4>
        {integration.type === "static_number" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField label="Destination Number" value={config.destinationNumber || ""} onChange={value => updateConfig("destinationNumber", value)} />
            <NumberField label="Payout" value={config.payout || 0} onChange={value => updateConfig("payout", value)} />
            <NumberField label="Conversion Duration" value={config.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
          </div>
        ) : integration.type === "sip" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField label="SIP Address" value={config.sipAddress || ""} onChange={value => updateConfig("sipAddress", value)} />
            <NumberField label="Payout" value={config.payout || 0} onChange={value => updateConfig("payout", value)} />
            <NumberField label="Conversion Duration" value={config.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-xs font-bold text-slate-500 uppercase">Method
              <select className="mt-1 w-full p-2 border rounded-lg text-sm bg-white" value={config.method || "POST"} onChange={event => updateConfig("method", event.target.value as IntegrationConfig["method"])}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <TextField label="URL" value={config.url || ""} onChange={value => updateConfig("url", value)} />
            </div>
          </div>
        )}
      </section>

      {isApiStyle && (
        <section className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Request Shape</h4>
          {jsonError && <div className="p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">{jsonError}</div>}
          <JsonEditor label="Headers" value={headersText} onChange={setHeadersText} onApply={() => applyJsonField("headers", headersText)} />
          <JsonEditor label="Query Params" value={queryText} onChange={setQueryText} onApply={() => applyJsonField("queryParams", queryText)} />
          <JsonEditor label="Request Body" value={bodyText} onChange={setBodyText} onApply={() => applyJsonField("requestBody", bodyText)} />
        </section>
      )}

      <section className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Required Fields</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {["caller_id", "zip", "state", "publisher_id", "trusted_form", "jornaya"].map(field => (
            <label key={field} className="flex items-center gap-2 text-xs text-slate-700 p-2 border rounded-lg">
              <input type="checkbox" checked={(config.requiredFields || []).includes(field)} onChange={() => toggleRequiredField(field)} />
              {field}
            </label>
          ))}
        </div>
      </section>

      {isApiStyle && (
        <section className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Response Parsing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Accepted Path" value={config.responseParsing?.acceptedPath || ""} onChange={value => updateResponseParsing("acceptedPath", value)} />
            <TextField label="Accepted Value" value={String(config.responseParsing?.acceptedValue ?? true)} onChange={value => updateResponseParsing("acceptedValue", value === "true" ? true : value)} />
            <TextField label="Destination Number Path" value={config.responseParsing?.destinationNumberPath || ""} onChange={value => updateResponseParsing("destinationNumberPath", value)} />
            <TextField label="SIP Address Path" value={config.responseParsing?.sipAddressPath || ""} onChange={value => updateResponseParsing("sipAddressPath", value)} />
            <TextField label="Bid/Payout Path" value={config.responseParsing?.bidPath || ""} onChange={value => updateResponseParsing("bidPath", value)} />
            <TextField label="Reject Reason Path" value={config.responseParsing?.rejectReasonPath || ""} onChange={value => updateResponseParsing("rejectReasonPath", value)} />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Caps and Schedule</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NumberField label="Daily Cap" value={config.caps?.daily || 0} onChange={value => updateConfig("caps", { ...config.caps, daily: value })} />
          <NumberField label="Hourly Cap" value={config.caps?.hourly || 0} onChange={value => updateConfig("caps", { ...config.caps, hourly: value })} />
          <NumberField label="Timeout Seconds" value={config.timeoutSeconds || 3} onChange={value => updateConfig("timeoutSeconds", value)} />
          <NumberField label="Expires Seconds" value={config.expiresInSeconds || 0} onChange={value => updateConfig("expiresInSeconds", value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextField label="Timezone" value={config.schedule?.timezone || "America/New_York"} onChange={value => updateConfig("schedule", { timezone: value, days: config.schedule?.days || ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: config.schedule?.startTime || "09:00", endTime: config.schedule?.endTime || "17:00" })} />
          <TextField label="Days" value={(config.schedule?.days || []).join(",")} onChange={value => updateConfig("schedule", { timezone: config.schedule?.timezone || "America/New_York", days: value.split(",").map(day => day.trim()).filter(Boolean), startTime: config.schedule?.startTime || "09:00", endTime: config.schedule?.endTime || "17:00" })} />
          <TextField label="Start Time" value={config.schedule?.startTime || "09:00"} onChange={value => updateConfig("schedule", { timezone: config.schedule?.timezone || "America/New_York", days: config.schedule?.days || ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: value, endTime: config.schedule?.endTime || "17:00" })} />
          <TextField label="End Time" value={config.schedule?.endTime || "17:00"} onChange={value => updateConfig("schedule", { timezone: config.schedule?.timezone || "America/New_York", days: config.schedule?.days || ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: config.schedule?.startTime || "09:00", endTime: value })} />
        </div>
      </section>
    </div>
  );
};

const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    {label}
    <input className="mt-1 w-full p-2 border rounded-lg text-sm font-mono normal-case" value={value} onChange={event => onChange(event.target.value)} />
  </label>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    {label}
    <input type="number" className="mt-1 w-full p-2 border rounded-lg text-sm normal-case" value={value || ""} onChange={event => onChange(Number(event.target.value))} />
  </label>
);

const JsonEditor = ({ label, value, onChange, onApply }: { label: string; value: string; onChange: (value: string) => void; onApply: () => void }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
      <button onClick={onApply} className="text-xs text-purple-600 font-bold">Apply</button>
    </div>
    <textarea className="w-full h-28 p-3 bg-slate-900 text-blue-300 rounded-lg text-xs font-mono" value={value} onChange={event => onChange(event.target.value)} />
  </div>
);

export default BuyerConfigForm;
