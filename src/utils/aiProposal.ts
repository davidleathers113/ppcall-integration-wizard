import type {
  IntegrationConfig,
  IntegrationDirection,
  IntegrationSchedule,
  IntegrationType,
} from "../models/appTypes";

export interface AIConfigProposal {
  direction: IntegrationDirection;
  type: IntegrationType;
  platformPreset: string;
  config: IntegrationConfig;
  confidence: number;
  warnings: string[];
}

interface Extraction<T> {
  value: T | undefined;
  explicit: boolean;
}

const fieldSynonyms: Record<string, string[]> = {
  caller_id: ["caller_id", "cid", "phone", "caller"],
  zip: ["zip", "zipcode", "postal"],
  state: ["state"],
  publisher_id: ["publisher_id", "publisher id", "pub id"],
  trusted_form: ["trusted_form", "trustedform"],
  jornaya: ["jornaya"],
};

export function buildProposal(instructions: string): AIConfigProposal {
  const lower = instructions.toLowerCase();

  const url = extractUrl(instructions);
  const sipAddress = extractSipAddress(instructions);
  const phoneNumber = extractPhoneNumber(instructions);

  const wantsDirectSip =
    sipAddress.explicit ||
    lower.includes("route to sip") ||
    lower.includes("direct sip");
  const wantsDirectNumber =
    !wantsDirectSip &&
    phoneNumber.explicit &&
    (lower.includes("send calls to") ||
      lower.includes("route calls to") ||
      lower.includes("direct number") ||
      !url);

  const direction: IntegrationDirection =
    lower.includes("publisher") || lower.includes("supplier") || lower.includes("post traffic")
      ? "publisher"
      : "buyer";

  const type: IntegrationType = wantsDirectSip || lower.includes("sip")
    ? "sip"
    : wantsDirectNumber || lower.includes("static") || lower.includes("direct number")
    ? "static_number"
    : lower.includes("webhook")
    ? "webhook"
    : "rtb";

  const method = lower.includes("get") && !lower.includes("post") ? "GET" : "POST";

  const requiredFields = Object.entries(fieldSynonyms)
    .filter(([, aliases]) => aliases.some(alias => lower.includes(alias)))
    .map(([field]) => field);
  const acceptedField = firstMatch(lower, ["accepted", "success", "status", "code"]) || "accepted";
  const destinationField =
    firstMatch(lower, ["phone_number", "transfer_number", "destination", "number", "sip"]) ||
    "phone_number";
  const bidField = firstMatch(lower, ["bid", "payout", "price"]) || "payout";
  const rejectField = firstMatch(lower, ["rejection_reason", "reason", "message"]) || "reason";
  const expirationField = firstMatch(lower, ["expires_in_seconds", "expireinseconds", "expiration"]);

  const publisherId = extractPublisherId(instructions);
  const expirationSeconds = extractExpirationSeconds(instructions);

  const warnings: string[] = [];

  if (!url && direction === "buyer" && type !== "static_number" && type !== "sip") {
    warnings.push("No endpoint URL detected; using a placeholder URL.");
  }
  if (direction === "publisher" && !publisherId) {
    warnings.push("No publisher ID detected; using a publisher_id token placeholder.");
  }
  if (!requiredFields.includes("caller_id")) {
    warnings.push(
      "Caller ID was not detected; adding caller_id because PPCall flows generally require it."
    );
  }
  if (!requiredFields.includes("zip") && direction === "buyer" && type === "rtb") {
    warnings.push("ZIP was not detected; RTB examples often require zip.");
  }

  const fields = Array.from(new Set(requiredFields.length ? requiredFields : ["caller_id", "zip"]));
  const tokenBody = Object.fromEntries(fields.map(field => [field, `{{${field}}}`]));
  const expiresInSeconds =
    Number.isFinite(expirationSeconds) && expirationSeconds > 0 ? expirationSeconds : 30;

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
        acceptedResponse: {
          accepted: true,
          phone_number: "+18005551212",
          payout: 35,
          expires_in_seconds: expiresInSeconds,
        },
        rejectedResponse: { accepted: false, reason: "no_buyer_available" },
      },
    };
  }

  if (direction === "buyer" && wantsDirectNumber) {
    return buildDirectNumberProposal({ phoneNumber, instructions, warnings });
  }

  if (direction === "buyer" && wantsDirectSip) {
    return buildDirectSipProposal({ sipAddress, instructions, warnings });
  }

  if (type === "static_number") {
    return {
      direction,
      type,
      platformPreset: "ai_detected_static",
      confidence: 76,
      warnings,
      config: {
        destinationNumber: "+18005551212",
        payout: 25,
        conversionDurationSeconds: 60,
        requiredFields: fields,
      },
    };
  }

  if (type === "sip") {
    return {
      direction,
      type,
      platformPreset: "ai_detected_sip",
      confidence: 76,
      warnings,
      config: {
        sipAddress: "sip:transfer@example.com",
        payout: 25,
        conversionDurationSeconds: 60,
        requiredFields: fields,
      },
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
      queryParams: method === "GET" ? (tokenBody as Record<string, string>) : {},
      responseParsing: {
        acceptedPath: `$.${acceptedField}`,
        acceptedValue: acceptedField === "status" ? "ok" : true,
        destinationNumberPath: destinationField === "sip" ? undefined : `$.${destinationField}`,
        sipAddressPath: destinationField === "sip" ? "$.sip" : undefined,
        bidPath: `$.${bidField}`,
        expiresInSecondsPath: expirationField ? `$.${expirationField}` : undefined,
        rejectReasonPath: `$.${rejectField}`,
      },
      timeoutSeconds: 3,
      requiredFields: fields,
    },
  };
}

