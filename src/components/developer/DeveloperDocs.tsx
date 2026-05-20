import React from "react";
import { Copy, Globe, Lock } from "lucide-react";
import Card from "../shared/Card";

const DeveloperDocs: React.FC = () => {
  const endpoints = [
    { method: "POST", path: "/api/integrations", desc: "Create a new integration" },
    { method: "GET", path: "/api/integrations/:id", desc: "Retrieve integration details" },
    { method: "PATCH", path: "/api/integrations/:id", desc: "Update an integration" },
    { method: "POST", path: "/api/integrations/:id/test", desc: "Trigger a mock test run" },
    { method: "POST", path: "/api/integrations/:id/activate", desc: "Activate an integration" },
  ];

  const examplePayload = {
    campaignId: "camp_hvac",
    name: "Premier Home Services RTB",
    direction: "buyer",
    type: "rtb",
    platformPreset: "generic_json_post",
    config: {
      method: "POST",
      url: "https://buyer.example.com/ping",
      headers: { "Content-Type": "application/json" },
      requestBody: {
        caller_id: "{{caller_id}}",
        zip: "{{zip}}",
        state: "{{state}}"
      },
      responseParsing: {
        acceptedPath: "$.accepted",
        acceptedValue: true,
        destinationNumberPath: "$.phone_number",
        bidPath: "$.bid"
      },
      timeoutSeconds: 3
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Developer API</h2>
        <p className="text-slate-500">Programmatically manage your integrations using our REST API.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card title="Authentication">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">All API requests must include your API key in the Authorization header.</p>
              <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                <code className="text-xs text-purple-400">Authorization: Bearer sk_live_...</code>
                <Lock size={14} className="text-slate-500" />
              </div>
            </div>
          </Card>

          <Card title="Endpoints">
            <div className="space-y-3">
              {endpoints.map((ep, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ep.method === "POST" ? "bg-green-100 text-green-700" : 
                      ep.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {ep.method}
                    </span>
                    <code className="text-xs text-slate-700 font-bold">{ep.path}</code>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">{ep.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Example: Create Integration" headerAction={<button className="text-slate-400 hover:text-slate-600"><Copy size={16} /></button>}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Globe size={14} />
                <span>POST https://api.mock-ppcall.local/v1/integrations</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-6 overflow-hidden">
                <pre className="text-sm text-blue-300 font-mono overflow-auto max-h-[500px]">
                  {JSON.stringify(examplePayload, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDocs;
