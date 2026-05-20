import React, { useState } from "react";
import { AlertTriangle, Bot, CheckCircle, FileCode, Sparkles, Wand2 } from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import type { IntegrationConfig, IntegrationDirection, IntegrationSchedule, IntegrationType } from "../../models/appTypes";
import { useAppContext } from "../../store/AppStore";
import { useAppActions } from "../../store/useAppActions";
import { useToast } from "../shared/ToastProvider";

interface AIAssistantProps {
  onComplete?: (id: string) => void;
}

interface AIConfigProposal {
  direction: IntegrationDirection;
  type: IntegrationType;
  platformPreset: string;
  config: IntegrationConfig;
  confidence: number;
  warnings: string[];
}

const fieldSynonyms = {
  caller_id: ["caller_id", "cid", "phone", "caller"],
  zip: ["zip", "zipcode", "postal"],
  state: ["state"],
  publisher_id: ["publisher_id", "publisher id", "pub id"],
  trusted_form: ["trusted_form", "trustedform"],
  jornaya: ["jornaya"],
};

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

function buildProposal(instructions: string): AIConfigProposal {
  const lower = instructions.toLowerCase();

  // Extract URL using string methods instead of regex
  const url = extractUrl(instructions);

  // Direct target detection — SIP first because "sip:" implies direct SIP.
  const sipAddress = extractSipAddress(instructions);
  const phoneNumber = extractPhoneNumber(instructions);
  const wantsDirectSip = Boolean(sipAddress) || lower.includes("route to sip") || lower.includes("direct sip");
  const wantsDirectNumber =
    !wantsDirectSip &&
    Boolean(phoneNumber) &&
    (lower.includes("send calls to") ||
      lower.includes("route calls to") ||
      lower.includes("direct number") ||
      (Boolean(phoneNumber) && !url));

  const direction: IntegrationDirection = lower.includes("publisher") || lower.includes("supplier") || lower.includes("post traffic") ? "publisher" : "buyer";
  const type: IntegrationType = wantsDirectSip || lower.includes("sip")
    ? "sip"
    : wantsDirectNumber || lower.includes("static") || lower.includes("direct number")
    ? "static_number"
    : lower.includes("webhook")
    ? "webhook"
    : "rtb";
  const method = lower.includes("get") && !lower.includes("post") ? "GET" : "POST";
  const requiredFields = Object.entries(fieldSynonyms).filter(([, aliases]) => aliases.some(alias => lower.includes(alias))).map(([field]) => field);
  const acceptedField = firstMatch(lower, ["accepted", "success", "status", "code"]) || "accepted";
  const destinationField = firstMatch(lower, ["phone_number", "transfer_number", "destination", "number", "sip"]) || "phone_number";
  const bidField = firstMatch(lower, ["bid", "payout", "price"]) || "payout";
  const rejectField = firstMatch(lower, ["rejection_reason", "reason", "message"]) || "reason";
  const expirationField = firstMatch(lower, ["expires_in_seconds", "expireinseconds", "expiration"]);

  // Extract publisher ID using string methods instead of regex
  const publisherId = extractPublisherId(instructions);

  // Extract expiration seconds using string methods instead of regex
  const expirationSeconds = extractExpirationSeconds(instructions);

  const warnings: string[] = [];

  if (!url && direction === "buyer" && type !== "static_number" && type !== "sip") warnings.push("No endpoint URL detected; using a placeholder URL.");
  if (direction === "publisher" && !publisherId) warnings.push("No publisher ID detected; using a publisher_id token placeholder.");
  if (!requiredFields.includes("caller_id")) warnings.push("Caller ID was not detected; adding caller_id because PPCall flows generally require it.");
  if (!requiredFields.includes("zip") && direction === "buyer" && type === "rtb") warnings.push("ZIP was not detected; RTB examples often require zip.");

  const fields = Array.from(new Set(requiredFields.length ? requiredFields : ["caller_id", "zip"]));
  const tokenBody = Object.fromEntries(fields.map(field => [field, `{{${field}}}`]));
  const expiresInSeconds = Number.isFinite(expirationSeconds) && expirationSeconds > 0 ? expirationSeconds : 30;

  if (direction === "publisher") {
    return {
      direction,
      type,
      platformPreset: "ai_detected_publisher",
      confidence: 82,
      warnings,
      config: {
        publisherId: publisherId || "{{publisher_id}}",
        postingUrl: url || "https://mock-ppcall.local/rtb/{{campaign_id}}/{{publisher_id}}",
        requiredFields: fields,
        expiresInSeconds: expirationField || type === "rtb" ? expiresInSeconds : undefined,
        acceptedResponse: { accepted: true, phone_number: "+18005551212", payout: 35, expires_in_seconds: expiresInSeconds },
        rejectedResponse: { accepted: false, reason: "no_buyer_available" }
      }
    };
  }

  if (direction === "buyer" && wantsDirectNumber) {
    const payout = extractCurrencyAmount(instructions) ?? 35;
    const conversionDuration = extractAfterSeconds(instructions) ?? 120;
    const dailyCap = extractDailyCap(instructions);
    const concurrency = extractMaxConcurrency(instructions);
    const schedule = extractScheduleHints(instructions);
    const config: IntegrationConfig = {
      buyerDestinationKind: "direct_number",
      destinationMode: "static_number",
      destination: { number: phoneNumber || "+18005551212" },
      destinationNumber: phoneNumber || "+18005551212",
      payout,
      conversionDurationSeconds: conversionDuration,
      callHandling: { connectionTimeoutSeconds: 30, revenueRecovery: "buyer_default" },
      schedule: schedule || {
        timezone: "America/New_York",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        startTime: "00:00",
        endTime: "23:59",
        mode: "always_open",
      },
      caps: {
        capOn: "converted_calls",
        daily: dailyCap,
        concurrency,
      },
    };
    return {
      direction: "buyer",
      type: "static_number",
      platformPreset: "ai_detected_direct_number",
      confidence: 86,
      warnings,
      config,
    };
  }

  if (direction === "buyer" && wantsDirectSip) {
    const payout = extractCurrencyAmount(instructions) ?? 35;
    const conversionDuration = extractAfterSeconds(instructions) ?? 120;
    const dailyCap = extractDailyCap(instructions);
    const concurrency = extractMaxConcurrency(instructions);
    const schedule = extractScheduleHints(instructions);
    const config: IntegrationConfig = {
      buyerDestinationKind: "direct_sip",
      destinationMode: "static_sip",
      destination: { sipAddress: sipAddress || "sip:buyer@example.com" },
      sipAddress: sipAddress || "sip:buyer@example.com",
      payout,
      conversionDurationSeconds: conversionDuration,
      callHandling: { connectionTimeoutSeconds: 30, revenueRecovery: "buyer_default" },
      schedule: schedule || {
        timezone: "America/New_York",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        startTime: "00:00",
        endTime: "23:59",
        mode: "always_open",
      },
      caps: {
        capOn: "converted_calls",
        daily: dailyCap,
        concurrency,
      },
    };
    return {
      direction: "buyer",
      type: "sip",
      platformPreset: "ai_detected_direct_sip",
      confidence: 86,
      warnings,
      config,
    };
  }

  if (type === "static_number") {
    return {
      direction,
      type,
      platformPreset: "ai_detected_static",
      confidence: 76,
      warnings,
      config: { destinationNumber: "+18005551212", payout: 25, conversionDurationSeconds: 60, requiredFields: fields }
    };
  }

  if (type === "sip") {
    return {
      direction,
      type,
      platformPreset: "ai_detected_sip",
      confidence: 76,
      warnings,
      config: { sipAddress: "sip:transfer@example.com", payout: 25, conversionDurationSeconds: 60, requiredFields: fields }
    };
  }

  return {
    direction,
    type,
    platformPreset: "ai_detected_api",
    confidence: warnings.length ? 78 : 88,
    warnings,
    config: {
      method,
      url: url || "https://buyer.example.com/ping",
      headers: { "Content-Type": "application/json" },
      requestBody: tokenBody,
      queryParams: method === "GET" ? tokenBody as Record<string, string> : {},
      responseParsing: {
        acceptedPath: `$.${acceptedField}`,
        acceptedValue: acceptedField === "status" ? "ok" : true,
        destinationNumberPath: destinationField === "sip" ? undefined : `$.${destinationField}`,
        sipAddressPath: destinationField === "sip" ? "$.sip" : undefined,
        bidPath: `$.${bidField}`,
        expiresInSecondsPath: expirationField ? `$.${expirationField}` : undefined,
        rejectReasonPath: `$.${rejectField}`
      },
      timeoutSeconds: 3,
      requiredFields: fields
    }
  };
}

