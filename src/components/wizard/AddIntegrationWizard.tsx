import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Globe, Link, Phone, PhoneForwarded, Settings, ShieldCheck, Terminal, Zap } from "lucide-react";
import Card from "../shared/Card";
import { PRESETS } from "../../data/mockData";
import type {
  BuyerDestinationKind,
  IntegrationConfig,
  IntegrationDirection,
  IntegrationType,
} from "../../models/appTypes";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { useToast } from "../shared/ToastProvider";
import { createId } from "../../utils/id";

interface AddIntegrationWizardProps {
  onComplete?: (id: string) => void;
  initialContext?: {
    campaignId?: string;
    direction?: IntegrationDirection;
  };
}

const steps = ["Direction", "Type", "Basics", "Preset", "Configure", "Parsing", "Review", "Save", "Test"];

const AddIntegrationWizard: React.FC<AddIntegrationWizardProps> = ({ onComplete, initialContext }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const toast = useToast();
  const hasInitialCampaign = Boolean(initialContext?.campaignId);
  const hasInitialDirection = Boolean(initialContext?.direction);
  const [step, setStep] = useState(hasInitialCampaign && hasInitialDirection ? 2 : hasInitialDirection ? 2 : 1);
  const [direction, setDirection] = useState<IntegrationDirection | null>(initialContext?.direction || null);
  const [type, setType] = useState<IntegrationType | null>(null);
  const [buyerKind, setBuyerKind] = useState<BuyerDestinationKind | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const [integrationName, setIntegrationName] = useState("");
  const [campaignId, setCampaignId] = useState(initialContext?.campaignId || "");
  const [savedIntegrationId, setSavedIntegrationId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<IntegrationConfig>>({
    method: "POST",
    timeoutSeconds: 3,
    requiredFields: ["caller_id", "zip"],
    responseParsing: {
      acceptedPath: "$.accepted",
      acceptedValue: true,
      destinationNumberPath: "$.phone_number",
      bidPath: "$.bid",
      rejectReasonPath: "$.reason"
    }
  });

  const normalizedConfig = useMemo((): IntegrationConfig => {
    if (direction === "publisher") {
      return {
        ...config,
        publisherId: config.publisherId || `pub_${(integrationName || "draft").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "draft"}`,
        postingUrl: config.postingUrl || `https://mock-ppcall.local/rtb/${campaignId || "campaign"}/publisher`,
        requiredFields: config.requiredFields?.length ? config.requiredFields : ["caller_id", "zip"],
        acceptedResponse: config.acceptedResponse || { accepted: true, phone_number: "+18005551212", payout: 35, expires_in_seconds: config.expiresInSeconds || 30 },
        rejectedResponse: config.rejectedResponse || { accepted: false, reason: "no_buyer_available" },
        expiresInSeconds: type === "rtb" ? config.expiresInSeconds || 30 : config.expiresInSeconds
      };
    }
    if (buyerKind === "direct_number") {
      return {
        ...config,
        buyerDestinationKind: "direct_number",
        destinationMode: "static_number",
        destination: {
          ...(config.destination || {}),
          number: config.destination?.number ?? config.destinationNumber ?? "",
        },
        destinationNumber: config.destination?.number ?? config.destinationNumber ?? "",
        payout: config.payout,
        conversionDurationSeconds: config.conversionDurationSeconds,
        caps: config.caps,
        schedule: config.schedule,
      };
    }
    if (buyerKind === "direct_sip") {
      return {
        ...config,
        buyerDestinationKind: "direct_sip",
        destinationMode: "static_sip",
        destination: {
          ...(config.destination || {}),
          sipAddress: config.destination?.sipAddress ?? config.sipAddress ?? "",
        },
        sipAddress: config.destination?.sipAddress ?? config.sipAddress ?? "",
        payout: config.payout,
        conversionDurationSeconds: config.conversionDurationSeconds,
        caps: config.caps,
        schedule: config.schedule,
      };
    }
    if (type === "static_number") {
      return {
        destinationNumber: config.destinationNumber || "",
        payout: config.payout,
        conversionDurationSeconds: config.conversionDurationSeconds,
        caps: config.caps,
        schedule: config.schedule
      };
    }
    if (type === "sip") {
      return {
        sipAddress: config.sipAddress || "",
        payout: config.payout,
        conversionDurationSeconds: config.conversionDurationSeconds,
        caps: config.caps,
        schedule: config.schedule
      };
    }
    return config as IntegrationConfig;
  }, [buyerKind, campaignId, config, direction, integrationName, type]);

  const isDirectTarget = direction === "buyer" && (buyerKind === "direct_number" || buyerKind === "direct_sip");

  const canContinue = () => {
    if (step === 1) return Boolean(direction);
    if (step === 2) return Boolean(type);
    if (step === 3) return Boolean(campaignId && integrationName.trim());
    if (step === 5) {
      if (direction === "publisher") return Boolean(normalizedConfig.publisherId && (normalizedConfig.postingUrl || normalizedConfig.destinationNumber || normalizedConfig.sipAddress));
      if (buyerKind === "direct_number")
        return Boolean(
          (normalizedConfig.destination?.number || normalizedConfig.destinationNumber) &&
            normalizedConfig.payout &&
            normalizedConfig.conversionDurationSeconds
        );
      if (buyerKind === "direct_sip")
        return Boolean(
          (normalizedConfig.destination?.sipAddress || normalizedConfig.sipAddress) &&
            normalizedConfig.payout &&
            normalizedConfig.conversionDurationSeconds
        );
      if (type === "static_number") return Boolean(normalizedConfig.destinationNumber && normalizedConfig.payout && normalizedConfig.conversionDurationSeconds);
      if (type === "sip") return Boolean(normalizedConfig.sipAddress && normalizedConfig.payout && normalizedConfig.conversionDurationSeconds);
      return Boolean(normalizedConfig.url && normalizedConfig.method);
    }
    if (step === 6 && direction === "buyer" && !isDirectTarget && ["rtb", "generic_api", "webhook"].includes(type || "")) {
      return Boolean(normalizedConfig.responseParsing?.acceptedPath && (normalizedConfig.responseParsing.destinationNumberPath || normalizedConfig.responseParsing.sipAddressPath));
    }
    return true;
  };

  const saveDraft = () => {
    if (!direction || !type || !campaignId || !integrationName.trim()) return;
    const configToSave = buildConfigWithDefaultChild(normalizedConfig, direction, type, integrationName.trim());
    const integration = actions.createIntegration({
      campaignId,
      name: integrationName.trim(),
      direction,
      type,
      platformPreset: selectedPreset,
      status: "draft",
      config: configToSave
    });
    setSavedIntegrationId(integration.id);
    const successMessage = isDirectTarget
      ? "Direct target draft created. Run a test before activation."
      : "Draft created. Run a test before activation.";
    setMessage(successMessage);
    toast.success(`Draft integration "${integration.name}" created.`);
    setStep(9);
  };

  const updateConfig = <Key extends keyof IntegrationConfig>(key: Key, value: IntegrationConfig[Key]) => {
    setConfig(current => ({ ...current, [key]: value }));
  };

  const updateParsing = (key: keyof NonNullable<IntegrationConfig["responseParsing"]>, value: string | boolean | number) => {
    setConfig(current => ({ ...current, responseParsing: { ...current.responseParsing, [key]: value } }));
  };

  const toggleRequiredField = (field: string) => {
    setConfig(current => {
      const fields = current.requiredFields || [];
      return { ...current, requiredFields: fields.includes(field) ? fields.filter(item => item !== field) : [...fields, field] };
    });
  };

  const selectPreset = (key: string) => {
    setSelectedPreset(key);
    if (PRESETS[key]) setConfig(current => ({ ...current, ...PRESETS[key].config }));
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Choose Integration Direction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "publisher", title: "Publisher / Supplier", desc: "Traffic flowing into your platform.", icon: ArrowRight },
                { id: "buyer", title: "Buyer / Destination", desc: "Routing calls out to buyer endpoints.", icon: ArrowLeft }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button data-testid={`wizard-direction-${item.id}`} key={item.id} onClick={() => setDirection(item.id as IntegrationDirection)} className={`p-6 border-2 rounded-xl text-left transition-all ${direction === item.id ? "border-purple-600 bg-purple-50" : "border-slate-100 hover:border-purple-300"}`}>
                    <Icon size={24} className="text-purple-600 mb-4" />
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 2: {
        type TypeOption = {
          id: IntegrationType;
          buyerKind?: BuyerDestinationKind;
          testId: string;
          label: string;
          icon: typeof Phone;
        };
        const buyerOptions: TypeOption[] = [
          { id: "static_number", buyerKind: "direct_number", testId: "direct-number", label: "Direct Number Target", icon: PhoneForwarded },
          { id: "sip", buyerKind: "direct_sip", testId: "direct-sip", label: "Direct SIP Target", icon: Globe },
          { id: "rtb", buyerKind: "rtb", testId: "rtb", label: "RTB / Ping-Post Target", icon: Zap },
          { id: "webhook", buyerKind: "webhook", testId: "webhook", label: "Webhook Target", icon: Link },
          { id: "generic_api", buyerKind: "generic_api", testId: "generic-api", label: "Generic API Target", icon: Terminal },
        ];
        const publisherOptions: TypeOption[] = [
          { id: "static_number", testId: "static-number", label: "Static Number", icon: Phone },
          { id: "rtb", testId: "rtb", label: "RTB / Ping-Post", icon: Zap },
          { id: "sip", testId: "sip", label: "SIP Trunking", icon: Globe },
          { id: "webhook", testId: "webhook", label: "Webhook", icon: Link },
          { id: "generic_api", testId: "generic-api", label: "Generic API", icon: Terminal },
        ];
        const options = direction === "buyer" ? buyerOptions : publisherOptions;
        const isOptionSelected = (option: TypeOption) =>
          direction === "buyer"
            ? type === option.id && buyerKind === (option.buyerKind || null)
            : type === option.id;
        const handleSelect = (option: TypeOption) => {
          setType(option.id);
          setBuyerKind(direction === "buyer" ? option.buyerKind || null : null);
        };
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-center">Choose Integration Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {options.map(item => {
                const Icon = item.icon;
                return (
                  <button data-testid={`wizard-type-${item.testId}`} key={item.testId} onClick={() => handleSelect(item)} className={`p-4 border rounded-lg text-center transition-all ${isOptionSelected(item) ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:border-purple-300"}`}>
                    <Icon size={24} className="mx-auto text-slate-500 mb-2" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Campaign + Integration Name</h3>
            <label className="block text-xs font-bold text-slate-500 uppercase">Integration Name
              <input data-testid="integration-name-input" className="mt-1 w-full p-2 border rounded-lg text-sm normal-case" value={integrationName} onChange={event => setIntegrationName(event.target.value)} placeholder="e.g. Acme HVAC RTB" />
            </label>
            <label className="block text-xs font-bold text-slate-500 uppercase">Campaign
              <select data-testid="campaign-select" className="mt-1 w-full p-2 border rounded-lg text-sm bg-white normal-case" value={campaignId} onChange={event => setCampaignId(event.target.value)}>
                <option value="">Select a campaign...</option>
                {state.campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              </select>
            </label>
          </div>
        );
      case 4: {
        const presets = Object.entries(PRESETS).filter(([key]) => {
          if (buyerKind === "direct_number") return key === "direct_number" || key === "static_number";
          if (buyerKind === "direct_sip") return key === "direct_sip" || key === "sip_endpoint";
          if (type === "static_number") return key.includes("static");
          if (type === "rtb") return key.includes("rtb") || key.includes("ping");
          if (type === "sip") return key.includes("sip");
          return true;
        });
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Select Platform Preset</h3>
            {presets.map(([key, preset]) => (
              <button data-testid={`wizard-preset-${key.split('_').join('-')}`} key={key} onClick={() => selectPreset(key)} className="w-full p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
                <span className="font-medium text-slate-900">{preset.name}</span>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            ))}
            <button data-testid="wizard-preset-custom" onClick={() => selectPreset("custom")} className="w-full p-4 border border-dashed border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
              <span className="font-medium text-slate-500 italic">Custom / Manual Setup</span>
              <Settings size={16} className="text-slate-400" />
            </button>
          </div>
        );
      }
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Configure Request / Destination</h3>
            {direction === "publisher" ? (
              <>
                <Field label="Publisher ID" value={normalizedConfig.publisherId || ""} onChange={value => updateConfig("publisherId", value)} />
                <Field label="Posting URL" value={normalizedConfig.postingUrl || ""} onChange={value => updateConfig("postingUrl", value)} />
                {type === "rtb" && <NumberField label="Expiration Seconds" value={normalizedConfig.expiresInSeconds || 30} onChange={value => updateConfig("expiresInSeconds", value)} />}
                <RequiredFields selected={normalizedConfig.requiredFields || []} onToggle={toggleRequiredField} />
              </>
            ) : buyerKind === "direct_number" ? (
              <>
                <Field testId="wizard-direct-number-input" label="Destination Number" value={normalizedConfig.destination?.number || normalizedConfig.destinationNumber || ""} onChange={value => {
                  setConfig(current => ({
                    ...current,
                    destinationNumber: value,
                    destination: { ...(current.destination || {}), number: value },
                  }));
                }} />
                <p className="text-[11px] text-slate-500 italic">Use country code format, such as +12223334444.</p>
                <NumberField label="Payout" value={normalizedConfig.payout || 0} onChange={value => updateConfig("payout", value)} />
                <NumberField label="Conversion Duration Seconds" value={normalizedConfig.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
                <DirectScheduleAndCapFields config={normalizedConfig} setConfig={setConfig} />
              </>
            ) : buyerKind === "direct_sip" ? (
              <>
                <Field testId="wizard-direct-sip-input" label="SIP Address" value={normalizedConfig.destination?.sipAddress || normalizedConfig.sipAddress || ""} onChange={value => {
                  setConfig(current => ({
                    ...current,
                    sipAddress: value,
                    destination: { ...(current.destination || {}), sipAddress: value },
                  }));
                }} />
                <p className="text-[11px] text-slate-500 italic">Use a SIP URI such as sip:buyer@example.com.</p>
                <NumberField label="Payout" value={normalizedConfig.payout || 0} onChange={value => updateConfig("payout", value)} />
                <NumberField label="Conversion Duration Seconds" value={normalizedConfig.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
                <DirectScheduleAndCapFields config={normalizedConfig} setConfig={setConfig} />
              </>
            ) : type === "static_number" ? (
              <>
                <Field label="Destination Number" value={normalizedConfig.destinationNumber || ""} onChange={value => updateConfig("destinationNumber", value)} />
                <NumberField label="Payout" value={normalizedConfig.payout || 0} onChange={value => updateConfig("payout", value)} />
                <NumberField label="Conversion Duration Seconds" value={normalizedConfig.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
              </>
            ) : type === "sip" ? (
              <>
                <Field label="SIP Address" value={normalizedConfig.sipAddress || ""} onChange={value => updateConfig("sipAddress", value)} />
                <NumberField label="Payout" value={normalizedConfig.payout || 0} onChange={value => updateConfig("payout", value)} />
                <NumberField label="Conversion Duration Seconds" value={normalizedConfig.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-xs font-bold text-slate-500 uppercase">Method
                    <select data-testid="wizard-method-select" className="mt-1 w-full p-2 border rounded-lg text-sm bg-white" value={normalizedConfig.method || "POST"} onChange={event => updateConfig("method", event.target.value as IntegrationConfig["method"])}>
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </label>
                  <div className="md:col-span-2"><Field testId="wizard-url-input" label="URL" value={normalizedConfig.url || ""} onChange={value => updateConfig("url", value)} /></div>
                </div>
                <NumberField label="Timeout Seconds" value={normalizedConfig.timeoutSeconds || 3} onChange={value => updateConfig("timeoutSeconds", value)} />
              </>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Response Parsing</h3>
            {direction === "publisher" || isDirectTarget || type === "static_number" || type === "sip" ? (
              <div data-testid="wizard-no-parsing-required" className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
                {isDirectTarget
                  ? "Direct targets route calls to a number or SIP destination. No buyer response JSON parsing is required."
                  : "This integration type does not require buyer response JSON parsing."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Accepted Path" value={normalizedConfig.responseParsing?.acceptedPath || ""} onChange={value => updateParsing("acceptedPath", value)} />
                <Field label="Accepted Value" value={String(normalizedConfig.responseParsing?.acceptedValue ?? true)} onChange={value => updateParsing("acceptedValue", value === "true" ? true : value)} />
                <Field label="Destination Number Path" value={normalizedConfig.responseParsing?.destinationNumberPath || ""} onChange={value => updateParsing("destinationNumberPath", value)} />
                <Field label="SIP Address Path" value={normalizedConfig.responseParsing?.sipAddressPath || ""} onChange={value => updateParsing("sipAddressPath", value)} />
                <Field label="Bid / Payout Path" value={normalizedConfig.responseParsing?.bidPath || ""} onChange={value => updateParsing("bidPath", value)} />
                <Field label="Reject Reason Path" value={normalizedConfig.responseParsing?.rejectReasonPath || ""} onChange={value => updateParsing("rejectReasonPath", value)} />
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Review JSON</h3>
            <pre className="p-4 bg-slate-900 text-blue-300 rounded-xl text-xs overflow-auto max-h-96">{JSON.stringify({ campaignId, name: integrationName, direction, type, platformPreset: selectedPreset, status: "draft", config: normalizedConfig }, null, 2)}</pre>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4 text-center">
            <ShieldCheck size={48} className="mx-auto text-green-600" />
            <h3 className="text-lg font-semibold">Save Draft</h3>
            <p className="text-sm text-slate-500">The draft will be saved as normalized JSON. It will not be activated until a stored test passes.</p>
            <button data-testid="wizard-save-draft-button" onClick={saveDraft} disabled={!canContinue()} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-slate-200">Save Draft</button>
          </div>
        );
      case 9:
        return (
          <div data-testid="wizard-saved-step" className="space-y-6 text-center py-8">
            <ShieldCheck size={48} className="mx-auto text-green-600" />
            <h3 className="text-2xl font-bold text-slate-900">Draft Integration Saved</h3>
            <p className="text-slate-500">{message || "Draft created. Run a test before activation."}</p>
            <div className="flex gap-4 pt-4">
              <button data-testid="wizard-open-detail-button" onClick={() => savedIntegrationId && onComplete?.(savedIntegrationId)} className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">Open Detail</button>
              <button onClick={() => onComplete?.("")} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200">Back to Integrations</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const goNext = () => {
    if (canContinue()) setStep(current => Math.min(current + 1, steps.length));
  };

  return (
    <div data-testid="wizard-page" className="max-w-3xl mx-auto space-y-8">
      {(initialContext?.campaignId || initialContext?.direction) && (
        <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-800">
          Creating {initialContext.direction ? `${initialContext.direction} ` : ""}integration{initialContext.campaignId ? " for this campaign" : ""}.
        </div>
      )}
      <div className="grid grid-cols-9 gap-1">
        {steps.map((label, index) => {
          const s = index + 1;
          return (
            <div key={label} className="text-center">
              <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? "bg-purple-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              <p className="mt-1 text-[10px] text-slate-500 hidden md:block">{label}</p>
            </div>
          );
        })}
      </div>
      <Card>
        {renderStep()}
        {step < 9 && step !== 8 && (
          <div className="mt-8 flex items-center justify-between">
            <button data-testid="wizard-back-button" onClick={() => setStep(current => Math.max(1, current - 1))} disabled={step === 1} className="flex items-center gap-2 text-sm text-slate-500 disabled:opacity-40">
              <ArrowLeft size={16} /> Back
            </button>
            <button data-testid="wizard-continue-button" onClick={goNext} disabled={!canContinue()} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:bg-slate-200">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}
        {step === 8 && (
          <button onClick={() => setStep(7)} className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </Card>
    </div>
  );
};

function buildConfigWithDefaultChild(config: IntegrationConfig, direction: IntegrationDirection, type: IntegrationType, name: string): IntegrationConfig {
  if (direction === "publisher" && !config.publisherSources?.length) {
    return {
      ...config,
      publisherSources: [{
        id: createId("src"),
        name: `${name} Default Source`,
        publisherId: config.publisherId || `pub_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        sourceId: "default",
        status: "draft",
        requiredFields: config.requiredFields || ["caller_id", "zip"],
        postingUrl: config.postingUrl,
        caps: config.caps,
        usageCount: 0,
        errorRate: 0
      }]
    };
  }

  if (direction === "buyer" && !config.buyerTargets?.length) {
    const targetConfig: IntegrationConfig = { ...config, buyerTargets: undefined, routing: undefined };
    return {
      ...config,
      routing: config.routing || { strategy: "priority" },
      buyerTargets: [{
        id: createId("target"),
        name: `${name} Default Target`,
        status: "draft",
        priority: 1,
        weight: 100,
        type,
        config: targetConfig,
        caps: config.caps,
        schedule: config.schedule,
        usageCount: 0,
        errorRate: 0
      }]
    };
  }

  return config;
}

const Field = ({ label, value, onChange, testId }: { label: string; value: string; onChange: (value: string) => void; testId?: string }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    {label}
    <input data-testid={testId} className="mt-1 w-full p-2 border rounded-lg text-sm font-mono normal-case" value={value} onChange={event => onChange(event.target.value)} />
  </label>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    {label}
    <input type="number" className="mt-1 w-full p-2 border rounded-lg text-sm normal-case" value={value || ""} onChange={event => onChange(Number(event.target.value))} />
  </label>
);

const DirectScheduleAndCapFields = ({ config, setConfig }: { config: IntegrationConfig; setConfig: React.Dispatch<React.SetStateAction<Partial<IntegrationConfig>>> }) => {
  const timezone = config.schedule?.timezone || "America/New_York";
  const dailyCap = config.caps?.daily ?? 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
      <label className="block text-xs font-bold text-slate-500 uppercase">Timezone
        <select
          data-testid="wizard-direct-timezone"
          className="mt-1 w-full p-2 border rounded-lg text-sm bg-white normal-case"
          value={timezone}
          onChange={event => setConfig(current => ({
            ...current,
            schedule: {
              timezone: event.target.value,
              days: current.schedule?.days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              startTime: current.schedule?.startTime || "00:00",
              endTime: current.schedule?.endTime || "23:59",
              mode: current.schedule?.mode || "always_open",
            },
          }))}
        >
          {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "UTC"].map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-bold text-slate-500 uppercase">Daily Cap
        <input
          type="number"
          data-testid="wizard-direct-daily-cap"
          className="mt-1 w-full p-2 border rounded-lg text-sm normal-case"
          value={dailyCap || ""}
          onChange={event => {
            const next = Number(event.target.value);
            setConfig(current => ({
              ...current,
              caps: {
                ...(current.caps || {}),
                daily: next > 0 ? next : undefined,
              },
            }));
          }}
        />
      </label>
    </div>
  );
};

const RequiredFields = ({ selected, onToggle }: { selected: string[]; onToggle: (field: string) => void }) => (
  <div>
    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Required Fields</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {["caller_id", "zip", "state", "publisher_id", "trusted_form", "jornaya"].map(field => (
        <label key={field} className="flex items-center gap-2 text-xs text-slate-700 p-2 border rounded-lg">
          <input type="checkbox" checked={selected.includes(field)} onChange={() => onToggle(field)} />
          {field}
        </label>
      ))}
    </div>
  </div>
);

export default AddIntegrationWizard;
