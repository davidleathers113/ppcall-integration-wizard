import type {
  BuyerDestinationKind,
  CallHandlingConfig,
  CapUsage,
  DestinationConfig,
  DestinationMode,
  DialIvrSettings,
  DuplicateRules,
  ErrorSettings,
  FilterRule,
  Integration,
  IntegrationConfig,
  IntegrationSchedule,
  IntegrationScheduleDayRule,
  PredictiveRoutingConfig,
  RecordingSettings,
  RequestConfig,
  RevenueSettings,
  ShareableTagsConfig,
} from "../models/appTypes";

export function inferDestinationMode(
  integration: Pick<Integration, "type" | "config">
): DestinationMode {
  const config = integration.config;
  if (config.destinationMode) return config.destinationMode;
  if (integration.type === "sip") {
    if (config.destination?.dynamicSipPath || config.responseParsing?.sipAddressPath) {
      return "dynamic_sip_from_response";
    }
    return "static_sip";
  }
  if (integration.type === "static_number") return "static_number";
  if (config.responseParsing?.destinationNumberPath || config.destination?.dynamicNumberPath) {
    return "dynamic_number_from_response";
  }
  if (config.responseParsing?.sipAddressPath || config.destination?.dynamicSipPath) {
    return "dynamic_sip_from_response";
  }
  if (config.sipAddress) return "static_sip";
  return "static_number";
}

export function inferDestination(
  integration: Pick<Integration, "type" | "config">
): DestinationConfig {
  const config = integration.config;
  return {
    number: config.destination?.number ?? config.destinationNumber,
    sipAddress: config.destination?.sipAddress ?? config.sipAddress,
    dynamicNumberPath:
      config.destination?.dynamicNumberPath ?? config.responseParsing?.destinationNumberPath,
    dynamicSipPath:
      config.destination?.dynamicSipPath ?? config.responseParsing?.sipAddressPath,
  };
}

export function inferRequest(config: IntegrationConfig): RequestConfig {
  const headers = config.request?.headers ?? config.headers;
  const inferredContentType = headers && headers["Content-Type"];
  return {
    method: config.request?.method ?? config.method,
    url: config.request?.url ?? config.url,
    authenticationMode: config.request?.authenticationMode ?? "none",
    contentType:
      config.request?.contentType ??
      (inferredContentType === "application/x-www-form-urlencoded"
        ? "application/x-www-form-urlencoded"
        : inferredContentType === "text/plain"
        ? "text/plain"
        : "application/json"),
    headers: headers ?? {},
    queryParams: config.request?.queryParams ?? config.queryParams ?? {},
    body: config.request?.body ?? config.requestBody ?? {},
    timeoutSeconds: config.request?.timeoutSeconds ?? config.timeoutSeconds ?? 3,
  };
}

export function inferDuplicateRules(config: IntegrationConfig): DuplicateRules {
  return config.duplicateRules ?? { mode: "campaign_default" };
}

export function inferRecordingSettings(config: IntegrationConfig): RecordingSettings {
  return config.recordingSettings ?? { mode: "account_default" };
}

export function inferRevenueSettings(config: IntegrationConfig): RevenueSettings {
  if (config.revenueSettings) return config.revenueSettings;
  if (config.payout !== undefined || config.conversionDurationSeconds !== undefined) {
    return {
      mode: "override",
      payout: config.payout,
      conversionDurationSeconds: config.conversionDurationSeconds,
      dynamicBidPath: config.responseParsing?.bidPath,
      dynamicDurationPath: config.responseParsing?.conversionDurationPath,
    };
  }
  return { mode: "campaign_default" };
}

export function inferErrorSettings(config: IntegrationConfig): ErrorSettings {
  return config.errorSettings ?? { mode: "ring_tree_default" };
}

export function inferFilters(config: IntegrationConfig): FilterRule[] {
  return config.filters ?? [];
}

export function inferDialIvr(config: IntegrationConfig): DialIvrSettings {
  return config.dialIvr ?? { enabled: false };
}

export function inferBuyerDestinationKind(
  integration: Pick<Integration, "type" | "config" | "direction">
): BuyerDestinationKind {
  if (integration.direction !== "buyer") {
    return integration.config.buyerDestinationKind ?? "generic_api";
  }
  if (integration.config.buyerDestinationKind) return integration.config.buyerDestinationKind;
  if (integration.type === "static_number") return "direct_number";
  if (integration.type === "sip") return "direct_sip";
  if (integration.type === "rtb") return "rtb";
  if (integration.type === "webhook") return "webhook";
  return "generic_api";
}

export function isDirectTargetKind(kind: BuyerDestinationKind): boolean {
  return kind === "direct_number" || kind === "direct_sip";
}

export function formatIntegrationTypeLabel(
  integration: Pick<Integration, "type" | "config" | "direction">
): string {
  if (integration.direction === "buyer") {
    const kind = inferBuyerDestinationKind(integration);
    if (kind === "direct_number") return "Direct Number Target";
    if (kind === "direct_sip") return "Direct SIP Target";
    if (kind === "rtb") return "RTB / Ping-Post Target";
    if (kind === "webhook") return "Webhook Target";
    if (kind === "generic_api") return "Generic API Target";
  }
  // Fallback for publishers and unknown buyer kinds — spaces between segments.
  return integration.type.split("_").join(" ");
}

