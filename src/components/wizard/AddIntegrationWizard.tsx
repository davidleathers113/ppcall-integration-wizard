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
import { validatePhoneNumber, validateSipAddress } from "../../utils/targetValidation";

interface AddIntegrationWizardProps {
  onComplete?: (id: string) => void;
  initialContext?: {
    campaignId?: string;
    direction?: IntegrationDirection;
  };
}

type WizardStepId =
  | "direction"
  | "type"
  | "basics"
  | "preset"
  | "destination"
  | "call-handling"
  | "schedule-caps"
  | "configure"
  | "parsing"
  | "review"
  | "save"
  | "saved";

interface WizardStepContext {
  direction: IntegrationDirection | null;
  type: IntegrationType | null;
  buyerKind: BuyerDestinationKind | null;
}

interface WizardStepDef {
  id: WizardStepId;
  label: string;
  applies: (ctx: WizardStepContext) => boolean;
}

const isDirectKind = (kind: BuyerDestinationKind | null) =>
  kind === "direct_number" || kind === "direct_sip";

const MASTER_STEPS: WizardStepDef[] = [
  { id: "direction", label: "Direction", applies: () => true },
  { id: "type", label: "Type", applies: () => true },
  { id: "basics", label: "Basics", applies: () => true },
  { id: "preset", label: "Preset", applies: () => true },
  // Direct-target path (direct number / direct sip):
  { id: "destination", label: "Destination", applies: ctx => isDirectKind(ctx.buyerKind) },
  { id: "call-handling", label: "Call Handling", applies: ctx => isDirectKind(ctx.buyerKind) },
  { id: "schedule-caps", label: "Schedule & Caps", applies: ctx => isDirectKind(ctx.buyerKind) },
  // RTB / webhook / generic_api / publisher path:
  { id: "configure", label: "Configure", applies: ctx => !isDirectKind(ctx.buyerKind) },
  {
    id: "parsing",
    label: "Parsing",
    applies: ctx =>
      !isDirectKind(ctx.buyerKind) &&
      ctx.direction === "buyer" &&
      (ctx.type === "rtb" || ctx.type === "webhook" || ctx.type === "generic_api"),
  },
  { id: "review", label: "Review", applies: () => true },
  { id: "save", label: "Save", applies: () => true },
  { id: "saved", label: "Saved", applies: () => true },
];