function buildDirectNumberProposal({
  phoneNumber,
  instructions,
  warnings,
}: {
  phoneNumber: Extraction<string>;
  instructions: string;
  warnings: string[];
}): AIConfigProposal {
  const payout = extractCurrencyAmount(instructions);
  const conversionDuration = extractAfterSeconds(instructions);
  const dailyCap = extractDailyCap(instructions);
  const concurrency = extractMaxConcurrency(instructions);
  const schedule = extractScheduleHints(instructions);
  const number = phoneNumber.value || "+18005551212";

  const config: IntegrationConfig = {
    buyerDestinationKind: "direct_number",
    destinationMode: "static_number",
    destination: { number },
    destinationNumber: number,
    payout: payout.value ?? 35,
    conversionDurationSeconds: conversionDuration.value ?? 120,
    callHandling: { connectionTimeoutSeconds: 30, revenueRecovery: "buyer_default" },
    schedule: schedule.value || defaultAlwaysOpenSchedule(),
    caps: {
      capOn: "converted_calls",
      daily: dailyCap.value,
      concurrency: concurrency.value,
    },
  };
  const confidence = scoreDirectTargetProposal({
    destinationExplicit: phoneNumber.explicit,
    payoutExplicit: payout.explicit,
    conversionDurationExplicit: conversionDuration.explicit,
    scheduleExplicit: schedule.explicit,
    timezoneExplicit: schedule.value ? scheduleHasExplicitTimezone(instructions) : false,
    scheduleHoursExplicit: schedule.value ? scheduleHasExplicitHours(instructions) : false,
    dailyCapExplicit: dailyCap.explicit,
    concurrencyExplicit: concurrency.explicit,
    sipHeadersExplicit: false,
    warningCount: warnings.length,
  });
  return {
    direction: "buyer",
    type: "static_number",
    platformPreset: "ai_detected_direct_number",
    confidence,
    warnings,
    config,
  };
}

function buildDirectSipProposal({
  sipAddress,
  instructions,
  warnings,
}: {
  sipAddress: Extraction<string>;
  instructions: string;
  warnings: string[];
}): AIConfigProposal {
  const payout = extractCurrencyAmount(instructions);
  const conversionDuration = extractAfterSeconds(instructions);
  const dailyCap = extractDailyCap(instructions);
  const concurrency = extractMaxConcurrency(instructions);
  const schedule = extractScheduleHints(instructions);
  const address = sipAddress.value || "sip:buyer@example.com";

  const config: IntegrationConfig = {
    buyerDestinationKind: "direct_sip",
    destinationMode: "static_sip",
    destination: { sipAddress: address },
    sipAddress: address,
    payout: payout.value ?? 35,
    conversionDurationSeconds: conversionDuration.value ?? 120,
    callHandling: { connectionTimeoutSeconds: 30, revenueRecovery: "buyer_default" },
    schedule: schedule.value || defaultAlwaysOpenSchedule(),
    caps: {
      capOn: "converted_calls",
      daily: dailyCap.value,
      concurrency: concurrency.value,
    },
  };
  const confidence = scoreDirectTargetProposal({
    destinationExplicit: sipAddress.explicit,
    payoutExplicit: payout.explicit,
    conversionDurationExplicit: conversionDuration.explicit,
    scheduleExplicit: schedule.explicit,
    timezoneExplicit: schedule.value ? scheduleHasExplicitTimezone(instructions) : false,
    scheduleHoursExplicit: schedule.value ? scheduleHasExplicitHours(instructions) : false,
    dailyCapExplicit: dailyCap.explicit,
    concurrencyExplicit: concurrency.explicit,
    sipHeadersExplicit: false,
    warningCount: warnings.length,
  });
  return {
    direction: "buyer",
    type: "sip",
    platformPreset: "ai_detected_direct_sip",
    confidence,
    warnings,
    config,
  };
}

