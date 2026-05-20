import React, { useState } from "react";
import { Bot, Wand2, Sparkles, CheckCircle, AlertTriangle, FileCode } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import type { IntegrationDirection, IntegrationType, IntegrationConfig, Integration } from "../../models/appTypes";
import { useAppContext } from "../../store/AppStore";

interface AIConfigProposal {
  direction?: IntegrationDirection;
  type?: IntegrationType;
  platformPreset?: string;
  config: Partial<IntegrationConfig>;
  confidence: number;
  warnings: string[];
}

const AIAssistant: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [instructions, setInstructions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposedConfig, setProposedConfig] = useState<AIConfigProposal | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Rule-based extraction simulation
      const hasUrl = instructions.match(/https?:\/\/[^\s]+/);
      const isPost = instructions.toLowerCase().includes("post");
      const hasAccepted = instructions.toLowerCase().includes("accepted");
      
      setProposedConfig({
        direction: "buyer",
        type: "rtb",
        config: {
          method: isPost ? "POST" : "GET",
          url: hasUrl ? hasUrl[0] : "https://buyer.example.com/endpoint",
          headers: { "Content-Type": "application/json" },
          requestBody: {
            caller_id: "{{caller_id}}",
            zip: "{{zip}}",
            state: "{{state}}"
          },
          responseParsing: {
            acceptedPath: hasAccepted ? "$.accepted" : "$.status",
            acceptedValue: true,
            destinationNumberPath: "$.phone_number",
            bidPath: "$.payout",
            rejectReasonPath: "$.reason"
          }
        },
        confidence: 85,
        warnings: [
          "No conversion duration detected; defaulting to 60s",
          "Authentication headers may be required but were not specified"
        ]
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleApply = () => {
    if (!proposedConfig) return;

    const mockIntegration: Integration = {
      id: `int_${Math.random().toString(36).substr(2, 9)}`,
      campaignId: state.campaigns[0].id,
      name: "AI Generated Buyer",
      direction: proposedConfig.direction || "buyer",
      type: proposedConfig.type || "rtb",
      platformPreset: "custom",
      status: "draft",
      config: proposedConfig.config as IntegrationConfig,
      createdAt: new Date().toISOString(),
      createdBy: "AI Assistant",
      updatedAt: new Date().toISOString(),
      updatedBy: "AI Assistant",
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
        message: "Draft integration created from AI Assistant.",
        createdAt: new Date().toISOString(),
        actor: "AI Assistant"
      }
    });
    alert("Draft integration created from AI proposal!");
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">AI Integration Assistant</h2>
        <p className="text-slate-500">Paste your buyer or publisher instructions and let AI generate the configuration.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card title="Source Instructions" subtitle="Paste technical documentation or emails here">
            <textarea 
              className="w-full h-80 p-4 text-sm bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
              placeholder='e.g. "POST to https://buyer.example.com/ping with caller_id, zip, and state. If accepted=true, use phone_number as the transfer destination. Bid is returned as payout."'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !instructions.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                Analyze Instructions
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {!proposedConfig && !isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-400 mb-6">
                <Bot size={48} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Waiting for Input</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                The AI assistant will extract endpoints, fields, and parsing logic from your instructions.
              </p>
            </div>
          ) : isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
              <Sparkles className="text-purple-500 animate-bounce mb-6" size={48} />
              <h3 className="text-lg font-bold text-purple-900">Extracting Logic...</h3>
              <p className="text-sm text-purple-600 mt-2">Identifying endpoints, mapping tokens, and generating JSON schema.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card 
                title="Proposed Configuration" 
                headerAction={<Badge variant="success" className="bg-green-500 text-white border-none">{proposedConfig?.confidence}% Confidence</Badge>}
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Warnings & Recommendations</p>
                    {proposedConfig?.warnings?.map((w: string, i: number) => (
                      <div key={i} className="flex gap-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">JSON Definition</p>
                      <button className="text-[10px] text-purple-600 hover:underline flex items-center gap-1">
                        <FileCode size={12} />
                        Copy JSON
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 overflow-hidden">
                      <pre className="text-xs text-blue-300 font-mono overflow-auto max-h-64">
                        {JSON.stringify(proposedConfig, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <button 
                    onClick={handleApply}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle size={18} />
                    Apply Proposed Config
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
