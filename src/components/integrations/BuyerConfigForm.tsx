import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  AuthenticationMode,
  BuyerDestinationKind,
  CallHandlingConfig,
  CapUsage,
  DestinationMode,
  DialIvrSettings,
  DuplicateRules,
  ErrorSettings,
  FilterOperator,
  FilterRule,
  Integration,
  IntegrationCaps,
  IntegrationConfig,
  IntegrationSchedule,
  IntegrationScheduleDayRule,
  PredictiveRoutingConfig,
  RecordingSettings,
  RequestConfig,
  RequestContentType,
  RevenueSettings,
  ShareableTagsConfig,
} from "../../models/appTypes";
import { useAppActions } from "../../store/useAppActions";
import {
  FILTER_FIELDS,
  TIMEZONE_OPTIONS,
  WEEKDAYS,
  inferBuyerDestinationKind,
  inferCallHandling,
  inferCapUsage,
  inferDestination,
  inferDestinationMode,
  inferDialIvr,
  inferDuplicateRules,
  inferErrorSettings,
  inferFilters,
  inferPredictiveRouting,
  inferRecordingSettings,
  inferRequest,
  inferRevenueSettings,
  inferShareableTags,
  isDirectTargetKind,
} from "../../utils/buyerConfigDefaults";
import TokenPicker from "../shared/TokenPicker";
import { createId } from "../../utils/id";
import {
  validateDirectTargetConfig,
  validatePhoneNumber,
  validateSipAddress,
} from "../../utils/targetValidation";

interface BuyerConfigFormProps {
  integration: Integration;
}

const RTB_SECTION_TABS = [
  { id: "destination", label: "Destination" },
  { id: "request", label: "Request" },
  { id: "response-parsing", label: "Response Parsing" },
  { id: "filters", label: "Filters" },
  { id: "caps-schedule", label: "Caps & Schedule" },
  { id: "revenue-errors", label: "Revenue & Errors" },
  { id: "advanced", label: "Advanced Call Behavior" },
] as const;

const DIRECT_SECTION_TABS = [
  { id: "destination", label: "Destination" },
  { id: "call-handling", label: "Call Handling" },
  { id: "caps-schedule", label: "Caps & Schedule" },
  { id: "duplicate-rules", label: "Duplicate Rules" },
  { id: "revenue-recovery", label: "Revenue Recovery" },
  { id: "shareable-tags", label: "Shareable Tags" },
  { id: "predictive-routing", label: "Predictive Routing" },
] as const;

type SectionId =
  | (typeof RTB_SECTION_TABS)[number]["id"]
  | (typeof DIRECT_SECTION_TABS)[number]["id"];

