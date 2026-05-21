import type { Integration, PublisherSource } from "../models/appTypes";

export interface FieldDescriptor {
  name: string;
  label: string;
  type: "string" | "phone" | "int" | "decimal" | "bool" | "datetime";
  required: boolean;
  example: string;
  description: string;
}

const FIELD_LIBRARY: Record<string, Omit<FieldDescriptor, "required">> = {
  caller_id: {
    name: "caller_id",
    label: "Caller ID",
    type: "phone",
    example: "+17275551234",
    description: "Phone number of the caller in E.164 format."
  },
  zip: {
    name: "zip",
    label: "ZIP Code",
    type: "string",
    example: "34655",
    description: "5-digit U.S. ZIP code where the caller is located."
  },
  state: {
    name: "state",
    label: "State",
    type: "string",
    example: "FL",
    description: "Two-letter U.S. state code."
  },
  city: {
    name: "city",
    label: "City",
    type: "string",
    example: "New Port Richey",
    description: "Caller's city. Used for geo-routing."
  },
  publisher_id: {
    name: "publisher_id",
    label: "Publisher ID",
    type: "string",
    example: "pub_abc",
    description: "Your assigned publisher identifier."
  },
  sub_id: {
    name: "sub_id",
    label: "Sub Affiliate ID",
    type: "string",
    example: "sub_google_01",
    description: "Optional sub-affiliate or traffic source segment identifier."
  },
  click_id: {
    name: "click_id",
    label: "Click ID",
    type: "string",
    example: "click_uvw987",
    description: "Identifier of the originating click. Stored for postback."
  },
  trusted_form: {
    name: "trusted_form",
    label: "TrustedForm Cert URL",
    type: "string",
    example: "https://cert.trustedform.com/abc",
    description: "TrustedForm certificate URL for consent records."
  },
  jornaya: {
    name: "jornaya",
    label: "Jornaya Lead ID",
    type: "string",
    example: "jornaya-token-123",
    description: "Jornaya LeadiD token captured at consent."
  }
};

const DEFAULT_VALUE_BY_NAME: Record<string, string> = {
  caller_id: "+17275551234",
  zip: "34655",
  state: "FL",
  city: "New Port Richey",
  publisher_id: "pub_abc",
  sub_id: "sub_google_01",
  click_id: "click_uvw987",
  trusted_form: "https://cert.trustedform.com/abc",
  jornaya: "jornaya-token-123"
};

function getSource(integration: Integration, sourceId?: string): PublisherSource | undefined {
  const sources = integration.config.publisherSources || [];
  if (sourceId) {
    const match = sources.find(source => source.id === sourceId);
    if (match) return match;
  }
  const fallback = integration.config.shareableSpec?.defaultSourceId;
  if (fallback) {
    const match = sources.find(source => source.id === fallback);
    if (match) return match;
  }
  return undefined;
}

export function buildFieldDescriptors(
  integration: Integration,
  sourceId?: string
): FieldDescriptor[] {
  const source = getSource(integration, sourceId);
  const requiredNames = new Set<string>(
    (source?.requiredFields && source.requiredFields.length > 0
      ? source.requiredFields
      : integration.config.requiredFields) || []
  );
  const optionalSlots = ["publisher_id", "sub_id", "click_id", "trusted_form", "jornaya"];

  const required: FieldDescriptor[] = [];
  for (const name of requiredNames) {
    const base = FIELD_LIBRARY[name];
    if (base) {
      required.push({ ...base, required: true });
    } else {
      required.push({
        name,
        label: titleize(name),
        type: "string",
        required: true,
        example: DEFAULT_VALUE_BY_NAME[name] ?? "value",
        description: ""
      });
    }
  }

  const optional: FieldDescriptor[] = [];
  for (const name of optionalSlots) {
    if (requiredNames.has(name)) continue;
    const base = FIELD_LIBRARY[name];
    if (!base) continue;
    optional.push({ ...base, required: false });
  }

  return [...required, ...optional];
}

export function resolveEndpoint(integration: Integration, source?: PublisherSource): string {
  const override = integration.config.shareableSpec?.endpointOverride;
  if (override) return override;
  if (source?.postingUrl) return source.postingUrl;
  if (integration.config.postingUrl) return integration.config.postingUrl;
  if (integration.config.destinationNumber) return `tel:${integration.config.destinationNumber}`;
  return `https://mock-ppcall.local/post/${integration.campaignId}/${integration.id}`;
}

