import type {
  BuyerDestinationKind,
  IntegrationCaps,
  IntegrationConfig,
  IntegrationSchedule,
} from "../models/appTypes";

export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  message?: string;
}

export interface ValidationIssue {
  field: string;
  severity: "error" | "warning";
  message: string;
}

const PHONE_DIGITS = "0123456789";
const PHONE_SEPARATORS = " -() .";
const SIP_USER_INVALID = " \t\n\r\"<>,;";
const DIAL_IVR_ALLOWED_CHARS = "0123456789#wWpP,";
const KNOWN_NUMERIC_TOKENS = new Set([
  "zip",
  "caller_id",
  "publisher_id",
  "campaign_id",
  "phone",
  "phone_number",
  "duration",
]);

export function normalizePhoneNumber(value: string): string {
  if (!value) return "";
  let result = "";
  let leadingPlus = false;
  const trimmed = value.trim();
  for (let index = 0; index < trimmed.length; index++) {
    const ch = trimmed[index];
    if (index === 0 && ch === "+") {
      leadingPlus = true;
      continue;
    }
    if (PHONE_DIGITS.includes(ch)) {
      result += ch;
    }
    // Drop separators (spaces, hyphens, parens, dots).
  }
  if (!result) return "";
  return (leadingPlus ? "+" : "") + result;
}

export function validatePhoneNumber(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, message: "Destination number is required." };
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    return {
      valid: false,
      message: "Phone number must start with '+' and include country code (e.g. +12223334444).",
    };
  }
  // Check all remaining chars are digits or accepted separators.
  for (let index = 1; index < trimmed.length; index++) {
    const ch = trimmed[index];
    if (!PHONE_DIGITS.includes(ch) && !PHONE_SEPARATORS.includes(ch)) {
      return {
        valid: false,
        message: `Phone number contains invalid character '${ch}'.`,
      };
    }
  }
  const normalized = normalizePhoneNumber(trimmed);
  const digitCount = normalized.startsWith("+")
    ? normalized.length - 1
    : normalized.length;
  if (digitCount < 8) {
    return { valid: false, message: "Phone number must include at least 8 digits.", normalized };
  }
  if (digitCount > 15) {
    return { valid: false, message: "Phone number must not exceed 15 digits (E.164).", normalized };
  }
  return { valid: true, normalized };
}

export function validateSipAddress(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, message: "SIP address is required." };
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("sip:") && !trimmed.startsWith("sips:")) {
    return {
      valid: false,
      message: "SIP address must start with 'sip:' or 'sips:' (e.g. sip:buyer@example.com).",
    };
  }
  const schemeLen = trimmed.startsWith("sips:") ? 5 : 4;
  const rest = trimmed.substring(schemeLen);
  if (rest.length === 0) {
    return { valid: false, message: "SIP address must include a host after the scheme." };
  }
  // user@host:port — but only host is required.
  let hostPortion = rest;
  const atIndex = rest.indexOf("@");
  if (atIndex !== -1) {
    const userPortion = rest.substring(0, atIndex);
    hostPortion = rest.substring(atIndex + 1);
    if (userPortion.length === 0) {
      return { valid: false, message: "SIP user portion before '@' must not be empty." };
    }
    for (const ch of userPortion) {
      if (SIP_USER_INVALID.includes(ch)) {
        return {
          valid: false,
          message: `SIP user portion contains invalid character '${ch}'.`,
        };
      }
    }
  }
  if (hostPortion.length === 0) {
    return { valid: false, message: "SIP host portion is missing." };
  }
  // Host must contain at least one dot OR colon (for port) — accept either, but no spaces.
  for (const ch of hostPortion) {
    if (ch === " " || ch === "\t" || ch === "\n") {
      return { valid: false, message: "SIP host must not contain whitespace." };
    }
  }
  if (!hostPortion.includes(".") && !hostPortion.includes(":")) {
    return {
      valid: false,
      message: "SIP host should look like 'example.com' or 'example.com:5060'.",
    };
  }
  return { valid: true, normalized: trimmed };
}

function extractTokensFromString(value: string): string[] {
  const tokens: string[] = [];
  let pos = 0;
  while (pos < value.length) {
    const open = value.indexOf("{{", pos);
    if (open === -1) break;
    const close = value.indexOf("}}", open + 2);
    if (close === -1) break;
    tokens.push(value.substring(open + 2, close).trim());
    pos = close + 2;
  }
  return tokens;
}

function stripTokens(value: string): string {
  let result = "";
  let pos = 0;
  while (pos < value.length) {
    const open = value.indexOf("{{", pos);
    if (open === -1) {
      result += value.substring(pos);
      break;
    }
    result += value.substring(pos, open);
    const close = value.indexOf("}}", open + 2);
    if (close === -1) break;
    pos = close + 2;
  }
  return result;
}