export interface DirectTargetScoreInput {
  destinationExplicit: boolean;
  payoutExplicit: boolean;
  conversionDurationExplicit: boolean;
  scheduleExplicit: boolean;
  timezoneExplicit: boolean;
  scheduleHoursExplicit: boolean;
  dailyCapExplicit: boolean;
  concurrencyExplicit: boolean;
  sipHeadersExplicit: boolean;
  warningCount: number;
}

export function scoreDirectTargetProposal(input: DirectTargetScoreInput): number {
  let score = 50;
  if (input.destinationExplicit) score += 15;
  if (input.payoutExplicit) score += 10;
  if (input.conversionDurationExplicit) score += 10;
  if (input.timezoneExplicit) score += 5;
  if (input.scheduleHoursExplicit) score += 5;
  if (input.dailyCapExplicit) score += 3;
  if (input.concurrencyExplicit) score += 3;
  if (input.sipHeadersExplicit) score += 2;
  score -= input.warningCount * 5;
  return Math.max(10, Math.min(99, score));
}

function defaultAlwaysOpenSchedule(): IntegrationSchedule {
  return {
    timezone: "America/New_York",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    startTime: "00:00",
    endTime: "23:59",
    mode: "always_open",
  };
}

function scheduleHasExplicitTimezone(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("eastern") ||
    lower.includes("central") ||
    lower.includes("mountain") ||
    lower.includes("pacific") ||
    lower.includes("utc")
  );
}

function scheduleHasExplicitHours(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("am") || lower.includes("pm") || lower.includes(" to ");
}

// =========================== Extractors ===========================

function firstMatch(value: string, fields: string[]): string | undefined {
  return fields.find(field => value.includes(field.toLowerCase()));
}

function extractUrl(text: string): string | undefined {
  const httpIndex = text.indexOf("http://");
  const httpsIndex = text.indexOf("https://");
  let startIndex = -1;
  if (httpIndex !== -1 && httpsIndex !== -1) {
    startIndex = Math.min(httpIndex, httpsIndex);
  } else if (httpIndex !== -1) {
    startIndex = httpIndex;
  } else if (httpsIndex !== -1) {
    startIndex = httpsIndex;
  }
  if (startIndex === -1) return undefined;
  let endIndex = text.length;
  const terminators = [" ", '"', "'", ")", "\n", "\t"];
  for (const term of terminators) {
    const termIndex = text.indexOf(term, startIndex);
    if (termIndex !== -1 && termIndex < endIndex) endIndex = termIndex;
  }
  return text.substring(startIndex, endIndex);
}

function extractPublisherId(text: string): string | undefined {
  const lower = text.toLowerCase();
  let pos = 0;
  while (pos < lower.length) {
    const pubIndex = lower.indexOf("pub", pos);
    if (pubIndex === -1) break;
    if (pubIndex + 3 < lower.length) {
      const nextChar = lower[pubIndex + 3];
      if (nextChar === "_" || nextChar === "-") {
        let endIndex = pubIndex + 4;
        while (endIndex < lower.length) {
          const char = lower[endIndex];
          const isValid =
            (char >= "a" && char <= "z") ||
            (char >= "0" && char <= "9") ||
            char === "_" ||
            char === "-";
          if (!isValid) break;
          endIndex++;
        }
        if (endIndex > pubIndex + 4) return text.substring(pubIndex, endIndex);
      }
    }
    pos = pubIndex + 1;
  }
  return undefined;
}

function extractExpirationSeconds(text: string): number {
  const lower = text.toLowerCase();
  const keywords = ["expires_in_seconds", "expirationinseconds", "expiration", "expires", "expire"];
  for (const keyword of keywords) {
    const keywordIndex = lower.indexOf(keyword);
    if (keywordIndex === -1) continue;
    const searchStart = keywordIndex + keyword.length;
    const searchEnd = Math.min(searchStart + 30, lower.length);
    const searchRegion = text.substring(searchStart, searchEnd);
    let numberStr = "";
    for (const char of searchRegion) {
      if (char >= "0" && char <= "9") numberStr += char;
      else if (numberStr.length > 0) break;
    }
    if (numberStr.length >= 2 && numberStr.length <= 5) {
      const num = parseInt(numberStr, 10);
      if (num > 0) return num;
    }
  }
  return 0;
}

