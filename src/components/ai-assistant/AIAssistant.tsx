import React, { useState } from "react";
import { AlertTriangle, Bot, CheckCircle, FileCode, Sparkles, Wand2 } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { useToast } from "../shared/ToastProvider";
import { buildProposal, type AIConfigProposal } from "../../utils/aiProposal";

interface AIAssistantProps {
  onComplete?: (id: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onComplete }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const toast = useToast();
  const [instructions, setInstructions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposedConfig, setProposedConfig] = useState<AIConfigProposal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState(state.campaigns[0]?.id || "");
  const [draftName, setDraftName] = useState("AI Generated Integration");

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const proposal = buildProposal(instructions);
      setProposedConfig(proposal);
      setDraftName(proposal.direction === "publisher" ? "AI Generated Publisher" : "AI Generated Buyer");
      setIsAnalyzing(false);
    }, 700);
  };

  const handleApply = () => {
    if (!proposedConfig) return;
    const integration = actions.applyAIConfigToDraft({
      campaignId,
      name: draftName,
      direction: proposedConfig.direction,
      type: proposedConfig.type,
      platformPreset: proposedConfig.platformPreset,
      status: "draft",
      config: proposedConfig.config
    });
    setMessage(`Draft integration created from AI proposal: ${integration.name}.`);
    toast.success(`AI draft "${integration.name}" created.`);
    onComplete?.(integration.id);
  };

  const handleCopyProposal = async () => {
    if (!proposedConfig) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(proposedConfig.config, null, 2));
      setMessage("Proposed normalized config copied to clipboard.");
      toast.success("Proposal JSON copied to clipboard.");
    } catch {
      toast.error("Could not copy proposal to clipboard.");
    }
  };

  return (
    <div data-testid="ai-assistant-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">AI Integration Assistant</h2>
        <p className="text-slate-500">Paste buyer or publisher instructions and generate a draft normalized configuration.</p>
      </header>

      {message && <div data-testid="ai-message" className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 text-sm">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Source Instructions" subtitle="Paste technical documentation or emails here">
          <textarea
            data-testid="ai-instructions-textarea"
            className="w-full h-80 p-4 text-sm bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
            placeholder="POST to https://buyer.example.com/ping with caller_id, zip, state. If accepted=true, use phone_number as transfer destination. Bid is returned as payout."
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <button data-testid="ai-generate-button" onClick={handleAnalyze} disabled={isAnalyzing || !instructions.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              {isAnalyzing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wand2 size={18} />}
              Analyze Instructions
            </button>
          </div>
        </Card>

        {!proposedConfig && !isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <Bot size={48} className="text-purple-400 mb-6" />
            <h3 className="text-lg font-bold text-slate-900">Waiting for Input</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">The assistant extracts endpoints, fields, parsing paths, payout, and expiration hints into normalized config.</p>
          </div>
        ) : isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
            <Sparkles className="text-purple-500 animate-bounce mb-6" size={48} />
            <h3 className="text-lg font-bold text-purple-900">Extracting Logic...</h3>
            <p className="text-sm text-purple-600 mt-2">Mapping directions, tokens, JSON paths, and routing destinations.</p>
          </div>
        ) : (
          <Card title="Proposed Configuration" headerAction={<Badge variant="success" className="bg-green-500 text-white border-none">{proposedConfig!.confidence}% Confidence</Badge>}>
            <div data-testid="ai-proposal" className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Draft Name
                  <input data-testid="ai-draft-name-input" className="mt-1 w-full p-2 border rounded-lg text-sm normal-case" value={draftName} onChange={event => setDraftName(event.target.value)} />
                </label>
                <label className="text-xs font-bold text-slate-500 uppercase">Campaign
                  <select data-testid="ai-campaign-select" className="mt-1 w-full p-2 border rounded-lg text-sm normal-case bg-white" value={campaignId} onChange={event => setCampaignId(event.target.value)}>
                    {state.campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded border">Direction: <strong>{proposedConfig!.direction}</strong></div>
                <div className="p-2 bg-slate-50 rounded border">Type: <strong>{proposedConfig!.type}</strong></div>
                <div className="p-2 bg-slate-50 rounded border">Preset: <strong>{proposedConfig!.platformPreset}</strong></div>
              </div>

              {proposedConfig!.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Warnings</p>
                  {proposedConfig!.warnings.map(warning => (
                    <div key={warning} className="flex gap-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase">Normalized Config</p>
                  <button onClick={handleCopyProposal} className="text-[10px] text-purple-600 hover:underline flex items-center gap-1">
                    <FileCode size={12} /> Copy JSON
                  </button>
                </div>
                <pre className="bg-slate-900 rounded-xl p-4 text-xs text-blue-300 font-mono overflow-auto max-h-64">{JSON.stringify(proposedConfig!.config, null, 2)}</pre>
              </div>

              <button data-testid="ai-apply-button" onClick={handleApply} disabled={!campaignId || !draftName.trim()} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Apply and Open Draft
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