export function inferCallHandling(config: IntegrationConfig): CallHandlingConfig {
  return (
    config.callHandling ?? {
      connectionTimeoutSeconds: 30,
      revenueRecovery: "buyer_default",
    }
  );
}

export function inferCapUsage(config: IntegrationConfig): CapUsage {
  return config.capUsage ?? {};
}

export function inferShareableTags(config: IntegrationConfig): ShareableTagsConfig {
  return config.shareableTags ?? { mode: "buyer_default" };
}

export function inferPredictiveRouting(config: IntegrationConfig): PredictiveRoutingConfig {
  return (
    config.predictiveRouting ?? {
      mode: "campaign_default",
      priorityBump: 0,
    }
  );
}

export const FILTER_FIELDS = [
  "caller_id",
  "zip",
  "state",
  "city",
  "publisher_id",
  "campaign_id",
  "trusted_form",
  "jornaya",
] as const;

export const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
] as const;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type ScheduleMode = "always_open" | "basic" | "advanced";

export interface NormalizedSchedule {
  timezone: string;
  mode: ScheduleMode;
  dayRules: IntegrationScheduleDayRule[];
}

const DEFAULT_TIMEZONE = "America/New_York";
const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "17:00";

/**
 * Returns a canonical schedule with a `dayRules` entry for every weekday.
 * Synthesizes `dayRules` from legacy `days` / `startTime` / `endTime` when needed
 * so the UI doesn't have to handle two shapes.
 *
 * Reading is non-destructive: callers can `normalizeSchedule(integration.config.schedule)`
 * without mutating the stored schedule.
 */
export function normalizeSchedule(schedule: IntegrationSchedule | undefined): NormalizedSchedule {
  const mode: ScheduleMode = schedule?.mode || "basic";
  const timezone = schedule?.timezone || DEFAULT_TIMEZONE;

  // If `dayRules` are explicitly set, honor them and pad missing days as disabled.
  if (schedule?.dayRules && schedule.dayRules.length > 0) {
    const byDay = new Map<string, IntegrationScheduleDayRule>();
    for (const rule of schedule.dayRules) byDay.set(rule.day, rule);
    const dayRules = WEEKDAYS.map(day => {
      const existing = byDay.get(day);
      if (existing) return { ...existing };
      return {
        day,
        enabled: false,
        startTime: schedule.startTime || DEFAULT_OPEN,
        endTime: schedule.endTime || DEFAULT_CLOSE,
      };
    });
    return { timezone, mode, dayRules };
  }

  // Synthesize from legacy `days` + shared `startTime`/`endTime`.
  const enabledDays = new Set(schedule?.days || []);
  const startTime = schedule?.startTime || DEFAULT_OPEN;
  const endTime = schedule?.endTime || DEFAULT_CLOSE;
  const alwaysOpen = mode === "always_open";
  const dayRules = WEEKDAYS.map(day => ({
    day,
    enabled: alwaysOpen ? true : enabledDays.has(day),
    startTime,
    endTime,
  }));
  return { timezone, mode, dayRules };
}

/**
 * Inverse of `normalizeSchedule`: produces a persistence-shape `IntegrationSchedule`
 * with BOTH the canonical `dayRules` AND the legacy `days`/`startTime`/`endTime`
 * fields populated so old readers keep working.
 *
 * For basic mode, the legacy startTime/endTime are taken from the first enabled
 * rule (every enabled rule shares the same hours in basic mode). For advanced
 * mode with non-uniform hours, legacy startTime/endTime collapse to the most
 * frequent enabled-day values (or the first enabled rule if all unique).
 */
export function denormalizeSchedule(normalized: NormalizedSchedule): IntegrationSchedule {
  const enabledRules = normalized.dayRules.filter(rule => rule.enabled);
  const days = enabledRules.map(rule => rule.day);
  const legacyTimes = pickDominantTimes(enabledRules);

  return {
    timezone: normalized.timezone,
    mode: normalized.mode,
    days,
    startTime: legacyTimes.startTime,
    endTime: legacyTimes.endTime,
    dayRules: normalized.dayRules,
  };
}

function pickDominantTimes(
  rules: IntegrationScheduleDayRule[]
): { startTime: string; endTime: string } {
  if (rules.length === 0) {
    return { startTime: DEFAULT_OPEN, endTime: DEFAULT_CLOSE };
  }
  const counts = new Map<string, number>();
  for (const rule of rules) {
    const key = `${rule.startTime || DEFAULT_OPEN}|${rule.endTime || DEFAULT_CLOSE}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let bestKey = `${rules[0].startTime || DEFAULT_OPEN}|${rules[0].endTime || DEFAULT_CLOSE}`;
  let bestCount = -1;
  for (const [key, count] of counts.entries()) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  const [startTime, endTime] = bestKey.split("|");
  return { startTime, endTime };
}