function firstMatch(value: string, fields: string[]): string | undefined {
  return fields.find(field => value.includes(field.toLowerCase()));
}

// Helper: Extract URL from instructions using string methods instead of regex
function extractUrl(text: string): string | undefined {
  // Look for http:// or https://
  const httpIndex = text.indexOf('http://');
  const httpsIndex = text.indexOf('https://');

  let startIndex = -1;
  if (httpIndex !== -1 && httpsIndex !== -1) {
    startIndex = Math.min(httpIndex, httpsIndex);
  } else if (httpIndex !== -1) {
    startIndex = httpIndex;
  } else if (httpsIndex !== -1) {
    startIndex = httpsIndex;
  }

  if (startIndex === -1) return undefined;

  // Find the end of the URL (space, quote, parenthesis, or end of string)
  let endIndex = text.length;
  const terminators = [' ', '"', "'", ')', '\n', '\t'];

  for (const term of terminators) {
    const termIndex = text.indexOf(term, startIndex);
    if (termIndex !== -1 && termIndex < endIndex) {
      endIndex = termIndex;
    }
  }

  return text.substring(startIndex, endIndex);
}

// Helper: Extract publisher ID pattern like pub_123 or pub-abc using string methods instead of regex
function extractPublisherId(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Look for patterns like "pub_" or "pub-"
  let pos = 0;
  while (pos < lower.length) {
    const pubIndex = lower.indexOf('pub', pos);
    if (pubIndex === -1) break;

    // Check if it's followed by _ or -
    if (pubIndex + 3 < lower.length) {
      const nextChar = lower[pubIndex + 3];
      if (nextChar === '_' || nextChar === '-') {
        // Extract the full ID
        let endIndex = pubIndex + 4;
        while (endIndex < lower.length) {
          const char = lower[endIndex];
          const isValid = (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char === '_' || char === '-';
          if (!isValid) break;
          endIndex++;
        }

        if (endIndex > pubIndex + 4) {
          // Return the original case version
          return text.substring(pubIndex, endIndex);
        }
      }
    }

    pos = pubIndex + 1;
  }

  return undefined;
}

// Helper: Extract expiration seconds from text like "expires in 30 seconds" using string methods instead of regex
function extractExpirationSeconds(text: string): number {
  const lower = text.toLowerCase();

  // Look for expiration-related keywords
  const keywords = ['expires_in_seconds', 'expirationinseconds', 'expiration', 'expires', 'expire'];

  for (const keyword of keywords) {
    const keywordIndex = lower.indexOf(keyword);
    if (keywordIndex === -1) continue;

    // Look for a number within 30 characters after the keyword
    const searchStart = keywordIndex + keyword.length;
    const searchEnd = Math.min(searchStart + 30, lower.length);
    const searchRegion = text.substring(searchStart, searchEnd);

    // Extract digits
    let numberStr = '';
    for (const char of searchRegion) {
      if (char >= '0' && char <= '9') {
        numberStr += char;
      } else if (numberStr.length > 0) {
        // Stop at first non-digit after we've found digits
        break;
      }
    }

    if (numberStr.length >= 2 && numberStr.length <= 5) {
      const num = parseInt(numberStr, 10);
      if (num > 0) return num;
    }
  }

  return 0;
}

function extractPhoneNumber(text: string): string | undefined {
  // Look for E.164-style "+1..." or "+44..." patterns using string scan.
  const plusIndex = text.indexOf("+");
  if (plusIndex === -1) return undefined;
  // Confirm at least one digit follows.
  let cursor = plusIndex + 1;
  if (cursor >= text.length) return undefined;
  if (!isDigitChar(text[cursor])) return undefined;
  let result = "+";
  while (cursor < text.length) {
    const ch = text[cursor];
    if (isDigitChar(ch)) {
      result += ch;
    } else if (ch === " " || ch === "-" || ch === "(" || ch === ")" || ch === "." || ch === " ") {
      // Allow separators between digits but don't include them.
    } else {
      break;
    }
    cursor++;
  }
  // Need 8-15 digits.
  const digits = result.length - 1;
  if (digits < 8 || digits > 15) return undefined;
  return result;
}

function extractSipAddress(text: string): string | undefined {
  const lower = text.toLowerCase();
  const idx = lower.indexOf("sip:");
  const idxs = lower.indexOf("sips:");
  let start = -1;
  let scheme = "";
  if (idx !== -1 && (idxs === -1 || idx < idxs)) {
    start = idx;
    scheme = "sip:";
  } else if (idxs !== -1) {
    start = idxs;
    scheme = "sips:";
  }
  if (start === -1) return undefined;
  let cursor = start + scheme.length;
  let result = text.substring(start, start + scheme.length);
  while (cursor < text.length) {
    const ch = text[cursor];
    if (ch === " " || ch === "," || ch === ";" || ch === "\n" || ch === "\t" || ch === '"' || ch === "'" || ch === ")") {
      break;
    }
    result += ch;
    cursor++;
  }
  if (result === scheme) return undefined;
  return result;
}

function extractCurrencyAmount(text: string): number | undefined {
  // Look for "$NN" or "NN dollars" or "pays NN".
  const dollarIdx = text.indexOf("$");
  if (dollarIdx !== -1) {
    let cursor = dollarIdx + 1;
    let numStr = "";
    while (cursor < text.length) {
      const ch = text[cursor];
      if (isDigitChar(ch) || ch === ".") {
        numStr += ch;
      } else {
        break;
      }
      cursor++;
    }
    if (numStr.length > 0) {
      const num = Number(numStr);
      if (Number.isFinite(num) && num > 0) return num;
    }
  }
  return extractKeywordNumber(text, ["pays ", "payout of ", "payout is ", "payout "]);
}

function extractAfterSeconds(text: string): number | undefined {
  // Look for "after NN seconds" patterns.
  return (
    extractKeywordNumber(text, ["after "]) ??
    extractKeywordNumber(text, ["conversion duration ", "conversion duration of "])
  );
}

function extractDailyCap(text: string): number | undefined {
  return extractKeywordNumber(text, ["daily cap ", "daily cap is ", "daily cap of "]);
}

function extractMaxConcurrency(text: string): number | undefined {
  return extractKeywordNumber(text, ["max concurrency ", "max concurrency of ", "concurrency "]);
}

function extractKeywordNumber(text: string, keywords: string[]): number | undefined {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx === -1) continue;
    let cursor = idx + keyword.length;
    // Skip optional leading whitespace.
    while (cursor < text.length && text[cursor] === " ") cursor++;
    let numStr = "";
    while (cursor < text.length) {
      const ch = text[cursor];
      if (isDigitChar(ch) || ch === ".") numStr += ch;
      else if (numStr.length > 0) break;
      else break;
      cursor++;
    }
    if (numStr.length > 0) {
      const num = Number(numStr);
      if (Number.isFinite(num) && num > 0) return num;
    }
  }
  return undefined;
}

