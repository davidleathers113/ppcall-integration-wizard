import React, { useState } from "react";
import { Check, Copy, Globe, Lock, RotateCcw } from "lucide-react";
import Card from "../shared/Card";
import { useAppActions } from "../../store/useAppActions";

const endpoints = [
  { method: "POST", path: "/api/campaigns", desc: "Create a mock campaign" },
  { method: "GET", path: "/api/campaigns/:id", desc: "Retrieve a mock campaign" },
  { method: "POST", path: "/api/integrations", desc: "Create a draft integration" },
  { method: "GET", path: "/api/integrations/:id", desc: "Retrieve integration details" },
  { method: "PATCH", path: "/api/integrations/:id", desc: "Patch normalized integration fields" },
  { method: "POST", path: "/api/integrations/:id/test", desc: "Run the mock test simulator" },
  { method: "POST", path: "/api/integrations/:id/activate", desc: "Activate after latest stored test passed" },
  { method: "POST", path: "/api/integrations/:id/pause", desc: "Pause integration" },
  { method: "POST", path: "/api/integrations/:id/archive", desc: "Archive integration" },
  { method: "GET", path: "/api/integrations/:id/activity", desc: "List activity events" },
  { method: "GET", path: "/api/integrations/:id/test-runs", desc: "List stored test runs" },
  { method: "POST", path: "/api/bulk-import", desc: "Validate and import mock integrations" },
];

const examples = {
  "Buyer RTB": {
    campaignId: "camp_hvac",
    name: "Premier Home Services RTB",
    direction: "buyer",
    type: "rtb",
    platformPreset: "generic_json_post",
    status: "draft",
    config: {
      method: "POST",
      url: "https://buyer.example.com/ping",
      headers: { "Content-Type": "application/json" },
      requestBody: { caller_id: "{{caller_id}}", zip: "{{zip}}", state: "{{state}}" },
      responseParsing: {
        acceptedPath: "$.accepted",
        acceptedValue: true,
        destinationNumberPath: "$.phone_number",
        bidPath: "$.bid",
        rejectReasonPath: "$.reason"
      },
      timeoutSeconds: 3
    }
  },
  "Publisher RTB": {
    campaignId: "camp_hvac",
    name: "ABC Media HVAC",
    direction: "publisher",
    type: "rtb",
    platformPreset: "publisher_rtb",
    status: "draft",
    config: {
      publisherId: "pub_abc",
      postingUrl: "https://mock-ppcall.local/rtb/camp_hvac/pub_abc",
      requiredFields: ["caller_id", "zip"],
      expiresInSeconds: 30,
      acceptedResponse: { accepted: true, phone_number: "+18005551212", payout: 35, expires_in_seconds: 30 },
      rejectedResponse: { accepted: false, reason: "no_buyer_available" }
    }
  },
  "Static Buyer": {
    campaignId: "camp_hvac",
    name: "Static HVAC Buyer",
    direction: "buyer",
    type: "static_number",
    platformPreset: "static_number",
    status: "draft",
    config: {
      destinationNumber: "+18005551212",
      payout: 25,
      conversionDurationSeconds: 60,
      caps: { daily: 100, hourly: 20 }
    }
  },
  "Bulk Import": {
    type: "csv",
    rows: [
      "integration_name,type,direction,campaign_id,url,method,platform_preset,timeout_seconds,destination_number,payout",
      "Premier RTB,rtb,buyer,camp_hvac,https://buyer.example/ping,POST,ringba_rtb,3,,",
      "Static Buyer,static_number,buyer,camp_hvac,,,,,+18005551212,25"
    ]
  }
};

const DeveloperDocs: React.FC = () => {
  const actions = useAppActions();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeExample, setActiveExample] = useState<keyof typeof examples>("Buyer RTB");
  const [copyError, setCopyError] = useState<string | null>(null);

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setCopyError(null);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
      setCopyError("Copy failed. Browser clipboard access is unavailable.");
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  const exampleText = JSON.stringify(examples[activeExample], null, 2);

  return (
    <div data-testid="developer-docs-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Developer API</h2>
          <p className="text-slate-500">Mock API reference for the normalized campaign, integration, activity, and test-run model.</p>
          <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">These are prototype docs only. No real API server, telecom carrier, buyer endpoint, authentication, or billing system is connected.</p>
        </div>
        <button onClick={() => actions.resetMockData()} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2">
          <RotateCcw size={14} /> Reset Mock Data
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card title="Authentication">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Mock requests use a placeholder bearer token in examples.</p>
              <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                <code className="text-xs text-purple-400">Authorization: Bearer mock_key</code>
                <Lock size={14} className="text-slate-500" />
              </div>
            </div>
          </Card>

          <Card title="Endpoints">
            <div className="space-y-3">
              {endpoints.map(endpoint => (
                <div key={`${endpoint.method}-${endpoint.path}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${endpoint.method === "GET" ? "bg-blue-100 text-blue-700" : endpoint.method === "PATCH" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{endpoint.method}</span>
                    <code className="text-xs text-slate-700 font-bold">{endpoint.path}</code>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{endpoint.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Example Payloads" headerAction={<button onClick={() => copyText(activeExample, exampleText)} aria-label={`Copy ${activeExample} payload`} className="text-slate-400 hover:text-slate-600">{copied === activeExample ? <Check size={16} /> : <Copy size={16} />}</button>}>
            <div className="sr-only" aria-live="polite">
              {copied ? "Payload copied." : copyError || ""}
            </div>
            {(copied || copyError) && (
              <div className={`mb-3 rounded-lg border p-2 text-xs ${copyError ? "border-red-100 bg-red-50 text-red-700" : "border-green-100 bg-green-50 text-green-700"}`}>
                {copyError || "Payload copied."}
              </div>
            )}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {Object.keys(examples).map(name => (
                <button key={name} onClick={() => setActiveExample(name as keyof typeof examples)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${activeExample === name ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Globe size={14} />
              <span>{activeExample === "Bulk Import" ? "POST /api/bulk-import" : "POST /api/integrations"}</span>
            </div>
            <pre className="bg-slate-900 rounded-xl p-6 text-sm text-blue-300 font-mono overflow-auto max-h-[560px]">{exampleText}</pre>
          </Card>

          <Card title="Action Semantics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg">Create actions save draft normalized objects and append activity.</div>
              <div className="p-3 bg-slate-50 rounded-lg">Patch actions update `updatedAt`, `updatedBy`, and mark config changes as `needs_retest` after a successful test.</div>
              <div className="p-3 bg-slate-50 rounded-lg">Test actions store a `TestRun`, update `lastTestedAt`, and set status to `test_passed` or `failing`.</div>
              <div className="p-3 bg-slate-50 rounded-lg">Activate is blocked unless the latest stored test run passed.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDocs;