export function extractPhoneNumber(text: string): Extraction<string> {
  const plusIndex = text.indexOf("+");
  if (plusIndex === -1) return { value: undefined, explicit: false };
  let cursor = plusIndex + 1;
  if (cursor >= text.length) return { value: undefined, explicit: false };
  if (!isDigitChar(text[cursor])) return { value: undefined, explicit: false };
  let result = "+";
  while (cursor < text.length) {
    const ch = text[cursor];
    if (isDigitChar(ch)) {
      result += ch;
    } else if (ch === " " || ch === "-" || ch === "(" || ch === ")" || ch === ".") {
      // Skip separators between digits.
    } else {
      break;
    }
    cursor++;
  }
  const digits = result.length - 1;
  if (digits < 8 || digits > 15) return { value: undefined, explicit: false };
  return { value: result, explicit: true };
}

export function extractSipAddress(text: string): Extraction<string> {
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
  if (start === -1) return { value: undefined, explicit: false };
  let cursor = start + scheme.length;
  let result = text.substring(start, start + scheme.length);
  while (cursor < text.length) {
    const ch = text[cursor];
    if (
      ch === " " ||
      ch === "," ||
      ch === ";" ||
      ch === "\n" ||
      ch === "\t" ||
      ch === '"' ||
      ch === "'" ||
      ch === ")"
    ) {
      break;
    }
    result += ch;
    cursor++;
  }
  if (result === scheme) return { value: undefined, explicit: false };
  return { value: result, explicit: true };
}

export function extractCurrencyAmount(text: string): Extraction<number> {
  const dollarIdx = text.indexOf("$");
  if (dollarIdx !== -1) {
    let cursor = dollarIdx + 1;
    let numStr = "";
    while (cursor < text.length) {
      const ch = text[cursor];
      if (isDigitChar(ch) || ch === ".") numStr += ch;
      else break;
      cursor++;
    }
    if (numStr.length > 0) {
      const num = Number(numStr);
      if (Number.isFinite(num) && num > 0) return { value: num, explicit: true };
    }
  }
  const kw = extractKeywordNumber(text, ["pays ", "payout of ", "payout is ", "payout "]);
  return kw;
}

export function extractAfterSeconds(text: string): Extraction<number> {
  const a = extractKeywordNumber(text, ["after "]);
  if (a.explicit) return a;
  return extractKeywordNumber(text, ["conversion duration ", "conversion duration of "]);
}

export function extractDailyCap(text: string): Extraction<number> {
  return extractKeywordNumber(text, ["daily cap ", "daily cap is ", "daily cap of "]);
}

export function extractMaxConcurrency(text: string): Extraction<number> {
  return extractKeywordNumber(text, ["max concurrency ", "max concurrency of ", "concurrency "]);
}

function extractKeywordNumber(text: string, keywords: string[]): Extraction<number> {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx === -1) continue;
    let cursor = idx + keyword.length;
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
      if (Number.isFinite(num) && num > 0) return { value: num, explicit: true };
    }
  }
  return { value: undefined, explicit: false };
}

export function extractScheduleHints(text: string): Extraction<IntegrationSchedule> {
  const lower = text.toLowerCase();
  let timezone = "America/New_York";
  if (lower.includes("eastern")) timezone = "America/New_York";
  else if (lower.includes("central")) timezone = "America/Chicago";
  else if (lower.includes("mountain")) timezone = "America/Denver";
  else if (lower.includes("pacific")) timezone = "America/Los_Angeles";
  else if (lower.includes("utc")) timezone = "UTC";

  const days: string[] = [];
  if (
    lower.includes("monday through friday") ||
    lower.includes("monday to friday") ||
    lower.includes("mon-fri") ||
    lower.includes("weekdays")
  ) {
    days.push("Mon", "Tue", "Wed", "Thu", "Fri");
  }
  if (lower.includes("saturday")) days.push("Sat");
  if (lower.includes("sunday")) days.push("Sun");

  const startTime = extractTime(text);
  const endTime = extractEndTime(text);

  if (
    !days.length &&
    !startTime &&
    !endTime &&
    !lower.includes("eastern") &&
    !lower.includes("hours")
  ) {
    return { value: undefined, explicit: false };
  }

  return {
    value: {
      timezone,
      days: days.length ? days : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: startTime || "09:00",
      endTime: endTime || "17:00",
      mode: days.length || startTime || endTime ? "basic" : "always_open",
    },
    explicit: true,
  };
}

function extractTime(text: string): string | undefined {
  const lower = text.toLowerCase();
  const ampm = ["am", "pm"];
  for (const marker of ampm) {
    const idx = lower.indexOf(marker);
    if (idx === -1) continue;
    let cursor = idx - 1;
    while (cursor >= 0 && text[cursor] === " ") cursor--;
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