export function exampleValueFor(descriptor: FieldDescriptor, source?: PublisherSource): string {
  if (descriptor.name === "publisher_id" && source?.publisherId) return source.publisherId;
  if (descriptor.name === "sub_id" && source?.subAffiliateId) return source.subAffiliateId;
  return descriptor.example;
}

interface BuildSampleOptions {
  source?: PublisherSource;
  descriptors: FieldDescriptor[];
  endpoint: string;
  publisherIdParam?: string;
}

function fieldsForSample(opts: BuildSampleOptions): Array<{ key: string; value: string }> {
  const visible = opts.descriptors.filter(descriptor => descriptor.required);
  return visible.map(descriptor => ({
    key: descriptor.name,
    value: exampleValueFor(descriptor, opts.source)
  }));
}

export function buildCurlQuery(opts: BuildSampleOptions): string {
  const params = fieldsForSample(opts);
  if (opts.publisherIdParam && !params.some(field => field.key === opts.publisherIdParam)) {
    params.push({ key: opts.publisherIdParam, value: opts.source?.publisherId ?? "pub_abc" });
  }
  const query = params
    .map(field => `${encodeURIComponent(field.key)}=${encodeURIComponent(field.value)}`)
    .join("&");
  const url = query.length > 0 ? `${opts.endpoint}?${query}` : opts.endpoint;
  return `curl -X POST "${url}"`;
}

export function buildCurlJson(opts: BuildSampleOptions): string {
  const params = fieldsForSample(opts);
  const body: Record<string, string> = {};
  for (const field of params) {
    body[field.key] = field.value;
  }
  if (opts.publisherIdParam && !(opts.publisherIdParam in body)) {
    body[opts.publisherIdParam] = opts.source?.publisherId ?? "pub_abc";
  }
  const json = JSON.stringify(body, null, 2);
  return [
    `curl -X POST "${opts.endpoint}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${json}'`
  ].join("\n");
}

export function buildAcceptedResponse(integration: Integration): Record<string, unknown> {
  return {
    accepted: true,
    phone_number: "+18005551212",
    payout: 35,
    expires_in_seconds: integration.config.expiresInSeconds || 30,
    routing_id: "rt_abc123"
  };
}

export function buildRejectedResponse(): Record<string, unknown> {
  return {
    accepted: false,
    reason: "no_buyer_available",
    retry_after_seconds: 60
  };
}

export function buildPublicSpecUrl(slug: string, sourceId?: string): string {
  if (typeof window === "undefined") return `#/p/${slug}`;
  const origin = window.location.origin;
  const path = window.location.pathname || "/";
  const query = sourceId ? `?src=${encodeURIComponent(sourceId)}` : "";
  return `${origin}${path}#/p/${slug}${query}`;
}

const SLUG_RANDOM_LENGTH = 5;

export function generateShareSlug(name: string): string {
  const base = toKebab(name) || "publisher-link";
  const suffix = randomToken(SLUG_RANDOM_LENGTH);
  return `${base}-${suffix}`;
}

function randomToken(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const code = Math.floor(Math.random() * 36);
    result += code < 10
      ? String.fromCharCode(48 + code)
      : String.fromCharCode(97 + (code - 10));
  }
  return result;
}

function toKebab(input: string): string {
  let result = "";
  let lastWasDash = false;
  for (const raw of input.toLowerCase()) {
    const code = raw.charCodeAt(0);
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isLower || isDigit) {
      result += raw;
      lastWasDash = false;
    } else if (result.length > 0 && !lastWasDash) {
      result += "-";
      lastWasDash = true;
    }
  }
  while (result.endsWith("-")) result = result.slice(0, -1);
  return result;
}

function titleize(snake: string): string {
  return snake
    .split("_")
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export interface HashRoute {
  type: "publisher-spec";
  slug: string;
  sourceId?: string;
}

export function parseHashRoute(hash: string): HashRoute | null {
  if (!hash) return null;
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed.startsWith("/p/")) return null;
  const rest = trimmed.slice(3);
  if (rest.length === 0) return null;
  const queryIndex = rest.indexOf("?");
  const slug = queryIndex === -1 ? rest : rest.slice(0, queryIndex);
  if (slug.length === 0) return null;
  let sourceId: string | undefined;
  if (queryIndex !== -1) {
    const query = rest.slice(queryIndex + 1);
    for (const pair of query.split("&")) {
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const key = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (key === "src" && value.length > 0) {
        sourceId = decodeURIComponent(value);
      }
    }
  }
  return { type: "publisher-spec", slug, sourceId };
}

export function getResolvedSource(
  integration: Integration,
  sourceId?: string
): PublisherSource | undefined {
  return getSource(integration, sourceId);
}
