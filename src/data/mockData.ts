import type { Campaign, Integration, ActivityEvent, IntegrationConfig } from "../models/appTypes";

export const PRESETS: Record<string, { name: string; config: IntegrationConfig }> = {
  ringba_rtb: {
    name: "Ringba-style RTB",
    config: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      requestBody: {
        caller_id: "{{caller_id}}",
        zip: "{{zip}}",
        state: "{{state}}",
        campaign_id: "{{campaign_id}}"
      },
      responseParsing: {
        acceptedPath: "$.accepted",
        acceptedValue: true,
        destinationNumberPath: "$.phone_number",
        bidPath: "$.bid",
        rejectReasonPath: "$.reason"
      },
      timeoutSeconds: 3
    }
  },
  retreaver_rtb: {
    name: "Retreaver-style RTB",
    config: {
      method: "GET",
      queryParams: {
        caller_id: "{{caller_id}}",
        zip: "{{zip}}",
        key: "REVER_API_KEY"
      },
      responseParsing: {
        acceptedPath: "$.status",
        acceptedValue: "ok",
        destinationNumberPath: "$.destination",
        bidPath: "$.payout"
      },
      timeoutSeconds: 3
    }
  },
  trackdrive_ping: {
    name: "TrackDrive-style Ping/Post",
    config: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      requestBody: {
        caller_id: "{{caller_id}}",
        zip: "{{zip}}",
        traffic_source_id: "{{publisher_id}}"
      },
      responseParsing: {
        acceptedPath: "$.success",
        acceptedValue: true,
        destinationNumberPath: "$.lead.phone_number",
        bidPath: "$.lead.payout"
      },
      timeoutSeconds: 3
    }
  },
  generic_json_post: {
    name: "Generic JSON POST",
    config: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      requestBody: {
        caller_id: "{{caller_id}}",
        zip: "{{zip}}"
      },
      responseParsing: {
        acceptedPath: "$.accepted",
        acceptedValue: true,
        destinationNumberPath: "$.phone_number"
      },
      timeoutSeconds: 3
    }
  },
  generic_get: {
    name: "Generic GET",
    config: {
      method: "GET",
      queryParams: {
        caller_id: "{{caller_id}}",
        zip: "{{zip}}"
      },
      responseParsing: {
        acceptedPath: "$.status",
        acceptedValue: "success",
        destinationNumberPath: "$.number"
      },
      timeoutSeconds: 3
    }
  },
  static_number: {
    name: "Static Number",
    config: {
      destinationNumber: "+18005550000",
      payout: 25,
      conversionDurationSeconds: 60
    }
  },
  sip_endpoint: {
    name: "SIP Endpoint",
    config: {
      sipAddress: "sip:transfer@example.com",
      payout: 30,
      conversionDurationSeconds: 120
    }
  }
};

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "camp_hvac", name: "HVAC Inbound", vertical: "Home Services", status: "active", createdAt: "2026-01-10T08:00:00Z" },
  { id: "camp_plumbing", name: "Plumbing Inbound", vertical: "Home Services", status: "active", createdAt: "2026-02-15T09:30:00Z" },
  { id: "camp_ssdi", name: "SSDI Transfers", vertical: "Legal", status: "paused", createdAt: "2026-03-20T10:00:00Z" }
];

