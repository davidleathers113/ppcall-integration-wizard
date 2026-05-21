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
  },
  direct_number: {
    name: "Direct Number Target",
    config: {
      buyerDestinationKind: "direct_number",
      destinationMode: "static_number",
      destination: {
        number: "+18005551212"
      },
      destinationNumber: "+18005551212",
      callHandling: {
        connectionTimeoutSeconds: 30,
        revenueRecovery: "buyer_default"
      },
      dialIvr: {
        enabled: false,
        digits: ""
      },
      recordingSettings: { mode: "account_default" },
      schedule: {
        timezone: "America/New_York",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        startTime: "00:00",
        endTime: "23:59",
        mode: "always_open"
      },
      caps: {
        capOn: "converted_calls",
        daily: 100,
        concurrency: 5
      },
      capUsage: {
        dailyUsed: 0,
        currentConcurrency: 0
      },
      duplicateRules: { mode: "buyer_default" },
      shareableTags: { mode: "buyer_default" },
      predictiveRouting: {
        mode: "campaign_default",
        priorityBump: 0
      },
      payout: 35,
      conversionDurationSeconds: 120
    }
  },
  direct_sip: {
    name: "Direct SIP Target",
    config: {
      buyerDestinationKind: "direct_sip",
      destinationMode: "static_sip",
      destination: {
        sipAddress: "sip:buyer@example.com",
        sipHeaders: {}
      },
      sipAddress: "sip:buyer@example.com",
      callHandling: {
        connectionTimeoutSeconds: 30,
        revenueRecovery: "buyer_default"
      },
      dialIvr: {
        enabled: false,
        digits: ""
      },
      recordingSettings: { mode: "account_default" },
      schedule: {
        timezone: "America/New_York",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        startTime: "00:00",
        endTime: "23:59",
        mode: "always_open"
      },
      caps: {
        capOn: "converted_calls",
        daily: 100,
        concurrency: 5
      },
      capUsage: {
        dailyUsed: 0,
        currentConcurrency: 0
      },
      duplicateRules: { mode: "buyer_default" },
      shareableTags: { mode: "buyer_default" },
      predictiveRouting: {
        mode: "campaign_default",
        priorityBump: 0
      },
      payout: 35,
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
      publisherId: "pub_abc",
      requiredFields: ["caller_id", "zip"],
      expiresInSeconds: 30,
      shareableSpec: {
        slug: "abc-media-hvac-demo",
        createdAt: "2026-05-01T09:00:00Z",
        createdBy: "Sarah",
        defaultSourceId: "src_abc_google",
        notes: "Hi! Send each unique call once. The endpoint will respond within ~250ms with a routing destination. Reach out if anything looks off."
      },
      publisherSources: [
        {
          id: "src_abc_google",
          name: "Google Search",
          publisherId: "pub_abc",
          sourceId: "google_search",
          subAffiliateId: "sub_google_01",
          status: "active",
          requiredFields: ["caller_id", "zip"],
          postingUrl: "https://mock-ppcall.local/rtb/camp_hvac/pub_abc/google",
          caps: { daily: 300, hourly: 40 },
          payoutOverride: 28,
          lastUsedAt: "2026-05-19T14:20:00Z",
          usageCount: 760,
          errorRate: 0.01
        },
        {
          id: "src_abc_facebook",
          name: "Facebook Lead Ads",
          publisherId: "pub_abc",
          sourceId: "facebook",
          subAffiliateId: "sub_fb_22",
          status: "active",
          requiredFields: ["caller_id", "zip", "state"],
          postingUrl: "https://mock-ppcall.local/rtb/camp_hvac/pub_abc/facebook",
          caps: { daily: 200, hourly: 25 },
          lastUsedAt: "2026-05-18T16:00:00Z",
          usageCount: 390,
          errorRate: 0.03
        },
        {
          id: "src_abc_native",
          name: "Native Display",
          publisherId: "pub_abc",
          sourceId: "native",
          subAffiliateId: "sub_native_08",
          status: "dormant",
          requiredFields: ["caller_id", "zip"],
          postingUrl: "https://mock-ppcall.local/rtb/camp_hvac/pub_abc/native",
          caps: { daily: 100 },
          lastUsedAt: "2026-05-08T09:00:00Z",
          usageCount: 100,
          errorRate: 0.04
        }
      ]
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
    config: {
      ...PRESETS.ringba_rtb.config,
      url: "https://premier-home-services.example/ping",
      routing: { strategy: "priority", fallbackTargetId: "target_premier_after_hours" },
      buyerTargets: [
        {
          id: "target_premier_tampa",
          name: "Tampa RTB Endpoint",
          status: "active",
          priority: 1,
          weight: 70,
          type: "rtb",
          config: {
            ...PRESETS.ringba_rtb.config,
            url: "https://premier-home-services.example/tampa/ping"
          },
          caps: { daily: 500, hourly: 60 },
          schedule: { timezone: "America/New_York", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "08:00", endTime: "18:00" },
          lastTestedAt: "2026-05-19T10:00:00Z",
          lastSuccessfulTestAt: "2026-05-19T10:00:00Z",
          lastUsedAt: "2026-05-19T15:10:00Z",
          usageCount: 520,
          errorRate: 0.03
        },
        {
          id: "target_premier_orlando",
          name: "Orlando Static Number",
          status: "active",
          priority: 2,
          weight: 20,
          type: "static_number",
          config: {
            destinationNumber: "+14075550123",
            payout: 30,
            conversionDurationSeconds: 90
          },
          caps: { daily: 120 },
          lastTestedAt: "2026-05-18T13:00:00Z",
          lastSuccessfulTestAt: "2026-05-18T13:00:00Z",
          lastUsedAt: "2026-05-19T12:00:00Z",
          usageCount: 230,
          errorRate: 0.02
        },
        {
          id: "target_premier_after_hours",
          name: "After Hours SIP Transfer",
          status: "test_passed",
          priority: 3,
          weight: 10,
          type: "sip",
          config: {
            sipAddress: "sip:afterhours@premier.example",
            payout: 22,
            conversionDurationSeconds: 120
          },
          schedule: { timezone: "America/New_York", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], startTime: "18:00", endTime: "08:00" },
          lastTestedAt: "2026-05-18T21:00:00Z",
          lastSuccessfulTestAt: "2026-05-18T21:00:00Z",
          usageCount: 90,
          errorRate: 0
        }
      ]
    },
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
      destinationNumber: "+18885550101",
      publisherId: "pub_leadflow",
      requiredFields: ["caller_id"],
      publisherSources: [
        {
          id: "src_leadflow_seo",
          name: "SEO Calls",
          publisherId: "pub_leadflow",
          sourceId: "seo",
          status: "stale",
          requiredFields: ["caller_id"],
          postingUrl: "tel:+18885550101",
          lastUsedAt: "2026-03-10T11:00:00Z",
          usageCount: 45,
          errorRate: 0
        }
      ]
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
      url: "https://coastal-plumbing.api/ping",
      routing: { strategy: "weighted" },
      buyerTargets: [
        {
          id: "target_coastal_primary",
          name: "Primary Ping Endpoint",
          status: "failing",
          priority: 1,
          weight: 80,
          type: "generic_api",
          config: {
            ...PRESETS.generic_json_post.config,
            url: "https://coastal-plumbing.api/ping"
          },
          caps: { daily: 250 },
          lastTestedAt: "2026-05-18T10:00:00Z",
          lastUsedAt: "2026-05-18T10:05:00Z",
          usageCount: 180,
          errorRate: 0.45
        },
        {
          id: "target_coastal_backup",
          name: "Backup Static Number",
          status: "test_passed",
          priority: 2,
          weight: 20,
          type: "static_number",
          config: {
            destinationNumber: "+18885550999",
            payout: 18,
            conversionDurationSeconds: 60
          },
          lastTestedAt: "2026-05-17T08:00:00Z",
          lastSuccessfulTestAt: "2026-05-17T08:00:00Z",
          usageCount: 30,
          errorRate: 0
        }
      ]
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
      publisherId: "pub_search",
      requiredFields: ["caller_id", "state"],
      expiresInSeconds: 30,
      publisherSources: [
        {
          id: "src_search_ppc",
          name: "Search PPC",
          publisherId: "pub_search",
          sourceId: "ppc",
          subAffiliateId: "legal_search",
          status: "needs_testing",
          requiredFields: ["caller_id", "state"],
          postingUrl: "https://mock-ppcall.local/rtb/camp_ssdi/pub_search/ppc",
          usageCount: 0,
          errorRate: 0
        }
      ]
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
    config: {
      ...PRESETS.sip_endpoint.config,
      buyerTargets: [
        {
          id: "target_disability_intake",
          name: "Main Intake SIP",
          status: "test_passed",
          priority: 1,
          weight: 100,
          type: "sip",
          config: PRESETS.sip_endpoint.config,
          lastTestedAt: "2026-03-21T11:30:00Z",
          lastSuccessfulTestAt: "2026-03-21T11:30:00Z",
          usageCount: 0,
          errorRate: 0
        }
      ]
    },
    createdAt: "2026-03-21T11:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-03-21T11:00:00Z",
    updatedBy: "Sarah",
    lastTestedAt: "2026-03-21T11:30:00Z",
    lastSuccessfulTestAt: "2026-03-21T11:30:00Z",
    usageCount: 0,
    errorRate: 0.0
  },
  {
    id: "int_direct_number_acme",
    campaignId: "camp_hvac",
    name: "Acme HVAC Direct Number",
    direction: "buyer",
    type: "static_number",
    platformPreset: "direct_number",
    status: "active",
    config: {
      buyerDestinationKind: "direct_number",
      destinationMode: "static_number",
      destination: { number: "+18005551313" },
      destinationNumber: "+18005551313",
      callHandling: {
        connectionTimeoutSeconds: 30,
        revenueRecovery: "buyer_default"
      },
      recordingSettings: { mode: "account_default" },
      schedule: {
        timezone: "America/New_York",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        startTime: "08:00",
        endTime: "18:00",
        mode: "basic"
      },
      caps: {
        capOn: "converted_calls",
        daily: 150,
        concurrency: 6
      },
      capUsage: {
        dailyUsed: 47,
        currentConcurrency: 2
      },
      duplicateRules: { mode: "buyer_default" },
      shareableTags: { mode: "buyer_default" },
      predictiveRouting: {
        mode: "campaign_default",
        priorityBump: 0
      },
      payout: 38,
      conversionDurationSeconds: 120
    },
    createdAt: "2026-04-02T09:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-04-02T09:00:00Z",
    updatedBy: "Sarah",
    activatedAt: "2026-04-02T10:00:00Z",
    lastTestedAt: "2026-04-02T09:30:00Z",
    lastSuccessfulTestAt: "2026-04-02T09:30:00Z",
    lastUsedAt: "2026-05-19T13:00:00Z",
    usageCount: 412,
    errorRate: 0.01
  },
  {
    id: "int_direct_sip_intake",
    campaignId: "camp_ssdi",
    name: "Disability Intake Direct SIP",
    direction: "buyer",
    type: "sip",
    platformPreset: "direct_sip",
    status: "test_passed",
    config: {
      buyerDestinationKind: "direct_sip",
      destinationMode: "static_sip",
      destination: {
        sipAddress: "sip:intake@disability-intake.example",
        sipHeaders: { "X-Source": "ppcall-studio" }
      },
      sipAddress: "sip:intake@disability-intake.example",
      callHandling: {
        connectionTimeoutSeconds: 25,
        revenueRecovery: "buyer_default"
      },
      recordingSettings: { mode: "enabled" },
      schedule: {
        timezone: "America/Chicago",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        startTime: "09:00",
        endTime: "20:00",
        mode: "basic"
      },
      caps: {
        capOn: "converted_calls",
        daily: 75,
        concurrency: 4
      },
      capUsage: {
        dailyUsed: 0,
        currentConcurrency: 0
      },
      duplicateRules: { mode: "restrict", windowMinutes: 1440 },
      shareableTags: {
        mode: "override",
        shareInboundCallId: true,
        tags: ["caller_id", "zip", "state"]
      },
      predictiveRouting: {
        mode: "estimated_revenue",
        priorityBump: 2
      },
      payout: 42,
      conversionDurationSeconds: 150
    },
    createdAt: "2026-05-10T10:00:00Z",
    createdBy: "Sarah",
    updatedAt: "2026-05-10T10:00:00Z",
    updatedBy: "Sarah",
    lastTestedAt: "2026-05-10T10:15:00Z",
    lastSuccessfulTestAt: "2026-05-10T10:15:00Z",
    usageCount: 0,
    errorRate: 0
  }
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "evt_1", integrationId: "int_2", campaignId: "camp_hvac", eventType: "created", message: "Sarah created Premier Home Services RTB.", createdAt: "2026-01-11T11:00:00Z", actor: "Sarah" },
  { id: "evt_2", integrationId: "int_2", campaignId: "camp_hvac", eventType: "tested", message: "Test passed in 412ms.", createdAt: "2026-01-11T11:15:00Z", actor: "System" },
  { id: "evt_3", integrationId: "int_2", campaignId: "camp_hvac", eventType: "activated", message: "Integration activated.", createdAt: "2026-01-12T10:00:00Z", actor: "Sarah" },
  { id: "evt_4", integrationId: "int_4", campaignId: "camp_plumbing", eventType: "failed", message: "Integration failed: 404 Not Found from buyer endpoint.", createdAt: "2026-05-18T10:05:00Z", actor: "System" },
  { id: "evt_5", integrationId: "int_3", campaignId: "camp_plumbing", eventType: "marked_stale", message: "Integration marked stale: no traffic in 30+ days.", createdAt: "2026-05-15T00:00:00Z", actor: "System" }
];
