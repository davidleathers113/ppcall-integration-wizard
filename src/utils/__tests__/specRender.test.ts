import { describe, expect, it } from "vitest";
import type { Integration } from "../../models/appTypes";
import {
  buildCurlJson,
  buildCurlQuery,
  buildFieldDescriptors,
  generateShareSlug,
  parseHashRoute,
  resolveEndpoint
} from "../specRender";

const baseIntegration: Integration = {
  id: "int_test",
  campaignId: "camp_test",
  name: "Test Publisher",
  direction: "publisher",
  type: "rtb",
  platformPreset: "publisher_rtb",
  status: "active",
  config: {
    postingUrl: "https://example.test/rtb/camp/pub",
    publisherId: "pub_xyz",
    requiredFields: ["caller_id", "zip"],
    publisherSources: [
      {
        id: "src_one",
        name: "One",
        publisherId: "pub_xyz",
        sourceId: "src_one_code",
        subAffiliateId: "sub_one",
        status: "active",
        requiredFields: ["caller_id", "zip", "state"],
        postingUrl: "https://example.test/rtb/camp/pub/one",
        usageCount: 0,
        errorRate: 0
      }
    ]
  },
  createdAt: "2026-01-01T00:00:00Z",
  createdBy: "Tester",
  updatedAt: "2026-01-01T00:00:00Z",
  updatedBy: "Tester",
  usageCount: 0,
  errorRate: 0
};

describe("buildFieldDescriptors", () => {
  it("returns required + optional descriptors with required first", () => {
    const descriptors = buildFieldDescriptors(baseIntegration);
    const requiredNames = descriptors.filter(d => d.required).map(d => d.name);
    expect(requiredNames).toEqual(["caller_id", "zip"]);
    expect(descriptors.some(d => d.name === "publisher_id" && !d.required)).toBe(true);
  });

  it("prefers a source's required fields when sourceId is supplied", () => {
    const descriptors = buildFieldDescriptors(baseIntegration, "src_one");
    const requiredNames = descriptors.filter(d => d.required).map(d => d.name);
    expect(requiredNames).toEqual(["caller_id", "zip", "state"]);
  });

  it("synthesizes descriptors for unknown required field names", () => {
    const integration: Integration = {
      ...baseIntegration,
      config: {
        ...baseIntegration.config,
        requiredFields: ["custom_unknown_field"]
      }
    };
    const descriptors = buildFieldDescriptors(integration);
    expect(descriptors[0]).toMatchObject({
      name: "custom_unknown_field",
      required: true,
      type: "string"
    });
  });
});

describe("resolveEndpoint", () => {
  it("prefers shareableSpec.endpointOverride", () => {
    const integration: Integration = {
      ...baseIntegration,
      config: {
        ...baseIntegration.config,
        shareableSpec: {
          slug: "x",
          createdAt: "2026-01-01T00:00:00Z",
          createdBy: "Tester",
          endpointOverride: "https://override.test/ingest"
        }
      }
    };
    expect(resolveEndpoint(integration)).toBe("https://override.test/ingest");
  });

  it("falls back to source posting URL, then integration posting URL", () => {
    const source = baseIntegration.config.publisherSources![0];
    expect(resolveEndpoint(baseIntegration, source)).toBe(source.postingUrl);
    expect(resolveEndpoint(baseIntegration)).toBe(baseIntegration.config.postingUrl);
  });
});

describe("buildCurlQuery / buildCurlJson", () => {
  it("includes only required fields and uses bound source publisher_id", () => {
    const descriptors = buildFieldDescriptors(baseIntegration, "src_one");
    const source = baseIntegration.config.publisherSources![0];
    const endpoint = resolveEndpoint(baseIntegration, source);
    const curl = buildCurlQuery({
      descriptors,
      endpoint,
      source,
      publisherIdParam: "publisher_id"
    });
    expect(curl.startsWith("curl -X POST")).toBe(true);
    expect(curl.includes("caller_id=")).toBe(true);
    expect(curl.includes("publisher_id=pub_xyz")).toBe(true);
    expect(curl.includes(endpoint)).toBe(true);
  });

  it("produces valid JSON body for the JSON variant", () => {
    const descriptors = buildFieldDescriptors(baseIntegration);
    const curl = buildCurlJson({
      descriptors,
      endpoint: "https://example.test/post",
      publisherIdParam: "publisher_id"
    });
    expect(curl.includes("-H \"Content-Type: application/json\"")).toBe(true);
    const bodyStart = curl.indexOf("'{");
    const bodyEnd = curl.lastIndexOf("}'");
    expect(bodyStart).toBeGreaterThan(-1);
    expect(bodyEnd).toBeGreaterThan(bodyStart);
    const body = curl.slice(bodyStart + 1, bodyEnd + 1);
    const parsed = JSON.parse(body);
    expect(parsed.caller_id).toBeDefined();
    expect(parsed.publisher_id).toBeDefined();
  });
});

describe("generateShareSlug", () => {
  it("kebab-cases the integration name and appends a random suffix", () => {
    const slug = generateShareSlug("ABC Media — HVAC!");
    expect(slug.startsWith("abc-media-hvac-")).toBe(true);
    expect(slug.length).toBeGreaterThan("abc-media-hvac-".length);
  });

  it("falls back to a placeholder base when name has no alphanumerics", () => {
    const slug = generateShareSlug("???");
    expect(slug.startsWith("publisher-link-")).toBe(true);
  });
});

describe("parseHashRoute", () => {
  it("returns null for non-spec hashes", () => {
    expect(parseHashRoute("")).toBeNull();
    expect(parseHashRoute("#/something")).toBeNull();
    expect(parseHashRoute("#/p/")).toBeNull();
  });

  it("extracts slug and optional src param", () => {
    expect(parseHashRoute("#/p/my-slug")).toEqual({
      type: "publisher-spec",
      slug: "my-slug"
    });
    expect(parseHashRoute("#/p/my-slug?src=src_abc")).toEqual({
      type: "publisher-spec",
      slug: "my-slug",
      sourceId: "src_abc"
    });
  });

  it("decodes the src param", () => {
    expect(parseHashRoute("#/p/x?src=hello%20world")).toEqual({
      type: "publisher-spec",
      slug: "x",
      sourceId: "hello world"
    });
  });
});