const AddIntegrationWizard: React.FC<AddIntegrationWizardProps> = ({ onComplete, initialContext }) => {
  const { state } = useAppContext();
  const actions = useAppActions();
  const toast = useToast();
  const hasInitialDirection = Boolean(initialContext?.direction);
  const [stepId, setStepId] = useState<WizardStepId>(hasInitialDirection ? "type" : "direction");
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

  const stepContext: WizardStepContext = useMemo(
    () => ({ direction, type, buyerKind }),
    [direction, type, buyerKind]
  );
  const activeSteps = useMemo(
    () => MASTER_STEPS.filter(step => step.applies(stepContext)),
    [stepContext]
  );
  const activeStepIds = useMemo(() => activeSteps.map(step => step.id), [activeSteps]);
  // If direction/type/buyerKind changes invalidate the persisted stepId, derive
  // a safe fallback at render time instead of syncing state in an effect.
  // The next navigation click will set stepId properly.
  const safeStepId: WizardStepId = activeStepIds.includes(stepId)
    ? stepId
    : activeStepIds[Math.max(0, activeStepIds.length - 1)] || "direction";
  const currentIndex = activeStepIds.indexOf(safeStepId);
  // Visible (non-terminal) steps for the breadcrumb. "saved" is terminal — hide
  // it until reached so the breadcrumb count matches the linear flow.
  const visibleSteps = useMemo(
    () => activeSteps.filter(step => step.id !== "saved"),
    [activeSteps]
  );

  const normalizedConfig = useMemo((): IntegrationConfig => {
    if (direction === "publisher") {
      return {
        ...config,
        publisherId: config.publisherId || `pub_${slugify(integrationName || "draft") || "draft"}`,
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
        schedule: config.schedule ?? defaultDirectTargetSchedule(),
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
        schedule: config.schedule ?? defaultDirectTargetSchedule(),
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

  const isDirectTarget = direction === "buyer" && isDirectKind(buyerKind);

  const canContinue = () => {
    switch (safeStepId) {
      case "direction":
        return Boolean(direction);
      case "type":
        return Boolean(type);
      case "basics":
        return Boolean(campaignId && integrationName.trim());
      case "preset":
        return true;
      case "destination": {
        if (buyerKind === "direct_number") {
          const number = normalizedConfig.destination?.number || normalizedConfig.destinationNumber || "";
          return validatePhoneNumber(number).valid;
        }
        if (buyerKind === "direct_sip") {
          const sipAddress = normalizedConfig.destination?.sipAddress || normalizedConfig.sipAddress || "";
          return validateSipAddress(sipAddress).valid;
        }
        return true;
      }
      case "call-handling": {
        // Payout + conversion duration are mandatory for direct targets.
        return Boolean(normalizedConfig.payout && normalizedConfig.conversionDurationSeconds);
      }
      case "schedule-caps": {
        // Timezone is required; everything else has sensible defaults.
        return Boolean(normalizedConfig.schedule?.timezone);
      }
      case "configure": {
        if (direction === "publisher") {
          return Boolean(
            normalizedConfig.publisherId &&
              (normalizedConfig.postingUrl ||
                normalizedConfig.destinationNumber ||
                normalizedConfig.sipAddress)
          );
        }
        if (type === "static_number") {
          return Boolean(
            normalizedConfig.destinationNumber &&
              normalizedConfig.payout &&
              normalizedConfig.conversionDurationSeconds
          );
        }
        if (type === "sip") {
          return Boolean(
            normalizedConfig.sipAddress &&
              normalizedConfig.payout &&
              normalizedConfig.conversionDurationSeconds
          );
        }
        return Boolean(normalizedConfig.url && normalizedConfig.method);
      }
      case "parsing":
        return Boolean(
          normalizedConfig.responseParsing?.acceptedPath &&
            (normalizedConfig.responseParsing.destinationNumberPath ||
              normalizedConfig.responseParsing.sipAddressPath)
        );
      default:
        return true;
    }
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
    setStepId("saved");
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
    // Advance to the first step that follows "preset" in the active list.
    const presetIdx = MASTER_STEPS.findIndex(step => step.id === "preset");
    const next = MASTER_STEPS.slice(presetIdx + 1).find(step => step.applies(stepContext));
    if (next) setStepId(next.id);
  };

  const renderStep = () => {
    switch (safeStepId) {
      case "direction":
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
      case "type": {
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
      case "basics":
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
      case "preset": {
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
      case "destination":
        return (
          <div data-testid="wizard-step-destination" className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Destination</h3>
            {buyerKind === "direct_number" ? (
              <>
                <Field testId="wizard-direct-number-input" label="Destination Number" value={normalizedConfig.destination?.number || normalizedConfig.destinationNumber || ""} onChange={value => {
                  setConfig(current => ({
                    ...current,
                    destinationNumber: value,
                    destination: { ...(current.destination || {}), number: value },
                  }));
                }} />
                <WizardNumberStatus value={normalizedConfig.destination?.number || normalizedConfig.destinationNumber || ""} />
                <p className="text-[11px] text-slate-500 italic">Use country code format, such as +12223334444.</p>
              </>
            ) : (
              <>
                <Field testId="wizard-direct-sip-input" label="SIP Address" value={normalizedConfig.destination?.sipAddress || normalizedConfig.sipAddress || ""} onChange={value => {
                  setConfig(current => ({
                    ...current,
                    sipAddress: value,
                    destination: { ...(current.destination || {}), sipAddress: value },
                  }));
                }} />
                <WizardSipStatus value={normalizedConfig.destination?.sipAddress || normalizedConfig.sipAddress || ""} />
                <p className="text-[11px] text-slate-500 italic">Use a SIP URI such as sip:buyer@example.com.</p>
                <DirectSipHeadersField config={normalizedConfig} setConfig={setConfig} />
              </>
            )}
          </div>
        );
      case "call-handling":
        return (
          <div data-testid="wizard-step-call-handling" className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Call Handling &amp; Revenue</h3>
            <NumberField label="Payout" value={normalizedConfig.payout || 0} onChange={value => updateConfig("payout", value)} />
            <NumberField label="Conversion Duration Seconds" value={normalizedConfig.conversionDurationSeconds || 0} onChange={value => updateConfig("conversionDurationSeconds", value)} />
            <DirectCallHandlingFields config={normalizedConfig} setConfig={setConfig} />
          </div>
        );
      case "schedule-caps":
        return (
          <div data-testid="wizard-step-schedule-caps" className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Schedule, Caps &amp; Duplicate Rules</h3>
            <DirectScheduleAndCapFields config={normalizedConfig} setConfig={setConfig} />
            <DirectDuplicateRulesField config={normalizedConfig} setConfig={setConfig} />
          </div>
        );
      case "configure":
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
      case "parsing":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Response Parsing</h3>
            {direction === "publisher" || type === "static_number" || type === "sip" ? (
              <div data-testid="wizard-no-parsing-required" className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
                This integration type does not require buyer response JSON parsing.
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
      case "review":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Review JSON</h3>
            <pre className="p-4 bg-slate-900 text-blue-300 rounded-xl text-xs overflow-auto max-h-96">{JSON.stringify({ campaignId, name: integrationName, direction, type, platformPreset: selectedPreset, status: "draft", config: normalizedConfig }, null, 2)}</pre>
          </div>
        );
      case "save":
        return (
          <div className="space-y-4 text-center">
            <ShieldCheck size={48} className="mx-auto text-green-600" />
            <h3 className="text-lg font-semibold">Save Draft</h3>
            <p className="text-sm text-slate-500">The draft will be saved as normalized JSON. It will not be activated until a stored test passes.</p>
            <button data-testid="wizard-save-draft-button" onClick={saveDraft} disabled={!canContinue()} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-slate-200">Save Draft</button>
          </div>
        );
      case "saved":
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
    if (!canContinue()) return;
    const next = activeStepIds[currentIndex + 1];
    if (next) setStepId(next);
  };
  const goBack = () => {
    const prev = activeStepIds[currentIndex - 1];
    if (prev) setStepId(prev);
  };

  const visibleStepIds = visibleSteps.map(step => step.id);
  const visibleIndex = visibleStepIds.indexOf(safeStepId);
  const showSaveFooter = safeStepId === "save";
  const showStandardFooter = safeStepId !== "saved" && safeStepId !== "save";

  return (
    <div data-testid="wizard-page" className="max-w-3xl mx-auto space-y-8">
      {(initialContext?.campaignId || initialContext?.direction) && (
        <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-800">
          Creating {initialContext.direction ? `${initialContext.direction} ` : ""}integration{initialContext.campaignId ? " for this campaign" : ""}.
        </div>
      )}
      <div
        className="gap-1"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))`,
        }}
        data-testid="wizard-breadcrumb"
      >
        {visibleSteps.map((step, index) => {
          const isCurrent = step.id === safeStepId;
          const isPast = visibleIndex > index;
          return (
            <div key={step.id} className="text-center" data-testid={`wizard-breadcrumb-${step.id}`}>
              <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isCurrent ? "bg-purple-600 text-white" : isPast ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {isPast ? <Check size={12} /> : index + 1}
              </div>
              <p className="mt-1 text-[10px] text-slate-500 hidden md:block">{step.label}</p>
            </div>
          );
        })}
      </div>
      <Card>
        {renderStep()}
        {showStandardFooter && (
          <div className="mt-8 flex items-center justify-between">
            <button data-testid="wizard-back-button" onClick={goBack} disabled={currentIndex <= 0} className="flex items-center gap-2 text-sm text-slate-500 disabled:opacity-40">
              <ArrowLeft size={16} /> Back
            </button>
            <button data-testid="wizard-continue-button" onClick={goNext} disabled={!canContinue()} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:bg-slate-200">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}
        {showSaveFooter && (
          <button onClick={goBack} className="mt-8 flex items-center gap-2 text-sm text-slate-500">
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
        publisherId: config.publisherId || `pub_${slugify(name)}`,
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

const WizardNumberStatus: React.FC<{ value: string }> = ({ value }) => {
  if (!value) {
    return (
      <p
        data-testid="wizard-direct-number-status"
        data-status="empty"
        className="text-[11px] italic text-slate-500"
      >
        Destination number is required.
      </p>
    );
  }
  const result = validatePhoneNumber(value);
  return (
    <p
      data-testid="wizard-direct-number-status"
      data-status={result.valid ? "valid" : "invalid"}
      className={`text-[11px] italic ${result.valid ? "text-green-600" : "text-red-600"}`}
    >
      {result.valid ? "Looks valid." : result.message || "Invalid number."}
    </p>
  );
};

const WizardSipStatus: React.FC<{ value: string }> = ({ value }) => {
  if (!value) {
    return (
      <p
        data-testid="wizard-direct-sip-status"
        data-status="empty"
        className="text-[11px] italic text-slate-500"
      >
        SIP address is required.
      </p>
    );
  }
  const result = validateSipAddress(value);
  return (
    <p
      data-testid="wizard-direct-sip-status"
      data-status={result.valid ? "valid" : "invalid"}
      className={`text-[11px] italic ${result.valid ? "text-green-600" : "text-red-600"}`}
    >
      {result.valid ? "Looks valid." : result.message || "Invalid SIP address."}
    </p>
  );
};

function defaultDirectTargetSchedule() {
  return {
    timezone: "America/New_York",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startTime: "00:00",
    endTime: "23:59",
    mode: "always_open" as const,
  };
}

function slugify(value: string): string {
  // Lowercase, then collapse any run of non [a-z0-9] into single underscores,
  // and trim leading/trailing underscores. String-method based, no regex.
  const lowered = value.toLowerCase();
  let result = "";
  let lastWasUnderscore = true; // suppress leading underscores
  for (const ch of lowered) {
    const isAllowed = (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9");
    if (isAllowed) {
      result += ch;
      lastWasUnderscore = false;
    } else if (!lastWasUnderscore) {
      result += "_";
      lastWasUnderscore = true;
    }
  }
  // Trim trailing underscore.
  if (result.endsWith("_")) result = result.substring(0, result.length - 1);
  return result;
}

const DirectCallHandlingFields = ({ config, setConfig }: { config: IntegrationConfig; setConfig: React.Dispatch<React.SetStateAction<Partial<IntegrationConfig>>> }) => {
  const timeout = config.callHandling?.connectionTimeoutSeconds ?? 30;
  return (
    <div className="pt-2">
      <label className="block text-xs font-bold text-slate-500 uppercase">Connection Timeout (seconds)
        <input
          type="number"
          data-testid="wizard-direct-connection-timeout"
          className="mt-1 w-full p-2 border rounded-lg text-sm normal-case"
          value={timeout || ""}
          onChange={event => {
            const next = Number(event.target.value);
            setConfig(current => ({
              ...current,
              callHandling: {
                ...(current.callHandling || {}),
                connectionTimeoutSeconds: next > 0 ? next : undefined,
              },
            }));
          }}
        />
      </label>
    </div>
  );
};

const DirectDuplicateRulesField = ({ config, setConfig }: { config: IntegrationConfig; setConfig: React.Dispatch<React.SetStateAction<Partial<IntegrationConfig>>> }) => {
  const mode = config.duplicateRules?.mode ?? "buyer_default";
  const windowMinutes = config.duplicateRules?.windowMinutes ?? 0;
  return (
    <div className="pt-2 space-y-2">
      <label className="block text-xs font-bold text-slate-500 uppercase">Duplicate Rules
        <select
          data-testid="wizard-direct-duplicate-mode"
          className="mt-1 w-full p-2 border rounded-lg text-sm bg-white normal-case"
          value={mode}
          onChange={event => {
            const nextMode = event.target.value as "campaign_default" | "buyer_default" | "do_not_restrict" | "restrict";
            setConfig(current => ({
              ...current,
              duplicateRules: {
                mode: nextMode,
                windowMinutes:
                  nextMode === "restrict"
                    ? current.duplicateRules?.windowMinutes ?? 60
                    : undefined,
              },
            }));
          }}
        >
          <option value="campaign_default">Campaign default</option>
          <option value="buyer_default">Buyer default</option>
          <option value="do_not_restrict">Do not restrict</option>
          <option value="restrict">Restrict</option>
        </select>
      </label>
      {mode === "restrict" && (
        <label className="block text-xs font-bold text-slate-500 uppercase">Duplicate Window (minutes)
          <input
            type="number"
            data-testid="wizard-direct-duplicate-window"
            className="mt-1 w-full p-2 border rounded-lg text-sm normal-case"
            value={windowMinutes || ""}
            onChange={event => {
              const next = Number(event.target.value);
              setConfig(current => ({
                ...current,
                duplicateRules: {
                  mode: "restrict",
                  windowMinutes: next > 0 ? next : undefined,
                },
              }));
            }}
          />
        </label>
      )}
    </div>
  );
};

const DirectSipHeadersField = ({ config, setConfig }: { config: IntegrationConfig; setConfig: React.Dispatch<React.SetStateAction<Partial<IntegrationConfig>>> }) => {
  const initial = JSON.stringify(config.destination?.sipHeaders || {}, null, 2);
  const [text, setText] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);
  const apply = () => {
    try {
      const parsed = JSON.parse(text || "{}") as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Expected a JSON object.");
      }
      const stringRecord: Record<string, string> = {};
      for (const [headerKey, value] of Object.entries(parsed as Record<string, unknown>)) {
        stringRecord[headerKey] = String(value);
      }
      setConfig(current => ({
        ...current,
        destination: { ...(current.destination || {}), sipHeaders: stringRecord },
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON object.");
    }
  };
  return (
    <div className="pt-2 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase">SIP Headers (JSON, optional)</p>
        <button
          type="button"
          data-testid="wizard-direct-sip-headers-apply"
          onClick={apply}
          className="text-xs text-purple-600 font-bold"
        >
          Apply
        </button>
      </div>
      <textarea
        data-testid="wizard-direct-sip-headers"
        className="w-full h-20 p-3 bg-slate-900 text-blue-300 rounded-lg text-xs font-mono"
        value={text}
        onChange={event => setText(event.target.value)}
        spellCheck={false}
      />
      {error && (
        <p data-testid="wizard-direct-sip-headers-error" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

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