export const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: "int_1",
    campaignId: "camp_hvac",
    name: "ABC Media HVAC",
    direction: "publisher",
    type: "rtb",
    platformPreset: "publisher_rtb",
    status: "active",
    config: {
      postingUrl: "https://mock-ppcall.local/rtb/camp_hvac/pub_abc",
      requiredFields: ["caller_id", "zip"],
      expiresInSeconds: 30
    },
    createdAt: "2026-01-11T09:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-01-11T09:00:00Z",
    updatedBy: "Sarah",
    activatedAt: "2026-01-12T10:00:00Z",
    lastTestedAt: "2026-01-11T09:30:00Z",
    lastSuccessfulTestAt: "2026-01-11T09:30:00Z",
    lastUsedAt: "2026-05-19T14:20:00Z",
    usageCount: 1250,
    errorRate: 0.02
  },
  {
    id: "int_2",
    campaignId: "camp_hvac",
    name: "Premier Home Services RTB",
    direction: "buyer",
    type: "rtb",
    platformPreset: "ringba_rtb",
    status: "active",
    config: PRESETS.ringba_rtb.config,
    createdAt: "2026-01-11T11:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-01-11T11:00:00Z",
    updatedBy: "Sarah",
    activatedAt: "2026-01-12T10:00:00Z",
    lastTestedAt: "2026-01-11T11:15:00Z",
    lastSuccessfulTestAt: "2026-01-11T11:15:00Z",
    lastUsedAt: "2026-05-19T15:10:00Z",
    usageCount: 840,
    errorRate: 0.05
  },
  {
    id: "int_3",
    campaignId: "camp_plumbing",
    name: "LeadFlow Plumbing",
    direction: "publisher",
    type: "static_number",
    platformPreset: "static_number",
    status: "stale",
    config: {
      destinationNumber: "+18885550101"
    },
    createdAt: "2026-02-16T10:00:00Z",
    createdBy: "Mike",
    updatedAt: "2026-02-16T10:00:00Z",
    updatedBy: "Mike",
    activatedAt: "2026-02-17T08:00:00Z",
    lastTestedAt: "2026-02-16T10:30:00Z",
    lastUsedAt: "2026-03-10T11:00:00Z",
    usageCount: 45,
    errorRate: 0.0
  },
  {
    id: "int_4",
    campaignId: "camp_plumbing",
    name: "Coastal Plumbing Buyer",
    direction: "buyer",
    type: "generic_api",
    platformPreset: "generic_json_post",
    status: "failing",
    config: {
      ...PRESETS.generic_json_post.config,
      url: "https://coastal-plumbing.api/ping"
    },
    createdAt: "2026-02-16T14:00:00Z",
    createdBy: "Mike",
    updatedAt: "2026-05-15T09:00:00Z",
    updatedBy: "Mike",
    activatedAt: "2026-02-17T08:00:00Z",
    lastTestedAt: "2026-05-18T10:00:00Z",
    lastUsedAt: "2026-05-18T10:05:00Z",
    usageCount: 210,
    errorRate: 0.45
  },
  {
    id: "int_5",
    campaignId: "camp_ssdi",
    name: "SearchCalls Legal",
    direction: "publisher",
    type: "rtb",
    platformPreset: "publisher_rtb",
    status: "needs_testing",
    config: {
      postingUrl: "https://mock-ppcall.local/rtb/camp_ssdi/pub_search",
      requiredFields: ["caller_id", "state"]
    },
    createdAt: "2026-03-21T09:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-03-21T09:00:00Z",
    updatedBy: "Sarah",
    usageCount: 0,
    errorRate: 0.0
  },
  {
    id: "int_6",
    campaignId: "camp_ssdi",
    name: "Disability Intake Group",
    direction: "buyer",
    type: "sip",
    platformPreset: "sip_endpoint",
    status: "test_passed",
    config: PRESETS.sip_endpoint.config,
    createdAt: "2026-03-21T11:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-03-21T11:00:00Z",
    updatedBy: "Sarah",
    lastTestedAt: "2026-03-21T11:30:00Z",
    lastSuccessfulTestAt: "2026-03-21T11:30:00Z",
    usageCount: 0,
    errorRate: 0.0
  }
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "evt_1", integrationId: "int_2", campaignId: "camp_hvac", eventType: "created", message: "Sarah created Premier Home Services RTB.", createdAt: "2026-01-11T11:00:00Z", actor: "Sarah" },
  { id: "evt_2", integrationId: "int_2", campaignId: "camp_hvac", eventType: "tested", message: "Test passed in 412ms.", createdAt: "2026-01-11T11:15:00Z", actor: "System" },
  { id: "evt_3", integrationId: "int_2", campaignId: "camp_hvac", eventType: "activated", message: "Integration activated.", createdAt: "2026-01-12T10:00:00Z", actor: "Sarah" },
  { id: "evt_4", integrationId: "int_4", campaignId: "camp_plumbing", eventType: "failed", message: "Integration failed: 404 Not Found from buyer endpoint.", createdAt: "2026-05-18T10:05:00Z", actor: "System" },
  { id: "evt_5", integrationId: "int_3", campaignId: "camp_plumbing", eventType: "marked_stale", message: "Integration marked stale: no traffic in 30+ days.", createdAt: "2026-05-15T00:00:00Z", actor: "System" }
];