function extractScheduleHints(text: string): IntegrationSchedule | undefined {
  const lower = text.toLowerCase();
  // Default timezone.
  let timezone = "America/New_York";
  if (lower.includes("eastern")) timezone = "America/New_York";
  else if (lower.includes("central")) timezone = "America/Chicago";
  else if (lower.includes("mountain")) timezone = "America/Denver";
  else if (lower.includes("pacific")) timezone = "America/Los_Angeles";
  else if (lower.includes("utc")) timezone = "UTC";

  const days: string[] = [];
  if (lower.includes("monday through friday") || lower.includes("monday to friday") || lower.includes("mon-fri") || lower.includes("weekdays")) {
    days.push("Mon", "Tue", "Wed", "Thu", "Fri");
  }
  if (lower.includes("saturday")) days.push("Sat");
  if (lower.includes("sunday")) days.push("Sun");

  // Hours like "8am to 6pm".
  const startTime = extractTime(text);
  const endTime = extractEndTime(text);

  if (!days.length && !startTime && !endTime && !lower.includes("eastern") && !lower.includes("hours")) {
    return undefined;
  }

  return {
    timezone,
    days: days.length ? days : ["Mon", "Tue", "Wed", "Thu", "Fri"],
    startTime: startTime || "09:00",
    endTime: endTime || "17:00",
    mode: days.length || startTime || endTime ? "basic" : "always_open",
  };
}