export function validateDialIvrDigits(value: string): ValidationResult {
  if (!value || value.trim() === "") {
    return { valid: false, message: "Dial IVR digits are required when IVR is enabled." };
  }
  const tokens = extractTokensFromString(value);
  for (const token of tokens) {
    if (!KNOWN_NUMERIC_TOKENS.has(token)) {
      return {
        valid: true,
        message: `Token '{{${token}}}' is not known to resolve to numeric digits.`,
      };
    }
  }
  const stripped = stripTokens(value);
  for (const ch of stripped) {
    if (!DIAL_IVR_ALLOWED_CHARS.includes(ch)) {
      return {
        valid: false,
        message: `Dial IVR contains unsupported character '${ch}'. Allowed: digits, #, w (pause), tokens.`,
      };
    }
  }
  return { valid: true };
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function validateCaps(caps: IntegrationCaps | undefined, capUsage: IntegrationConfig["capUsage"]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!caps) return issues;
  const keys: Array<keyof IntegrationCaps> = ["global", "monthly", "daily", "hourly", "concurrency"];
  for (const key of keys) {
    const value = caps[key];
    if (value === undefined) continue;
    if (!isPositiveNumber(value)) {
      issues.push({
        field: `caps.${String(key)}`,
        severity: "error",
        message: `Cap '${String(key)}' must be a positive number.`,
      });
    }
  }
  if (capUsage?.currentConcurrency !== undefined && caps.concurrency !== undefined) {
    if (capUsage.currentConcurrency >= caps.concurrency) {
      issues.push({
        field: "capUsage.currentConcurrency",
        severity: "error",
        message: "Current concurrency is already at or above the concurrency cap.",
      });
    }
  }
  return issues;
}

export function validateSchedule(schedule: IntegrationSchedule | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!schedule) return issues;
  if (!schedule.timezone || schedule.timezone.trim() === "") {
    issues.push({
      field: "schedule.timezone",
      severity: "error",
      message: "Schedule must include a timezone.",
    });
  }
  if ((schedule.mode || "basic") === "basic") {
    if (!schedule.days || schedule.days.length === 0) {
      issues.push({
        field: "schedule.days",
        severity: "error",
        message: "Basic schedule requires at least one day.",
      });
    }
    if (!schedule.startTime || !schedule.endTime) {
      issues.push({
        field: "schedule.times",
        severity: "error",
        message: "Basic schedule requires open and close times.",
      });
    }
  }
  return issues;
}

export function validateDirectTargetConfig(
  config: IntegrationConfig,
  kind: BuyerDestinationKind
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (kind === "direct_number") {
    const number = config.destination?.number ?? config.destinationNumber;
    if (!number) {
      issues.push({
        field: "destination.number",
        severity: "error",
        message: "Destination number is required.",
      });
    } else {
      const result = validatePhoneNumber(number);
      if (!result.valid) {
        issues.push({
          field: "destination.number",
          severity: "error",
          message: result.message || "Destination number is invalid.",
        });
      }
    }
  }

  if (kind === "direct_sip") {
    const sipAddress = config.destination?.sipAddress ?? config.sipAddress;
    if (!sipAddress) {
      issues.push({
        field: "destination.sipAddress",
        severity: "error",
        message: "SIP address is required.",
      });
    } else {
      const result = validateSipAddress(sipAddress);
      if (!result.valid) {
        issues.push({
          field: "destination.sipAddress",
          severity: "error",
          message: result.message || "SIP address is invalid.",
        });
      }
    }
  }

  if (config.payout === undefined || config.payout === null) {
    issues.push({
      field: "payout",
      severity: "error",
      message: "Payout is required for direct targets.",
    });
  }
  if (config.conversionDurationSeconds === undefined || config.conversionDurationSeconds === null) {
    issues.push({
      field: "conversionDurationSeconds",
      severity: "error",
      message: "Conversion duration is required for direct targets.",
    });
  }

  if (!config.schedule?.timezone) {
    issues.push({
      field: "schedule.timezone",
      severity: "error",
      message: "Timezone is required.",
    });
  }
  issues.push(...validateSchedule(config.schedule));
  issues.push(...validateCaps(config.caps, config.capUsage));

  if (config.duplicateRules?.mode === "restrict") {
    const window = config.duplicateRules.windowMinutes;
    if (window === undefined || window <= 0) {
      issues.push({
        field: "duplicateRules.windowMinutes",
        severity: "error",
        message: "Restrict duplicates mode requires a positive window in minutes.",
      });
    }
  }

  if (config.dialIvr?.enabled) {
    if (!config.dialIvr.digits || config.dialIvr.digits.trim() === "") {
      issues.push({
        field: "dialIvr.digits",
        severity: "warning",
        message: "Dial IVR is enabled but digits are empty.",
      });
    } else {
      const ivr = validateDialIvrDigits(config.dialIvr.digits);
      if (!ivr.valid) {
        issues.push({
          field: "dialIvr.digits",
          severity: "error",
          message: ivr.message || "Dial IVR digits are invalid.",
        });
      } else if (ivr.message) {
        issues.push({
          field: "dialIvr.digits",
          severity: "warning",
          message: ivr.message,
        });
      }
    }
  }

  return issues;
}