const BuyerConfigForm: React.FC<BuyerConfigFormProps> = ({ integration }) => {
  const actions = useAppActions();
  const config = integration.config;
  const buyerKind = inferBuyerDestinationKind(integration);
  const isDirect = isDirectTargetKind(buyerKind);
  const sectionTabs = isDirect ? DIRECT_SECTION_TABS : RTB_SECTION_TABS;
  const [activeSection, setActiveSection] = useState<SectionId>("destination");
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  const destinationMode = inferDestinationMode(integration);
  const destination = inferDestination(integration);
  const request = inferRequest(config);
  const duplicateRules = inferDuplicateRules(config);
  const recording = inferRecordingSettings(config);
  const revenue = inferRevenueSettings(config);
  const errorSettings = inferErrorSettings(config);
  const filters = inferFilters(config);
  const dialIvr = inferDialIvr(config);
  const callHandling = inferCallHandling(config);
  const capUsage = inferCapUsage(config);
  const shareableTags = inferShareableTags(config);
  const predictiveRouting = inferPredictiveRouting(config);

  const validation = useMemo(() => {
    if (isDirect) {
      const issues = validateDirectTargetConfig(config, buyerKind);
      return issues
        .filter(item => item.severity === "error")
        .map(item => item.message);
    }
    const issues: string[] = [];
    if (destinationMode === "static_number" && !destination.number)
      issues.push("Static number destination requires a phone number.");
    if (destinationMode === "static_sip" && !destination.sipAddress)
      issues.push("Static SIP destination requires a SIP address.");
    if (destinationMode === "dynamic_number_from_response" && !destination.dynamicNumberPath)
      issues.push("Dynamic number requires a destination number path.");
    if (destinationMode === "dynamic_sip_from_response" && !destination.dynamicSipPath)
      issues.push("Dynamic SIP requires a SIP address path.");
    if (isApiStyle(destinationMode) && !request.url)
      issues.push("URL is required for dynamic destination modes.");
    if (isApiStyle(destinationMode) && !request.method)
      issues.push("HTTP method is required for dynamic destination modes.");
    if (
      duplicateRules.mode === "restrict" &&
      (duplicateRules.windowMinutes === undefined || duplicateRules.windowMinutes <= 0)
    )
      issues.push("Restrict duplicates mode requires a positive window in minutes.");
    if (!config.schedule?.timezone) issues.push("Timezone is required for the schedule.");
    return issues;
  }, [buyerKind, config, destination, destinationMode, duplicateRules, isDirect, request]);

  const update = (partial: Partial<IntegrationConfig>, message: string) => {
    actions.updateIntegration(
      integration.id,
      { config: { ...integration.config, ...partial } },
      { message }
    );
  };

  const updateDestinationMode = (mode: DestinationMode) => {
    update({ destinationMode: mode }, "Updated destination mode.");
  };

  const updateDestination = (key: keyof typeof destination, value: string) => {
    update(
      {
        destination: { ...destination, [key]: value || undefined },
      },
      "Updated destination details."
    );
  };

  const updateRequest = (partial: Partial<RequestConfig>) => {
    const next: RequestConfig = { ...request, ...partial };
    const updates: Partial<IntegrationConfig> = { request: next };
    if (partial.method) updates.method = partial.method;
    if (partial.url !== undefined) updates.url = partial.url;
    if (partial.headers) updates.headers = partial.headers;
    if (partial.queryParams) updates.queryParams = partial.queryParams;
    if (partial.body !== undefined && typeof partial.body !== "string")
      updates.requestBody = partial.body;
    if (partial.timeoutSeconds !== undefined) updates.timeoutSeconds = partial.timeoutSeconds;
    update(updates, "Updated request settings.");
  };

  const updateResponseParsing = (
    key: keyof NonNullable<IntegrationConfig["responseParsing"]>,
    value: string | boolean | number | undefined
  ) => {
    update(
      {
        responseParsing: {
          ...integration.config.responseParsing,
          [key]: value,
        },
      },
      "Updated response parsing config."
    );
  };

  const updateCaps = (key: keyof IntegrationCaps, value: number | string | undefined) => {
    update(
      {
        caps: { ...(config.caps || {}), [key]: value === undefined || value === "" ? undefined : value },
      },
      "Updated caps."
    );
  };

  const updateSchedule = (partial: Partial<IntegrationSchedule>) => {
    const current: IntegrationSchedule = config.schedule || {
      timezone: "America/New_York",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "17:00",
      mode: "basic",
    };
    update(
      {
        schedule: { ...current, ...partial },
      },
      "Updated schedule."
    );
  };

  const updateRevenue = (next: RevenueSettings) => {
    const updates: Partial<IntegrationConfig> = { revenueSettings: next };
    if (next.mode === "override") {
      updates.payout = next.payout;
      updates.conversionDurationSeconds = next.conversionDurationSeconds;
    }
    update(updates, "Updated revenue settings.");
  };

  const updateDuplicateRules = (next: DuplicateRules) => {
    update({ duplicateRules: next }, "Updated duplicate rules.");
  };

  const updateRecording = (next: RecordingSettings) => {
    update({ recordingSettings: next }, "Updated recording settings.");
  };

  const updateErrors = (next: ErrorSettings) => {
    update({ errorSettings: next }, "Updated error settings.");
  };

  const updateFilters = (next: FilterRule[]) => {
    update({ filters: next }, "Updated filter rules.");
  };

  const updateDialIvr = (next: DialIvrSettings) => {
    update({ dialIvr: next }, "Updated dial IVR settings.");
  };

  const updateCallHandling = (next: CallHandlingConfig) => {
    update({ callHandling: next }, "Updated call handling.");
  };

  const updateCapUsage = (next: CapUsage) => {
    update({ capUsage: next }, "Updated cap usage.");
  };

  const updateShareableTags = (next: ShareableTagsConfig) => {
    update({ shareableTags: next }, "Updated shareable tags.");
  };

  const updatePredictiveRouting = (next: PredictiveRoutingConfig) => {
    update({ predictiveRouting: next }, "Updated predictive routing.");
  };

  const applyJsonField = (key: "headers" | "queryParams" | "body", text: string) => {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Expected a JSON object.");
      if (key === "headers" || key === "queryParams") {
        const stringRecord = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([entryKey, value]) => [
            entryKey,
            String(value),
          ])
        );
        updateRequest({ [key]: stringRecord } as Partial<RequestConfig>);
      } else {
        updateRequest({ body: parsed as Record<string, unknown> });
      }
      setJsonErrors(current => ({ ...current, [key]: "" }));
    } catch (error) {
      setJsonErrors(current => ({
        ...current,
        [key]: error instanceof Error ? error.message : "Invalid JSON object.",
      }));
    }
  };

  return (
    <div data-testid="buyer-config-form" className="space-y-6">
      {validation.length > 0 && (
        <div
          data-testid="buyer-config-validation"
          className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 space-y-1"
        >
          {validation.map(issue => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {sectionTabs.map(section => (
          <button
            key={section.id}
            type="button"
            data-testid={`buyer-section-${section.id}`}
            onClick={() => setActiveSection(section.id)}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
              activeSection === section.id
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {isDirect ? (
          <>
            {activeSection === "destination" && (
              <DirectDestinationSection
                kind={buyerKind}
                destination={destination}
                onDestinationChange={updateDestination}
              />
            )}
            {activeSection === "call-handling" && (
              <CallHandlingSection
                callHandling={callHandling}
                dialIvr={dialIvr}
                recording={recording}
                updateCallHandling={updateCallHandling}
                updateDialIvr={updateDialIvr}
                updateRecording={updateRecording}
              />
            )}
            {activeSection === "caps-schedule" && (
              <CapsScheduleSection
                caps={config.caps || {}}
                schedule={config.schedule}
                capUsage={capUsage}
                updateCaps={updateCaps}
                updateSchedule={updateSchedule}
                updateCapUsage={updateCapUsage}
              />
            )}
            {activeSection === "duplicate-rules" && (
              <DuplicateRulesSection
                duplicateRules={duplicateRules}
                updateDuplicateRules={updateDuplicateRules}
              />
            )}
            {activeSection === "revenue-recovery" && (
              <RevenueRecoverySection
                callHandling={callHandling}
                revenue={revenue}
                updateCallHandling={updateCallHandling}
                updateRevenue={updateRevenue}
              />
            )}
            {activeSection === "shareable-tags" && (
              <ShareableTagsSection
                shareableTags={shareableTags}
                updateShareableTags={updateShareableTags}
              />
            )}
            {activeSection === "predictive-routing" && (
              <PredictiveRoutingSection
                predictiveRouting={predictiveRouting}
                updatePredictiveRouting={updatePredictiveRouting}
              />
            )}
          </>
        ) : (
          <>
            {activeSection === "destination" && (
              <DestinationSection
                mode={destinationMode}
                destination={destination}
                onModeChange={updateDestinationMode}
                onDestinationChange={updateDestination}
              />
            )}
            {activeSection === "request" && (
              <RequestSection
                request={request}
                jsonErrors={jsonErrors}
                applyJsonField={applyJsonField}
                onChange={updateRequest}
              />
            )}
            {activeSection === "response-parsing" && (
              <ResponseParsingSection
                config={config}
                updateResponseParsing={updateResponseParsing}
              />
            )}
            {activeSection === "filters" && (
              <FiltersSection filters={filters} updateFilters={updateFilters} />
            )}
            {activeSection === "caps-schedule" && (
              <CapsScheduleSection
                caps={config.caps || {}}
                schedule={config.schedule}
                capUsage={capUsage}
                updateCaps={updateCaps}
                updateSchedule={updateSchedule}
                updateCapUsage={updateCapUsage}
              />
            )}
            {activeSection === "revenue-errors" && (
              <RevenueErrorsSection
                revenue={revenue}
                errorSettings={errorSettings}
                updateRevenue={updateRevenue}
                updateErrors={updateErrors}
              />
            )}
            {activeSection === "advanced" && (
              <AdvancedCallBehaviorSection
                duplicateRules={duplicateRules}
                recording={recording}
                dialIvr={dialIvr}
                updateDuplicateRules={updateDuplicateRules}
                updateRecording={updateRecording}
                updateDialIvr={updateDialIvr}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

function isApiStyle(mode: DestinationMode) {
  return mode === "dynamic_number_from_response" || mode === "dynamic_sip_from_response";
}

// ===================== Sections =====================

const DESTINATION_MODES: Array<{ id: DestinationMode; label: string; hint: string }> = [
  { id: "static_number", label: "Static Number", hint: "Always route calls to a fixed phone number." },
  { id: "static_sip", label: "Static SIP", hint: "Always route calls to a fixed SIP address." },
  {
    id: "dynamic_number_from_response",
    label: "Dynamic Number from Response",
    hint: "Pull the destination phone number from the buyer's RTB/API response.",
  },
  {
    id: "dynamic_sip_from_response",
    label: "Dynamic SIP from Response",
    hint: "Pull the destination SIP address from the buyer's response.",
  },
];

const DestinationSection: React.FC<{
  mode: DestinationMode;
  destination: { number?: string; sipAddress?: string; dynamicNumberPath?: string; dynamicSipPath?: string };
  onModeChange: (mode: DestinationMode) => void;
  onDestinationChange: (key: "number" | "sipAddress" | "dynamicNumberPath" | "dynamicSipPath", value: string) => void;
}> = ({ mode, destination, onModeChange, onDestinationChange }) => (
  <section className="space-y-4">
    <SectionHeader title="Destination" description="Where calls land for this buyer." />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {DESTINATION_MODES.map(option => (
        <button
          key={option.id}
          type="button"
          data-testid={`destination-mode-${option.id}`}
          onClick={() => onModeChange(option.id)}
          className={`p-3 text-left border rounded-lg transition-all ${
            mode === option.id
              ? "border-purple-600 bg-purple-50"
              : "border-slate-200 hover:border-purple-300"
          }`}
        >
          <p className="text-sm font-bold text-slate-900">{option.label}</p>
          <p className="text-xs text-slate-500">{option.hint}</p>
        </button>
      ))}
    </div>
    {mode === "static_number" && (
      <TextField
        label="Static Number"
        testId="destination-static-number"
        value={destination.number || ""}
        onChange={value => onDestinationChange("number", value)}
        helper="Use E.164 format (e.g. +18005551212)."
      />
    )}
    {mode === "static_sip" && (
      <TextField
        label="Static SIP Address"
        testId="destination-static-sip"
        value={destination.sipAddress || ""}
        onChange={value => onDestinationChange("sipAddress", value)}
        helper="Example: sip:transfer@buyer.example.com"
      />
    )}
    {mode === "dynamic_number_from_response" && (
      <TextField
        label="Dynamic Number Path"
        testId="destination-dynamic-number-path"
        value={destination.dynamicNumberPath || ""}
        onChange={value => onDestinationChange("dynamicNumberPath", value)}
        helper="JSON path into the response, e.g. $.phone_number or lead.transfer_number."
      />
    )}
    {mode === "dynamic_sip_from_response" && (
      <TextField
        label="Dynamic SIP Path"
        testId="destination-dynamic-sip-path"
        value={destination.dynamicSipPath || ""}
        onChange={value => onDestinationChange("dynamicSipPath", value)}
        helper="JSON path into the response, e.g. $.sip_uri."
      />
    )}
  </section>
);

const RequestSection: React.FC<{
  request: RequestConfig;
  jsonErrors: Record<string, string>;
  applyJsonField: (key: "headers" | "queryParams" | "body", text: string) => void;
  onChange: (partial: Partial<RequestConfig>) => void;
}> = ({ request, jsonErrors, applyJsonField, onChange }) => {
  const [headersText, setHeadersText] = useState(() =>
    JSON.stringify(request.headers || {}, null, 2)
  );
  const [queryText, setQueryText] = useState(() =>
    JSON.stringify(request.queryParams || {}, null, 2)
  );
  const [bodyText, setBodyText] = useState(() =>
    typeof request.body === "string"
      ? request.body
      : JSON.stringify(request.body || {}, null, 2)
  );

  return (
    <section className="space-y-4">
      <SectionHeader title="Request" description="How we call the buyer endpoint." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectField
          label="Method"
          testId="request-method"
          value={request.method || "POST"}
          onChange={value => onChange({ method: value as RequestConfig["method"] })}
          options={[
            { value: "POST", label: "POST" },
            { value: "GET", label: "GET" },
          ]}
        />
        <div className="md:col-span-2">
          <TextField
            label="URL"
            testId="request-url"
            value={request.url || ""}
            onChange={value => onChange({ url: value })}
            tokenInsert={token => {
              onChange({ url: (request.url || "") + token });
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectField
          label="Authentication"
          testId="request-auth-mode"
          value={request.authenticationMode || "none"}
          onChange={value => onChange({ authenticationMode: value as AuthenticationMode })}
          options={[
            { value: "none", label: "None" },
            { value: "api_key", label: "API Key" },
            { value: "bearer_token", label: "Bearer Token" },
            { value: "basic", label: "Basic Auth" },
          ]}
        />
        <SelectField
          label="Content Type"
          testId="request-content-type"
          value={request.contentType || "application/json"}
          onChange={value => onChange({ contentType: value as RequestContentType })}
          options={[
            { value: "application/json", label: "application/json" },
            { value: "application/x-www-form-urlencoded", label: "application/x-www-form-urlencoded" },
            { value: "text/plain", label: "text/plain" },
          ]}
        />
        <NumberField
          label="Timeout (seconds)"
          testId="request-timeout"
          value={request.timeoutSeconds ?? 3}
          onChange={value => onChange({ timeoutSeconds: value })}
        />
      </div>
      <JsonEditor
        label="Headers"
        testId="request-headers"
        value={headersText}
        onChange={setHeadersText}
        onApply={() => applyJsonField("headers", headersText)}
        error={jsonErrors.headers}
      />
      <JsonEditor
        label="Query Params"
        testId="request-query"
        value={queryText}
        onChange={setQueryText}
        onApply={() => applyJsonField("queryParams", queryText)}
        error={jsonErrors.queryParams}
      />
      <JsonEditor
        label="Body"
        testId="request-body"
        value={bodyText}
        onChange={setBodyText}
        onApply={() => applyJsonField("body", bodyText)}
        error={jsonErrors.body}
      />
    </section>
  );
};

const ResponseParsingSection: React.FC<{
  config: IntegrationConfig;
  updateResponseParsing: (
    key: keyof NonNullable<IntegrationConfig["responseParsing"]>,
    value: string | boolean | number | undefined
  ) => void;
}> = ({ config, updateResponseParsing }) => {
  const parsing = config.responseParsing || {};
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Response Parsing"
        description="Tell the studio where to find values in the buyer's response."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          label="Accepted Path"
          testId="parsing-accepted-path"
          value={parsing.acceptedPath || ""}
          onChange={value => updateResponseParsing("acceptedPath", value)}
          helper="Path that indicates the bid was accepted (e.g. $.accepted)."
        />
        <TextField
          label="Accepted Value"
          testId="parsing-accepted-value"
          value={String(parsing.acceptedValue ?? "true")}
          onChange={value =>
            updateResponseParsing(
              "acceptedValue",
              value === "true" ? true : value === "false" ? false : value
            )
          }
          helper="Expected value at the accepted path."
        />
        <TextField
          label="Destination Number Path"
          testId="parsing-destination-number-path"
          value={parsing.destinationNumberPath || ""}
          onChange={value => updateResponseParsing("destinationNumberPath", value)}
        />
        <TextField
          label="SIP Address Path"
          testId="parsing-sip-path"
          value={parsing.sipAddressPath || ""}
          onChange={value => updateResponseParsing("sipAddressPath", value)}
        />
        <TextField
          label="Bid Path"
          testId="parsing-bid-path"
          value={parsing.bidPath || ""}
          onChange={value => updateResponseParsing("bidPath", value)}
        />
        <TextField
          label="Conversion Duration Path"
          testId="parsing-conversion-duration-path"
          value={parsing.conversionDurationPath || ""}
          onChange={value => updateResponseParsing("conversionDurationPath", value)}
        />
        <TextField
          label="Expiration Path"
          testId="parsing-expiration-path"
          value={parsing.expiresInSecondsPath || ""}
          onChange={value => updateResponseParsing("expiresInSecondsPath", value)}
        />
        <TextField
          label="Reject Reason Path"
          testId="parsing-reject-reason-path"
          value={parsing.rejectReasonPath || ""}
          onChange={value => updateResponseParsing("rejectReasonPath", value)}
        />
      </div>
      <div
        data-testid="parsing-pipelines-placeholder"
        className="p-3 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500"
      >
        Advanced parsing pipelines (chained transforms like normalize_phone, number_parse, text_contains) coming soon. Existing
        single-path parsing remains the source of truth.
      </div>
    </section>
  );
};

const OPERATOR_OPTIONS: Array<{ value: FilterOperator; label: string }> = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "in_list", label: "in list" },
  { value: "not_in_list", label: "not in list" },
  { value: "exists", label: "exists" },
  { value: "does_not_exist", label: "does not exist" },
];

const FiltersSection: React.FC<{
  filters: FilterRule[];
  updateFilters: (next: FilterRule[]) => void;
}> = ({ filters, updateFilters }) => {
  const addFilter = () => {
    updateFilters([
      ...filters,
      { id: createId("filt"), group: "and", field: "caller_id", operator: "equals", value: "" },
    ]);
  };
  const updateAt = (id: string, partial: Partial<FilterRule>) => {
    updateFilters(filters.map(rule => (rule.id === id ? { ...rule, ...partial } : rule)));
  };
  const removeAt = (id: string) => updateFilters(filters.filter(rule => rule.id !== id));

  const usesList = (op: FilterOperator) => op === "in_list" || op === "not_in_list";
  const usesValue = (op: FilterOperator) =>
    op !== "exists" && op !== "does_not_exist" && !usesList(op);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Filters"
        description="Pre-route gates. Calls only reach this buyer when the filters match."
      />
      <div className="space-y-3">
        {filters.length === 0 && (
          <p
            data-testid="filters-empty"
            className="text-xs text-slate-500 italic border border-dashed border-slate-200 rounded p-3"
          >
            No filters configured. Buyer always eligible.
          </p>
        )}
        {filters.map((rule, index) => (
          <div
            key={rule.id}
            data-testid={`filter-row-${index}`}
            className="grid grid-cols-12 gap-2 items-center"
          >
            <select
              data-testid={`filter-group-${index}`}
              className="col-span-2 p-2 border rounded text-xs bg-white"
              value={rule.group}
              onChange={event => updateAt(rule.id, { group: event.target.value as "and" | "or" })}
            >
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
            <select
              data-testid={`filter-field-${index}`}
              className="col-span-3 p-2 border rounded text-xs bg-white"
              value={rule.field}
              onChange={event => updateAt(rule.id, { field: event.target.value })}
            >
              {FILTER_FIELDS.map(field => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
            <select
              data-testid={`filter-operator-${index}`}
              className="col-span-3 p-2 border rounded text-xs bg-white"
              value={rule.operator}
              onChange={event =>
                updateAt(rule.id, { operator: event.target.value as FilterOperator })
              }
            >
              {OPERATOR_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {usesValue(rule.operator) && (
              <input
                data-testid={`filter-value-${index}`}
                className="col-span-3 p-2 border rounded text-xs font-mono"
                placeholder="value"
                value={rule.value || ""}
                onChange={event => updateAt(rule.id, { value: event.target.value })}
              />
            )}
            {usesList(rule.operator) && (
              <input
                data-testid={`filter-values-${index}`}
                className="col-span-3 p-2 border rounded text-xs font-mono"
                placeholder="comma,separated,values"
                value={(rule.values || []).join(",")}
                onChange={event =>
                  updateAt(rule.id, {
                    values: event.target.value
                      .split(",")
                      .map(item => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            )}
            {(rule.operator === "exists" || rule.operator === "does_not_exist") && (
              <div className="col-span-3 text-[10px] text-slate-400 italic">No value needed.</div>
            )}
            <button
              type="button"
              data-testid={`filter-remove-${index}`}
              onClick={() => removeAt(rule.id)}
              className="col-span-1 p-2 text-slate-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        data-testid="filter-add-button"
        onClick={addFilter}
        className="inline-flex items-center gap-1 px-3 py-2 border border-purple-200 text-purple-600 rounded text-xs font-bold hover:bg-purple-50"
      >
        <Plus size={14} /> Add filter
      </button>
    </section>
  );
};

const CapsScheduleSection: React.FC<{
  caps: IntegrationCaps;
  schedule?: IntegrationSchedule;
  capUsage: CapUsage;
  updateCaps: (key: keyof IntegrationCaps, value: number | string | undefined) => void;
  updateSchedule: (partial: Partial<IntegrationSchedule>) => void;
  updateCapUsage: (next: CapUsage) => void;
}> = ({ caps, schedule, capUsage, updateCaps, updateSchedule, updateCapUsage }) => {
  const days = schedule?.days || [];
  const toggleDay = (day: string) => {
    const next = days.includes(day) ? days.filter(item => item !== day) : [...days, day];
    updateSchedule({ days: next });
  };
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Caps & Schedule"
        description="Volume limits and the hours when this buyer accepts calls."
      />
      <div className="space-y-3">
        <SelectField
          label="Cap on"
          testId="caps-cap-on"
          value={caps.capOn || "connected_calls"}
          onChange={value => updateCaps("capOn", value)}
          options={[
            { value: "connected_calls", label: "Connected calls" },
            { value: "converted_calls", label: "Converted calls" },
          ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <NumberField
            label="Global"
            testId="caps-global"
            value={caps.global ?? 0}
            onChange={value => updateCaps("global", value || undefined)}
          />
          <NumberField
            label="Monthly"
            testId="caps-monthly"
            value={caps.monthly ?? 0}
            onChange={value => updateCaps("monthly", value || undefined)}
          />
          <NumberField
            label="Daily"
            testId="caps-daily"
            value={caps.daily ?? 0}
            onChange={value => updateCaps("daily", value || undefined)}
          />
          <NumberField
            label="Hourly"
            testId="caps-hourly"
            value={caps.hourly ?? 0}
            onChange={value => updateCaps("hourly", value || undefined)}
          />
          <NumberField
            label="Concurrency"
            testId="caps-concurrency"
            value={caps.concurrency ?? 0}
            onChange={value => updateCaps("concurrency", value || undefined)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumberField
            label="Daily Used"
            testId="cap-usage-daily"
            value={capUsage.dailyUsed ?? 0}
            onChange={value => updateCapUsage({ ...capUsage, dailyUsed: value || undefined })}
          />
          <NumberField
            label="Current Concurrency"
            testId="cap-usage-concurrency"
            value={capUsage.currentConcurrency ?? 0}
            onChange={value => updateCapUsage({ ...capUsage, currentConcurrency: value || undefined })}
          />
        </div>
        {(caps.daily !== undefined || caps.concurrency !== undefined) && (
          <div data-testid="cap-usage-preview" className="text-[11px] text-slate-500 italic">
            {caps.daily !== undefined && (
              <span>{capUsage.dailyUsed ?? 0} / {caps.daily} daily</span>
            )}
            {caps.daily !== undefined && caps.concurrency !== undefined && <span> · </span>}
            {caps.concurrency !== undefined && (
              <span>{capUsage.currentConcurrency ?? 0} / {caps.concurrency} concurrent</span>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField
            label="Schedule Mode"
            testId="schedule-mode"
            value={schedule?.mode || "basic"}
            onChange={value => updateSchedule({ mode: value as IntegrationSchedule["mode"] })}
            options={[
              { value: "always_open", label: "Always open" },
              { value: "basic", label: "Basic (days + hours)" },
              { value: "advanced", label: "Advanced (with breaks)" },
            ]}
          />
          <SelectField
            label="Timezone"
            testId="schedule-timezone"
            value={schedule?.timezone || "America/New_York"}
            onChange={value => updateSchedule({ timezone: value })}
            options={TIMEZONE_OPTIONS.map(tz => ({ value: tz, label: tz }))}
          />
        </div>
        {(schedule?.mode || "basic") === "basic" && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Days</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                  <button
                    type="button"
                    key={day}
                    data-testid={`schedule-day-${day}`}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 text-xs border rounded ${
                      days.includes(day)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "text-slate-600 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField
                label="Open Time"
                testId="schedule-start"
                value={schedule?.startTime || "09:00"}
                onChange={value => updateSchedule({ startTime: value })}
              />
              <TextField
                label="Close Time"
                testId="schedule-end"
                value={schedule?.endTime || "17:00"}
                onChange={value => updateSchedule({ endTime: value })}
              />
            </div>
          </div>
        )}
        {(schedule?.mode || "basic") === "advanced" && (
          <AdvancedScheduleEditor schedule={schedule} updateSchedule={updateSchedule} />
        )}
      </div>
    </section>
  );
};

const AdvancedScheduleEditor: React.FC<{
  schedule?: IntegrationSchedule;
  updateSchedule: (partial: Partial<IntegrationSchedule>) => void;
}> = ({ schedule, updateSchedule }) => {
  const dayRules = WEEKDAYS.map(day => {
    const existing = schedule?.dayRules?.find(rule => rule.day === day);
    return (
      existing || {
        day,
        enabled: false,
        startTime: schedule?.startTime || "09:00",
        endTime: schedule?.endTime || "17:00",
      }
    );
  });
  const updateRule = (day: string, partial: Partial<IntegrationScheduleDayRule>) => {
    const next = dayRules.map(rule => (rule.day === day ? { ...rule, ...partial } : rule));
    updateSchedule({ dayRules: next });
  };
  return (
    <div data-testid="schedule-advanced-editor" className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase">Per-day hours</p>
      <p className="text-[11px] text-slate-500 italic">
        Enable the days this buyer accepts calls and set per-day open/close times.
      </p>
      <div className="border rounded-lg divide-y divide-slate-100">
        {dayRules.map(rule => (
          <div
            key={rule.day}
            data-testid={`schedule-day-rule-${rule.day}`}
            className="flex flex-wrap items-center gap-3 p-2"
          >
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 w-20">
              <input
                data-testid={`schedule-day-rule-${rule.day}-enabled`}
                type="checkbox"
                checked={rule.enabled}
                onChange={event => updateRule(rule.day, { enabled: event.target.checked })}
              />
              {rule.day}
            </label>
            <input
              data-testid={`schedule-day-rule-${rule.day}-start`}
              className="p-1.5 border rounded text-xs font-mono"
              placeholder="09:00"
              value={rule.startTime || ""}
              disabled={!rule.enabled}
              onChange={event => updateRule(rule.day, { startTime: event.target.value })}
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              data-testid={`schedule-day-rule-${rule.day}-end`}
              className="p-1.5 border rounded text-xs font-mono"
              placeholder="17:00"
              value={rule.endTime || ""}
              disabled={!rule.enabled}
              onChange={event => updateRule(rule.day, { endTime: event.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const RevenueErrorsSection: React.FC<{
  revenue: RevenueSettings;
  errorSettings: ErrorSettings;
  updateRevenue: (next: RevenueSettings) => void;
  updateErrors: (next: ErrorSettings) => void;
}> = ({ revenue, errorSettings, updateRevenue, updateErrors }) => (
  <section className="space-y-6">
    <SectionHeader title="Revenue & Errors" description="What you earn and what we do when buyers fail." />
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Revenue mode</p>
      <Segmented
        testId="revenue-mode"
        value={revenue.mode}
        onChange={value => updateRevenue({ ...revenue, mode: value as RevenueSettings["mode"] })}
        options={[
          { value: "campaign_default", label: "Campaign default" },
          { value: "buyer_default", label: "Buyer default" },
          { value: "override", label: "Override" },
        ]}
      />
      {revenue.mode === "override" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumberField
            label="Payout"
            testId="revenue-payout"
            value={revenue.payout ?? 0}
            onChange={value => updateRevenue({ ...revenue, payout: value || undefined })}
          />
          <NumberField
            label="Minimum Revenue"
            testId="revenue-minimum"
            value={revenue.minimumRevenue ?? 0}
            onChange={value => updateRevenue({ ...revenue, minimumRevenue: value || undefined })}
          />
          <NumberField
            label="Conversion Duration (seconds)"
            testId="revenue-conversion"
            value={revenue.conversionDurationSeconds ?? 0}
            onChange={value =>
              updateRevenue({ ...revenue, conversionDurationSeconds: value || undefined })
            }
          />
          <TextField
            label="Dynamic Bid Path"
            testId="revenue-dynamic-bid"
            value={revenue.dynamicBidPath || ""}
            onChange={value => updateRevenue({ ...revenue, dynamicBidPath: value || undefined })}
          />
          <TextField
            label="Dynamic Duration Path"
            testId="revenue-dynamic-duration"
            value={revenue.dynamicDurationPath || ""}
            onChange={value =>
              updateRevenue({ ...revenue, dynamicDurationPath: value || undefined })
            }
          />
        </div>
      )}
    </div>
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Error mode</p>
      <Segmented
        testId="error-mode"
        value={errorSettings.mode}
        onChange={value => updateErrors({ ...errorSettings, mode: value as ErrorSettings["mode"] })}
        options={[
          { value: "ring_tree_default", label: "Use default" },
          { value: "custom", label: "Override" },
        ]}
      />
      {errorSettings.mode === "custom" && (
        <SelectField
          label="Fallback Behavior"
          testId="error-fallback"
          value={errorSettings.fallbackBehavior || "continue_to_next_buyer"}
          onChange={value =>
            updateErrors({
              ...errorSettings,
              fallbackBehavior: value as ErrorSettings["fallbackBehavior"],
            })
          }
          options={[
            { value: "continue_to_next_buyer", label: "Continue to next buyer" },
            { value: "stop_routing", label: "Stop routing" },
            { value: "mark_failed", label: "Mark failed" },
          ]}
        />
      )}
    </div>
  </section>
);

const AdvancedCallBehaviorSection: React.FC<{
  duplicateRules: DuplicateRules;
  recording: RecordingSettings;
  dialIvr: DialIvrSettings;
  updateDuplicateRules: (next: DuplicateRules) => void;
  updateRecording: (next: RecordingSettings) => void;
  updateDialIvr: (next: DialIvrSettings) => void;
}> = ({ duplicateRules, recording, dialIvr, updateDuplicateRules, updateRecording, updateDialIvr }) => (
  <section className="space-y-6">
    <SectionHeader
      title="Advanced Call Behavior"
      description="Duplicate handling, recording, and IVR digits sent on dial."
    />
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Duplicate calls</p>
      <Segmented
        testId="duplicate-mode"
        value={duplicateRules.mode}
        onChange={value =>
          updateDuplicateRules({ ...duplicateRules, mode: value as DuplicateRules["mode"] })
        }
        options={[
          { value: "campaign_default", label: "Campaign default" },
          { value: "buyer_default", label: "Buyer default" },
          { value: "do_not_restrict", label: "Do not restrict" },
          { value: "restrict", label: "Restrict" },
        ]}
      />
      {duplicateRules.mode === "restrict" && (
        <NumberField
          label="Window (minutes)"
          testId="duplicate-window"
          value={duplicateRules.windowMinutes ?? 0}
          onChange={value =>
            updateDuplicateRules({ ...duplicateRules, windowMinutes: value || undefined })
          }
        />
      )}
    </div>
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Recording</p>
      <Segmented
        testId="recording-mode"
        value={recording.mode}
        onChange={value =>
          updateRecording({ mode: value as RecordingSettings["mode"] })
        }
        options={[
          { value: "account_default", label: "Account default" },
          { value: "enabled", label: "Enabled" },
          { value: "disabled", label: "Disabled" },
        ]}
      />
    </div>
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Dial IVR</p>
      <label className="flex items-center gap-2 text-sm">
        <input
          data-testid="dial-ivr-enabled"
          type="checkbox"
          checked={dialIvr.enabled}
          onChange={event => updateDialIvr({ ...dialIvr, enabled: event.target.checked })}
        />
        Press digits on dial
      </label>
      {dialIvr.enabled && (
        <TextField
          label="Dial digits"
          testId="dial-ivr-digits"
          value={dialIvr.digits || ""}
          onChange={value => updateDialIvr({ ...dialIvr, digits: value })}
          helper="Use only digits 0-9, * and #, or pauses encoded as commas. You can also reference tokens like {{call_id}}."
          tokenInsert={token =>
            updateDialIvr({ ...dialIvr, digits: (dialIvr.digits || "") + token })
          }
        />
      )}
      <p className="text-[11px] text-slate-500 italic">
        Dial IVR digits should only use numeric values, pauses, and supported tokens.
      </p>
    </div>
  </section>
);

// ===================== Direct target sections =====================

const DirectDestinationSection: React.FC<{
  kind: BuyerDestinationKind;
  destination: { number?: string; sipAddress?: string; sipHeaders?: Record<string, string> };
  onDestinationChange: (
    key: "number" | "sipAddress" | "dynamicNumberPath" | "dynamicSipPath",
    value: string
  ) => void;
}> = ({ kind, destination, onDestinationChange }) => {
  const numberValue = destination.number || "";
  const sipValue = destination.sipAddress || "";
  const numberStatus = !numberValue
    ? { tone: "empty", text: "Destination number is required." }
    : validatePhoneNumber(numberValue).valid
    ? { tone: "valid", text: "Looks valid." }
    : { tone: "invalid", text: validatePhoneNumber(numberValue).message || "Invalid number." };
  const sipStatus = !sipValue
    ? { tone: "empty", text: "SIP address is required." }
    : validateSipAddress(sipValue).valid
    ? { tone: "valid", text: "Looks valid." }
    : { tone: "invalid", text: validateSipAddress(sipValue).message || "Invalid SIP." };

  return (
    <section className="space-y-4">
      <SectionHeader title="Destination" description="Direct destination for this buyer's calls." />
      {kind === "direct_number" ? (
        <div className="space-y-2">
          <TextField
            label="Destination Number"
            testId="direct-target-number"
            value={numberValue}
            onChange={value => onDestinationChange("number", value)}
            helper="Use country code format, such as +12223334444."
          />
          <p
            data-testid="direct-target-number-status"
            data-status={numberStatus.tone}
            className={`text-[11px] italic ${
              numberStatus.tone === "valid"
                ? "text-green-600"
                : numberStatus.tone === "invalid"
                ? "text-red-600"
                : "text-slate-500"
            }`}
          >
            {numberStatus.text}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <TextField
            label="SIP Address"
            testId="direct-target-sip-address"
            value={sipValue}
            onChange={value => onDestinationChange("sipAddress", value)}
            helper="Use a SIP URI such as sip:buyer@example.com."
          />
          <p
            data-testid="direct-target-sip-status"
            data-status={sipStatus.tone}
            className={`text-[11px] italic ${
              sipStatus.tone === "valid"
                ? "text-green-600"
                : sipStatus.tone === "invalid"
                ? "text-red-600"
                : "text-slate-500"
            }`}
          >
            {sipStatus.text}
          </p>
        </div>
      )}
    </section>
  );
};

const CallHandlingSection: React.FC<{
  callHandling: CallHandlingConfig;
  dialIvr: DialIvrSettings;
  recording: RecordingSettings;
  updateCallHandling: (next: CallHandlingConfig) => void;
  updateDialIvr: (next: DialIvrSettings) => void;
  updateRecording: (next: RecordingSettings) => void;
}> = ({ callHandling, dialIvr, recording, updateCallHandling, updateDialIvr, updateRecording }) => (
  <section className="space-y-6">
    <SectionHeader
      title="Call Handling"
      description="Connection timeout, dial IVR, and recording behavior."
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <NumberField
        label="Connection Timeout (seconds)"
        testId="call-handling-connection-timeout"
        value={callHandling.connectionTimeoutSeconds ?? 30}
        onChange={value =>
          updateCallHandling({ ...callHandling, connectionTimeoutSeconds: value || undefined })
        }
      />
      <SelectField
        label="Recording"
        testId="call-handling-recording"
        value={recording.mode}
        onChange={value => updateRecording({ mode: value as RecordingSettings["mode"] })}
        options={[
          { value: "account_default", label: "Account default" },
          { value: "enabled", label: "Enabled" },
          { value: "disabled", label: "Disabled" },
        ]}
      />
    </div>
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Dial IVR</p>
      <label className="flex items-center gap-2 text-sm">
        <input
          data-testid="dial-ivr-enabled"
          type="checkbox"
          checked={dialIvr.enabled}
          onChange={event => updateDialIvr({ ...dialIvr, enabled: event.target.checked })}
        />
        Press digits on dial
      </label>
      {dialIvr.enabled && (
        <TextField
          label="Dial Digits"
          testId="dial-ivr-digits"
          value={dialIvr.digits || ""}
          onChange={value => updateDialIvr({ ...dialIvr, digits: value })}
          helper="Examples: www, www123, 123, www123{{zip}}. 'w' = pause. Digits and # supported. Tokens should resolve to numeric values."
          tokenInsert={token => updateDialIvr({ ...dialIvr, digits: (dialIvr.digits || "") + token })}
        />
      )}
    </div>
  </section>
);

const DuplicateRulesSection: React.FC<{
  duplicateRules: DuplicateRules;
  updateDuplicateRules: (next: DuplicateRules) => void;
}> = ({ duplicateRules, updateDuplicateRules }) => (
  <section className="space-y-4">
    <SectionHeader
      title="Duplicate Rules"
      description="Restrict the same caller from reaching this buyer twice in a window."
    />
    <Segmented
      testId="duplicate-mode"
      value={duplicateRules.mode}
      onChange={value =>
        updateDuplicateRules({ ...duplicateRules, mode: value as DuplicateRules["mode"] })
      }
      options={[
        { value: "campaign_default", label: "Campaign default" },
        { value: "buyer_default", label: "Buyer default" },
        { value: "do_not_restrict", label: "Do not restrict" },
        { value: "restrict", label: "Restrict" },
      ]}
    />
    {duplicateRules.mode === "restrict" && (
      <NumberField
        label="Window (minutes)"
        testId="duplicate-window"
        value={duplicateRules.windowMinutes ?? 0}
        onChange={value =>
          updateDuplicateRules({ ...duplicateRules, windowMinutes: value || undefined })
        }
      />
    )}
  </section>
);

const RevenueRecoverySection: React.FC<{
  callHandling: CallHandlingConfig;
  revenue: RevenueSettings;
  updateCallHandling: (next: CallHandlingConfig) => void;
  updateRevenue: (next: RevenueSettings) => void;
}> = ({ callHandling, revenue, updateCallHandling, updateRevenue }) => (
  <section className="space-y-6">
    <SectionHeader title="Revenue Recovery" description="Payout, conversion duration, and retry behavior." />
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase">Revenue Recovery</p>
      <Segmented
        testId="revenue-recovery-mode"
        value={callHandling.revenueRecovery ?? "buyer_default"}
        onChange={value =>
          updateCallHandling({
            ...callHandling,
            revenueRecovery: value as CallHandlingConfig["revenueRecovery"],
          })
        }
        options={[
          { value: "buyer_default", label: "Buyer default" },
          { value: "enabled", label: "Enabled" },
          { value: "disabled", label: "Disabled" },
        ]}
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <NumberField
        label="Payout"
        testId="direct-target-payout"
        value={revenue.payout ?? 0}
        onChange={value =>
          updateRevenue({ ...revenue, mode: "override", payout: value || undefined })
        }
      />
      <NumberField
        label="Conversion Duration (seconds)"
        testId="direct-target-conversion-duration"
        value={revenue.conversionDurationSeconds ?? 0}
        onChange={value =>
          updateRevenue({
            ...revenue,
            mode: "override",
            conversionDurationSeconds: value || undefined,
          })
        }
      />
    </div>
  </section>
);

const SHAREABLE_TAG_FIELDS = [
  "caller_id",
  "zip",
  "state",
  "publisher_id",
  "campaign_id",
  "recording_url",
  "trusted_form",
  "jornaya",
] as const;

const ShareableTagsSection: React.FC<{
  shareableTags: ShareableTagsConfig;
  updateShareableTags: (next: ShareableTagsConfig) => void;
}> = ({ shareableTags, updateShareableTags }) => {
  const selectedTags = new Set(shareableTags.tags || []);
  const [customTagInput, setCustomTagInput] = useState("");
  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    updateShareableTags({ ...shareableTags, tags: Array.from(next) });
  };
  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedTags.has(trimmed)) {
      const next = Array.from(selectedTags);
      next.push(trimmed);
      updateShareableTags({ ...shareableTags, tags: next });
    }
    setCustomTagInput("");
  };
  const customTags = (shareableTags.tags || []).filter(
    tag => !SHAREABLE_TAG_FIELDS.includes(tag as (typeof SHAREABLE_TAG_FIELDS)[number])
  );
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Shareable Tags"
        description="Which call attributes get passed to the buyer."
      />
      <Segmented
        testId="shareable-tags-mode"
        value={shareableTags.mode}
        onChange={value =>
          updateShareableTags({ ...shareableTags, mode: value as ShareableTagsConfig["mode"] })
        }
        options={[
          { value: "campaign_default", label: "Campaign default" },
          { value: "buyer_default", label: "Buyer default" },
          { value: "override", label: "Override" },
        ]}
      />
      {shareableTags.mode === "override" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              data-testid="shareable-tags-share-call-id"
              type="checkbox"
              checked={Boolean(shareableTags.shareInboundCallId)}
              onChange={event =>
                updateShareableTags({ ...shareableTags, shareInboundCallId: event.target.checked })
              }
            />
            Share inbound call ID
          </label>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tags</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SHAREABLE_TAG_FIELDS.map(tag => (
                <label
                  key={tag}
                  className="flex items-center gap-2 text-xs text-slate-700 p-2 border rounded-lg"
                >
                  <input
                    data-testid={`shareable-tag-${tag.split("_").join("-")}`}
                    type="checkbox"
                    checked={selectedTags.has(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Custom Tags</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {customTags.length === 0 && (
                <p data-testid="shareable-custom-tags-empty" className="text-[11px] text-slate-400 italic">
                  No custom tags yet.
                </p>
              )}
              {customTags.map(tag => (
                <span
                  key={tag}
                  data-testid={`shareable-custom-tag-${tag}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-100 rounded text-xs text-purple-700 font-mono"
                >
                  {tag}
                  <button
                    type="button"
                    data-testid={`shareable-custom-tag-remove-${tag}`}
                    onClick={() => toggleTag(tag)}
                    className="text-purple-400 hover:text-purple-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                data-testid="shareable-custom-tag-input"
                className="flex-1 p-2 border rounded text-xs font-mono"
                placeholder="e.g. lead_score"
                value={customTagInput}
                onChange={event => setCustomTagInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <button
                type="button"
                data-testid="shareable-custom-tag-add"
                onClick={addCustomTag}
                className="px-3 py-2 bg-purple-600 text-white rounded text-xs font-bold disabled:bg-slate-200"
                disabled={!customTagInput.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const PredictiveRoutingSection: React.FC<{
  predictiveRouting: PredictiveRoutingConfig;
  updatePredictiveRouting: (next: PredictiveRoutingConfig) => void;
}> = ({ predictiveRouting, updatePredictiveRouting }) => {
  const bump = predictiveRouting.priorityBump ?? 0;
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Predictive Routing"
        description="Influence which buyer wins when multiple are eligible."
      />
      <Segmented
        testId="predictive-routing-mode"
        value={predictiveRouting.mode}
        onChange={value =>
          updatePredictiveRouting({
            ...predictiveRouting,
            mode: value as PredictiveRoutingConfig["mode"],
          })
        }
        options={[
          { value: "campaign_default", label: "Campaign default" },
          { value: "estimated_revenue", label: "Estimated revenue" },
        ]}
      />
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase">
          Priority Bump
          <input
            type="range"
            data-testid="predictive-routing-priority-bump"
            min={-10}
            max={10}
            value={bump}
            onChange={event =>
              updatePredictiveRouting({
                ...predictiveRouting,
                priorityBump: Number(event.target.value),
              })
            }
            className="mt-2 w-full"
          />
          <span data-testid="predictive-routing-priority-bump-value" className="text-sm normal-case font-normal text-slate-600">
            {bump}
          </span>
        </label>
      </div>
    </section>
  );
};

// ===================== Field primitives =====================

const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div>
    <h4 className="text-sm font-bold text-slate-900">{title}</h4>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
  helper?: string;
  tokenInsert?: (token: string) => void;
}> = ({ label, value, onChange, testId, helper, tokenInsert }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    <span className="flex items-center justify-between">
      <span>{label}</span>
      {tokenInsert && (
        <TokenPicker
          compact
          onInsert={tokenInsert}
          testId={testId ? `${testId}-token-picker` : undefined}
        />
      )}
    </span>
    <input
      data-testid={testId}
      className="mt-1 w-full p-2 border rounded-lg text-sm font-mono normal-case"
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    {helper && <p className="mt-1 text-[10px] text-slate-400 normal-case font-normal">{helper}</p>}
  </label>
);

const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  testId?: string;
}> = ({ label, value, onChange, testId }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    {label}
    <input
      type="number"
      data-testid={testId}
      className="mt-1 w-full p-2 border rounded-lg text-sm normal-case"
      value={value || ""}
      onChange={event => onChange(Number(event.target.value))}
    />
  </label>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  testId?: string;
}> = ({ label, value, onChange, options, testId }) => (
  <label className="block text-xs font-bold text-slate-500 uppercase">
    {label}
    <select
      data-testid={testId}
      className="mt-1 w-full p-2 border rounded-lg text-sm bg-white normal-case"
      value={value}
      onChange={event => onChange(event.target.value)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const Segmented: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  testId?: string;
}> = ({ value, onChange, options, testId }) => (
  <div data-testid={testId} className="inline-flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
    {options.map(option => (
      <button
        type="button"
        key={option.value}
        data-testid={testId ? `${testId}-${option.value}` : undefined}
        onClick={() => onChange(option.value)}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
          value === option.value
            ? "bg-white text-purple-600 shadow"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const JsonEditor: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  testId?: string;
  error?: string;
}> = ({ label, value, onChange, onApply, testId, error }) => (
  <div data-testid={testId}>
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <TokenPicker
          compact
          onInsert={token => onChange((value ? value + " " : "") + token)}
          testId={testId ? `${testId}-token-picker` : undefined}
        />
        <button
          type="button"
          data-testid={testId ? `${testId}-apply` : undefined}
          onClick={onApply}
          className="text-xs text-purple-600 font-bold"
        >
          Apply
        </button>
      </div>
    </div>
    <textarea
      data-testid={testId ? `${testId}-textarea` : undefined}
      className="w-full h-28 p-3 bg-slate-900 text-blue-300 rounded-lg text-xs font-mono"
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    {error && (
      <p data-testid={testId ? `${testId}-error` : undefined} className="mt-1 text-xs text-red-600">
        {error}
      </p>
    )}
  </div>
);

export default BuyerConfigForm;
