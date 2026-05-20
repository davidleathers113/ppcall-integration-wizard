import React, { useState } from "react";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Zap, 
  ShieldCheck, 
  Settings, 
  Terminal,
  Globe,
  Phone,
  Link
} from "lucide-react";
import Card from "../shared/Card";

import { PRESETS } from "../../data/mockData";
import type { IntegrationDirection, IntegrationType, IntegrationConfig, Integration } from "../../models/appTypes";
import { useAppContext } from "../../store/AppStore";

interface AddIntegrationWizardProps {
  onComplete?: (id: string) => void;
}

const AddIntegrationWizard: React.FC<AddIntegrationWizardProps> = ({ onComplete }) => {
  const { state, dispatch } = useAppContext();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<IntegrationDirection | null>(null);
  const [type, setType] = useState<IntegrationType | null>(null);
  
  const [formData, setFormData] = useState<Partial<IntegrationConfig>>({});
  const [integrationName, setIntegrationName] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [savedIntegrationId, setSavedIntegrationId] = useState<string | null>(null);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleActivate = () => {
    const id = `int_${Math.random().toString(36).substr(2, 9)}`;
    const newInt: Integration = {
      id,
      campaignId: campaignId || state.campaigns[0].id,
      name: integrationName || "New Integration",
      direction: direction as IntegrationDirection,
      type: type as IntegrationType,
      platformPreset: "custom",
      status: "active",
      config: formData as IntegrationConfig,
      createdAt: new Date().toISOString(),
      createdBy: "User",
      updatedAt: new Date().toISOString(),
      updatedBy: "User",
      activatedAt: new Date().toISOString(),
      usageCount: 0,
      errorRate: 0
    };

    dispatch({ type: "CREATE_INTEGRATION", payload: newInt });
    dispatch({ 
      type: "ADD_ACTIVITY", 
      payload: {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
        integrationId: id,
        campaignId: newInt.campaignId,
        eventType: "created",
        message: `Created and activated ${newInt.name}.`,
        createdAt: new Date().toISOString(),
        actor: "User"
      }
    });

    setSavedIntegrationId(id);
    nextStep();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Choose Integration Direction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => { setDirection("publisher"); nextStep(); }}
                className={`p-6 border-2 rounded-xl text-left transition-all hover:border-purple-400 ${direction === "publisher" ? "border-purple-600 bg-purple-50" : "border-slate-100"}`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                  <ArrowRight size={24} />
                </div>
                <h4 className="font-bold text-slate-900">Publisher / Supplier</h4>
                <p className="text-sm text-slate-500 mt-1">Traffic flowing INTO your platform via calls or RTB requests.</p>
              </button>
              <button 
                onClick={() => { setDirection("buyer"); nextStep(); }}
                className={`p-6 border-2 rounded-xl text-left transition-all hover:border-purple-400 ${direction === "buyer" ? "border-purple-600 bg-purple-50" : "border-slate-100"}`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <ArrowLeft size={24} />
                </div>
                <h4 className="font-bold text-slate-900">Buyer / Destination</h4>
                <p className="text-sm text-slate-500 mt-1">Routing calls OUT of your platform to buyer endpoints or numbers.</p>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Choose Integration Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: "static_number", label: "Static Number", icon: Phone },
                { id: "rtb", label: "RTB / Ping-Post", icon: Zap },
                { id: "sip", label: "SIP Trunking", icon: Globe },
                { id: "webhook", label: "Webhook Postback", icon: Link },
                { id: "generic_api", label: "Generic API", icon: Terminal },
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button 
                    key={t.id}
                    onClick={() => { setType(t.id as IntegrationType); nextStep(); }}
                    className="p-4 border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-slate-50 transition-all text-center"
                  >
                    <Icon size={24} className="mx-auto text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-700">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3: {
        const presets = Object.entries(PRESETS).filter(([key]) => {
          if (type === "static_number") return key.includes("static");
          if (type === "rtb") return key.includes("rtb") || key.includes("ping");
          if (type === "sip") return key.includes("sip");
          return true;
        });
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Select Platform Preset</h3>
            <div className="space-y-2">
              {presets.map(([key, p]) => (
                <button 
                  key={key}
                  onClick={() => { setFormData(p.config); nextStep(); }}
                  className="w-full p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-all"
                >
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <ArrowRight size={16} className="text-slate-400" />
                </button>
              ))}
              <button 
                onClick={() => { nextStep(); }}
                className="w-full p-4 border border-slate-200 border-dashed rounded-lg flex items-center justify-between hover:bg-slate-50 transition-all"
              >
                <span className="font-medium text-slate-500 italic">Custom / Manual Setup</span>
                <Settings size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        );
      }
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Configure Required Fields</h3>
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Integration Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="e.g. Acme Plumbing RTB" 
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Campaign</label>
                <select 
                  className="w-full p-2 border rounded-lg appearance-none bg-white" 
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                >
                  <option value="">Select a Campaign...</option>
                  {state.campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Endpoint URL</label>
                <input type="text" className="w-full p-2 border rounded-lg font-mono text-sm" value={formData.url || ""} onChange={(e) => setFormData({...formData, url: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Method</label>
                  <select className="w-full p-2 border rounded-lg appearance-none bg-white" value={formData.method || "POST"} onChange={(e) => setFormData({...formData, method: e.target.value as IntegrationConfig['method']})}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Timeout (Seconds)</label>
                  <input type="number" className="w-full p-2 border rounded-lg" value={formData.timeoutSeconds || 3} onChange={(e) => setFormData({...formData, timeoutSeconds: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <button 
              onClick={nextStep}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              Continue to Testing
            </button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Test Integration</h3>
            <div className="bg-slate-900 rounded-lg p-4 text-left font-mono text-xs text-green-400 space-y-2 overflow-auto max-h-64">
              <p>{`> Initializing mock test sequence...`}</p>
              <p>{`> Requesting: ${formData.method || "POST"} ${formData.url || "https://api.mock.buyer/ping"}`}</p>
              <p>{`> Resolved Tokens: caller_id=7275551234, zip=34655`}</p>
              <p className="text-slate-400">{`... waiting for response ...`}</p>
              <p className="text-white font-bold">{`HTTP 200 OK (242ms)`}</p>
              <pre className="text-blue-300">{JSON.stringify({ accepted: true, phone_number: "+18005551212", bid: 35.00 }, null, 2)}</pre>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check size={16} /> <span>Endpoint connection successful</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check size={16} /> <span>Response parsing validated</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check size={16} /> <span>Destination number extracted</span>
              </div>
            </div>
            <button 
              onClick={handleActivate}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              Finish and Activate
            </button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
              <ShieldCheck size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Integration Ready!</h3>
            <p className="text-slate-500">
              The integration has passed all verification checks and is now active.
            </p>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => { if (onComplete && savedIntegrationId) onComplete(savedIntegrationId); }}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                View Detail
              </button>
              <button 
                onClick={() => { if (onComplete) onComplete(''); }}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between px-2">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s ? "bg-purple-600 text-white ring-4 ring-purple-100" : 
              step > s ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {step > s ? <Check size={14} /> : s}
            </div>
            {s < 6 && <div className={`w-8 md:w-16 h-0.5 mx-2 ${step > s ? "bg-green-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <Card>
        {renderStep()}
        {step > 1 && step < 6 && (
          <button 
            onClick={prevStep}
            className="mt-8 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </Card>
    </div>
  );
};

export default AddIntegrationWizard;
