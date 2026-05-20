import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Integration } from "../../models/appTypes";
import Card from "../shared/Card";
import { useToast } from "../shared/ToastProvider";

interface PublisherInstructionsProps {
  integration: Integration;
}

const PublisherInstructions: React.FC<PublisherInstructionsProps> = ({ integration }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const toast = useToast();

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard.");
    }
  };

  const { config } = integration;

  const instructionsObj = {
    postingUrl: config.postingUrl || `https://mock-ppcall.local/rtb/${integration.campaignId}/${integration.id}`,
    requiredFields: config.requiredFields || ["caller_id", "zip"],
    acceptedResponse: {
      accepted: true,
      phone_number: "+18005551212",
      payout: 35,
      expires_in_seconds: config.expiresInSeconds || 30
    },
    rejectedResponse: {
      accepted: false,
      reason: "no_buyer_available"
    }
  };

  const instructionsJson = JSON.stringify(instructionsObj, null, 2);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Integration Guidelines</h3>
          <p className="text-xs text-slate-500">Provide these instructions to your publisher to begin receiving traffic.</p>
        </div>
        <button onClick={() => handleCopy("json", instructionsJson)} className="px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 flex items-center gap-1">
          {copiedId === "json" ? <Check size={14} /> : <Copy size={14} />} Copy JSON
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Publisher ID</p>
          <div className="flex justify-between items-center">
            <code className="text-sm font-mono text-slate-900">{integration.id}</code>
            <button onClick={() => handleCopy('pub_id', integration.id)} className="text-slate-400 hover:text-purple-600">
              {copiedId === 'pub_id' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Campaign Route</p>
          <div className="flex justify-between items-center">
            <code className="text-sm font-mono text-slate-900">{integration.campaignId}</code>
            <button onClick={() => handleCopy('camp_id', integration.campaignId)} className="text-slate-400 hover:text-purple-600">
              {copiedId === 'camp_id' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </Card>
      </div>

      <Card title="Request Structure">
        <div className="relative">
          <pre className="p-4 bg-slate-900 text-blue-300 font-mono text-xs rounded-xl overflow-x-auto">
            {instructionsJson}
          </pre>
          <button 
            onClick={() => handleCopy('json', instructionsJson)} 
            className="absolute top-2 right-2 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            {copiedId === 'json' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default PublisherInstructions;