function extractTime(text: string): string | undefined {
  const lower = text.toLowerCase();
  // Find first "am" or "pm" occurrence and walk back to find the hour digits.
  const ampm = ["am", "pm"];
  for (const marker of ampm) {
    const idx = lower.indexOf(marker);
    if (idx === -1) continue;
    // Walk back over optional whitespace.
    let cursor = idx - 1;
    while (cursor >= 0 && text[cursor] === " ") cursor--;
    // Read digits backward.
    const digitsEnd = cursor + 1;
    while (cursor >= 0 && (isDigitChar(text[cursor]) || text[cursor] === ":")) cursor--;
    const numStr = text.substring(cursor + 1, digitsEnd);
    if (numStr.length === 0) continue;
    const formatted = formatHourString(numStr, marker as "am" | "pm");
    if (formatted) return formatted;
  }
  return undefined;
}

function extractEndTime(text: string): string | undefined {
  const lower = text.toLowerCase();
  const toIdx = lower.indexOf(" to ");
  if (toIdx === -1) return undefined;
  // Look for time after " to ".
  const subText = text.substring(toIdx + 4);
  return extractTime(subText);
}

function formatHourString(numStr: string, ampm: "am" | "pm"): string | undefined {
  const colonIdx = numStr.indexOf(":");
  let hour: number;
  let minute = 0;
  if (colonIdx === -1) {
    hour = Number(numStr);
  } else {
    hour = Number(numStr.substring(0, colonIdx));
    minute = Number(numStr.substring(colonIdx + 1)) || 0;
  }
  if (!Number.isFinite(hour) || hour < 0 || hour > 12) return undefined;
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isDigitChar(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

export default AIAssistant;
