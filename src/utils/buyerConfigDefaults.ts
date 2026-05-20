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
