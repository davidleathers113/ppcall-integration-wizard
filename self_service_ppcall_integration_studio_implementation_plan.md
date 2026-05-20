# Self-Service PPCall Integration Studio — Full Implementation Plan

## 1. Executive Summary

This implementation plan describes a mock self-service Pay-Per-Call (PPCall) integration environment that allows clients to configure publisher/supplier and buyer/destination integrations without relying on internal operations or engineering teams.

The current operational bottleneck is that every new publisher or buyer integration requires the platform company to manually configure routing, endpoints, fields, response parsing, testing, and troubleshooting. The goal of this feature is to convert those manual operational tasks into a self-service product workflow.

The mock environment should demonstrate how users can:

- Create and manage campaigns.
- Add publishers/suppliers to campaigns.
- Generate publisher integration instructions.
- Add buyers/destinations to campaigns.
- Configure buyer integrations from buyer-provided instructions.
- Use platform presets for known PPCall systems.
- Edit integrations through forms, raw JSON, wizards, API-style examples, and an AI assistant.
- Test each integration before activation.
- Bulk import multiple integrations.
- Track when integrations were created, tested, activated, used, failed, or became stale.
- Identify stale, dormant, unused, failing, and needs-retest integrations.

The mock product should be called:

**Self-Service PPCall Integration Studio**

This should be a clickable prototype, not a production telecom platform. It should not integrate with live Ringba, Retreaver, TrackDrive, CallGrid, carriers, SIP providers, or external APIs. The goal is to demonstrate the product concept, user workflows, data model, testing logic, and integration abstraction layers.

---

## 2. Product Objective

The product objective is to let clients perform integrations themselves through a safe, guided, testable, auditable interface.

A user should be able to complete two primary workflows:

### Publisher/Supplier Workflow

When a client brings on a new publisher or supplier, they should be able to:

1. Select a campaign.
2. Add the publisher/supplier.
3. Choose the integration method.
4. Generate integration instructions.
5. Copy or send those instructions to the publisher.
6. Test whether the publisher can successfully send calls or RTB requests into the campaign.
7. Monitor publisher usage and freshness over time.

### Buyer/Destination Workflow

When a client brings on a new buyer, they should be able to:

1. Select a campaign.
2. Add the buyer/destination.
3. Choose the buyer integration type.
4. Choose a known platform preset or generic method.
5. Enter buyer-provided instructions.
6. Map required fields.
7. Configure request method, URL, headers, body, and query parameters.
8. Configure response parsing.
9. Test the integration.
10. Activate the buyer only after the test passes.
11. Monitor whether the buyer integration is used, stale, failing, or needs retesting.

---

## 3. Core Product Principle

The product should be built around this principle:

> Every integration should be template-driven, testable, observable, importable, exportable, auditable, and editable across multiple abstraction layers.

A second principle is equally important:

> Layer 2 raw JSON configuration should be the source of truth. All other interfaces should create, validate, modify, or explain that same JSON configuration.

---

## 4. Integration Abstraction Layers

The product should demonstrate five abstraction layers.

| Layer | Interface | Purpose | Target User |
|---|---|---|---|
| Layer 1 | Source code / API-style access | Programmatic control and developer automation | Developers, advanced teams |
| Layer 2 | Raw JSON config | Portable integration definition and source of truth | Technical operators, developers |
| Layer 3 | UI fields and dropdowns | Safe form-based editing | Normal operators |
| Layer 4 | Interactive wizard with presets | Guided self-service setup | Most users |
| Layer 5 | AI conversation with integration assistant | Fastest path from instructions to config | Non-technical and semi-technical users |

## 4.1 Layer 1 — Source Code / API-Style Access

This layer should show how a developer could use an API to create, test, and inspect integrations.

Example mock endpoints:

```http
POST /api/integrations
GET /api/integrations/:id
PATCH /api/integrations/:id
POST /api/integrations/:id/test
POST /api/integrations/:id/activate
GET /api/integrations/:id/activity
POST /api/bulk-import
```

The API page does not need a real backend. It should display realistic documentation and example payloads.

## 4.2 Layer 2 — Raw JSON Config

Each integration should be stored as a normalized JSON configuration. This config is the source of truth.

Example buyer integration config:

```json
{
  "method": "POST",
  "url": "https://buyer.example.com/ping",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestBody": {
    "caller_id": "{{caller_id}}",
    "zip": "{{zip}}",
    "state": "{{state}}",
    "campaign_id": "{{campaign_id}}"
  },
  "responseParsing": {
    "acceptedPath": "$.accepted",
    "acceptedValue": true,
    "destinationNumberPath": "$.phone_number",
    "bidPath": "$.bid",
    "conversionDurationPath": "$.duration",
    "rejectReasonPath": "$.reason"
  },
  "timeoutSeconds": 3,
  "expiresInSeconds": 30
}
```

The raw JSON editor should allow advanced users to inspect and edit the full integration config.

## 4.3 Layer 3 — UI Fields and Dropdowns

The form UI should expose the JSON configuration through safe text fields, dropdowns, toggles, and validation messages.

Example fields:

- Integration name
- Direction: publisher or buyer
- Type: static number, RTB, SIP, webhook, generic API
- Platform preset
- Method: GET or POST
- URL
- Headers
- Query parameters
- Request body
- Required tokens
- Response parser paths
- Timeout
- Caps
- Schedule
- Conversion duration
- Payout
- Status

## 4.4 Layer 4 — Interactive Wizard With Presets

This should be the primary interface.

The wizard should guide users through:

1. Choosing integration direction.
2. Choosing integration type.
3. Choosing a platform preset.
4. Configuring required fields.
5. Mapping tokens.
6. Testing the integration.
7. Activating the integration.

Presets should include:

- Ringba-style RTB
- Retreaver-style RTB
- TrackDrive-style ping/post
- CallGrid-style RTB
- Generic JSON POST
- Generic GET
- Static number
- SIP endpoint
- Webhook postback

## 4.5 Layer 5 — AI Integration Assistant

The mock should include an AI-style integration assistant. It does not need to call a real LLM. It can use rule-based extraction and prefilled examples.

The user should be able to paste instructions like:

```text
POST to https://buyer.example.com/ping with caller_id, zip, and state.
If accepted=true, use phone_number as the transfer destination.
Bid is returned as payout.
Reject reason is returned as reason.
```

The assistant should output:

- Extracted method
- Extracted URL
- Required fields
- Proposed request body
- Proposed response parser
- Confidence level
- Warnings
- Button to apply the generated config

The AI assistant should update the same canonical JSON config used by the wizard, form UI, and JSON editor.

---

## 5. Core Product Workflows

## 5.1 Publisher/Supplier Integration Workflow

### Goal

Allow a client to add a supplier/publisher to a campaign and generate integration instructions that tell the publisher how to send traffic.

### Flow

1. User selects a campaign.
2. User clicks **Add Publisher**.
3. User enters publisher name.
4. User chooses integration type:
   - Static inbound number
   - RTB endpoint
   - SIP endpoint
   - Webhook postback
5. System generates publisher ID.
6. System generates tracking number, posting URL, SIP address, or webhook endpoint.
7. System displays required fields.
8. System displays sample request.
9. System displays sample accepted response.
10. System displays sample rejected response.
11. User runs a publisher test.
12. System shows test result and checklist.
13. User copies or sends instructions.
14. Publisher integration is marked as test passed, active, needs testing, or failing.

### Publisher Instructions Should Include

- Publisher name
- Campaign name
- Publisher ID
- Integration type
- Posting URL, phone number, or SIP endpoint
- Required fields
- Optional fields
- Caller ID requirements
- ZIP/state requirements
- Bid expiration timing if RTB is used
- Sample request
- Sample accepted response
- Sample rejected response
- Error code explanations
- Testing instructions

### Example Publisher RTB Instructions

```json
{
  "postingUrl": "https://mock-ppcall-platform.local/rtb/campaign/camp_123",
  "requiredFields": ["caller_id", "zip", "publisher_id"],
  "acceptedResponse": {
    "accepted": true,
    "phone_number": "+18005551212",
    "payout": 35,
    "expires_in_seconds": 30
  },
  "rejectedResponse": {
    "accepted": false,
    "reason": "no_buyer_available"
  }
}
```

---

## 5.2 Buyer/Destination Integration Workflow

### Goal

Allow a client to configure where campaign calls should be routed when a buyer provides integration instructions.

### Flow

1. User selects a campaign.
2. User clicks **Add Buyer**.
3. User enters buyer name.
4. User chooses buyer route type:
   - Static number
   - RTB ping/post
   - SIP
   - Generic GET
   - Generic JSON POST
   - Webhook postback
5. User chooses a preset.
6. User enters endpoint URL or destination number.
7. User maps request fields.
8. User configures response parsing.
9. User configures timeout.
10. User configures payout, bid, conversion duration, or dynamic payout parsing.
11. User configures caps and schedule.
12. User tests the integration.
13. System displays request preview, raw response, parsed response, checklist, and suggested fixes.
14. If test passes, user can activate.
15. If test fails, activation is blocked until required issues are fixed.

### Buyer Integration Configuration Should Support

- Method: GET or POST
- URL
- Headers
- Query parameters
- JSON body
- Form body
- Token mappings
- Response parser
- Accepted/rejected logic
- Destination number or SIP parsing
- Bid parsing
- Conversion duration parsing
- Expiration seconds parsing
- Rejection reason parsing
- Timeout
- Caps
- Schedule
- Payout logic
- Conversion logic
- Status

---

## 6. Core Screens

## 6.1 Dashboard

The dashboard should give an at-a-glance view of campaign and integration health.

### Summary Cards

- Active integrations
- Need testing
- Failing integrations
- Stale integrations
- Dormant integrations
- Active but unused integrations
- Used this week
- Recent test failures

### Dashboard Sections

- Recent campaigns
- Recent integrations
- Stale integration warnings
- Failing integration warnings
- Recent activity feed
- Integrations needing retest

---

## 6.2 Campaigns Page

The campaigns page should list all mock campaigns.

### Campaign Fields

- Campaign name
- Vertical
- Status
- Number of publishers
- Number of buyers
- Total integrations
- Stale integrations
- Last activity

### Actions

- Create campaign
- View campaign
- Add publisher
- Add buyer
- Open campaign tests
- View campaign activity

---

## 6.3 Campaign Detail Page

The campaign detail page should use tabs.

### Tabs

1. Overview
2. Publishers
3. Buyers
4. Routing
5. Tests
6. Activity

### Overview Tab

Show:

- Campaign name
- Vertical
- Status
- Publisher count
- Buyer count
- Active routes
- Recent usage
- Stale/failing warnings

### Publishers Tab

Show:

- Publisher integrations connected to the campaign
- Status
- Last used
- Last tested
- Usage count
- Error rate
- Integration type
- Actions

### Buyers Tab

Show:

- Buyer integrations connected to the campaign
- Status
- Route type
- Platform preset
- Last used
- Last tested
- Usage count
- Error rate
- Actions

### Routing Tab

Show a mock routing view:

- Buyer priority
- Buyer caps
- Buyer schedules
- Active/inactive routes
- Fallback behavior
- Rejection reason summary

### Tests Tab

Show recent test runs:

- Integration name
- Test status
- Response time
- Checklist result
- Test date

### Activity Tab

Show all campaign-level activity events.

---

## 6.4 Publisher Integration Page

This page is for a single publisher/supplier integration.

### Sections

1. Summary card
2. Generated instructions
3. Required fields
4. Sample request
5. Sample accepted response
6. Sample rejected response
7. Test console
8. Freshness and usage
9. Activity history
10. Raw JSON config

### Required Capabilities

- Copy integration instructions
- Copy posting URL
- Copy sample request
- Copy sample response
- Run test
- Activate/pause/archive
- View status and freshness

---

## 6.5 Buyer Integration Page

This page is for a single buyer/destination integration.

### Sections

1. Summary card
2. Configuration form
3. Token mapping
4. Response parsing
5. Caps and schedule
6. Conversion logic
7. Test console
8. Raw JSON editor
9. Freshness and usage
10. Activity history

### Required Capabilities

- Edit form fields
- Edit raw JSON
- Choose preset
- Run test
- Activate only after passing test
- Pause/archive
- View stale/failing status
- View activity

---

## 6.6 Add Integration Wizard

The wizard is the primary UX.

### Step 1 — Choose Direction

Options:

- Publisher/Supplier
- Buyer/Destination

### Step 2 — Choose Integration Type

Options:

- Static number
- RTB ping/post
- SIP
- Webhook postback
- Generic API

### Step 3 — Choose Preset

Options:

- Ringba-style RTB
- Retreaver-style RTB
- TrackDrive-style ping/post
- CallGrid-style RTB
- Generic JSON POST
- Generic GET
- Static number
- SIP endpoint
- Webhook postback

### Step 4 — Configure Fields

For buyer integrations, collect:

- Method
- URL
- Headers
- Request body or query parameters
- Required tokens
- Response parser
- Timeout
- Conversion duration
- Bid path
- Reject reason path
- Caps
- Schedule

For publisher integrations, generate/display:

- Posting URL or static number
- Publisher ID
- Required fields
- Sample request
- Sample response
- Expiration seconds
- Caller ID requirements

### Step 5 — Test

Run the mock integration test and display:

- Request preview
- Resolved tokens
- Simulated raw response
- Parsed result
- Checklist
- Suggested fixes

### Step 6 — Activate

Activation should be blocked unless required test checks pass.

---

## 6.7 Bulk Import Page

The bulk import page allows users to create multiple integrations at once.

### Supported Input Methods

- CSV paste area
- JSON paste area
- File upload UI placeholder
- Template download button placeholder
- Clone from existing campaign placeholder

### Bulk Import Fields

Example CSV headers:

```csv
integration_name,type,direction,campaign,publisher_or_buyer,platform_preset,method,url,destination_number,payout,timeout_seconds,status
```

### Validation Results

The importer should validate each row and display:

- Ready to import
- Warning
- Error

### Example Validation Messages

- Missing URL
- Invalid integration type
- Missing campaign
- Missing destination number
- Missing response parser
- Missing publisher or buyer name
- Timeout too high
- Ready to import

### Import Summary Example

```text
7 ready to import
2 warnings
1 error
```

### Bulk Import Behavior

The mock should allow users to:

- Paste CSV
- Parse rows
- Show validation preview
- Import valid rows
- Show failed rows separately
- Download or copy error report placeholder

---

## 6.8 Test Console

The test console is one of the most important pieces of the mock.

Every integration should have a meaningful testing experience.

### Test Console Should Show

- Test input values
- Resolved token values
- Request URL
- HTTP method
- Headers
- Request body
- Query parameters
- Simulated raw response
- Parsed accepted/rejected status
- Parsed destination number or SIP
- Parsed bid
- Parsed conversion duration
- Parsed rejection reason
- Response time
- Pass/fail checklist
- Suggested fixes

### Buyer Test Checklist

- Endpoint URL present
- HTTP method selected
- Caller ID mapped
- ZIP mapped
- State mapped if required
- Response received
- Accepted value parsed
- Destination number parsed
- Bid parsed
- Conversion duration configured or parsed
- Response time under timeout threshold

### Publisher Test Checklist

- Campaign exists
- Campaign is active or testable
- Publisher ID exists
- Required fields present
- Caller ID present
- ZIP present
- Mock buyer route available
- Accepted response generated
- Response returned before expiration

### Suggested Fix Examples

- Add a URL before testing this buyer integration.
- Map caller_id to an internal token.
- ZIP is required for this preset but is not mapped.
- Destination number path is missing.
- Timeout is too high for RTB routing.
- This integration was edited after the last successful test and needs retesting.

---

## 6.9 Freshness and Staleness View

Each integration should display freshness and activity metadata.

### Metadata to Track

- Created at
- Created by
- Updated at
- Updated by
- Activated at
- Last tested at
- Last successful test at
- Last used at
- Last successful call at
- Last failed attempt at
- Usage count
- Error rate
- Days since last use
- Days since last successful test

### Status Definitions

| Status | Meaning |
|---|---|
| Draft | Created but not fully configured |
| Needs Testing | Configured but not tested |
| Test Passed | Last test passed but not active |
| Active | Active and recently used |
| Active but Unused | Active, but usage count is 0 |
| Dormant | Active but not used in 7+ days |
| Stale | Active but not used in 30+ days |
| Needs Retest | Edited after last successful test |
| Failing | Error rate above threshold or recent test failed |
| Paused | Manually paused |
| Archived | No longer used |

### Suggested Freshness Rules

```text
Active but Unused: active and usage_count = 0
Dormant: active and last_used_at is older than 7 days
Stale: active and last_used_at is older than 30 days
Needs Retest: updated_at is later than last_successful_test_at
Failing: error_rate > 20% or most recent test failed
```

---

## 6.10 AI Integration Assistant Page

The AI assistant should simulate taking buyer or publisher instructions and turning them into a usable integration config.

### User Input

A textarea where the user can paste instructions.

Example:

```text
POST to https://buyer.example.com/ping with caller_id, zip, and state. If accepted=true, use phone_number as the transfer destination. Bid is returned as payout. Reject reason is returned as reason.
```

### Assistant Output

- Detected direction: buyer or publisher
- Detected method
- Detected URL
- Detected required fields
- Proposed request body
- Proposed response parser
- Confidence score
- Warnings
- Apply config button

### Example Generated Config

```json
{
  "method": "POST",
  "url": "https://buyer.example.com/ping",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestBody": {
    "caller_id": "{{caller_id}}",
    "zip": "{{zip}}",
    "state": "{{state}}"
  },
  "responseParsing": {
    "acceptedPath": "$.accepted",
    "acceptedValue": true,
    "destinationNumberPath": "$.phone_number",
    "bidPath": "$.payout",
    "rejectReasonPath": "$.reason"
  },
  "timeoutSeconds": 3
}
```

### Warnings Example

- No conversion duration was detected.
- No timeout was specified; defaulting to 3 seconds.
- No reject reason path was detected.
- No authentication headers were detected.

---

## 6.11 Developer/API Page

The developer page should show API-style documentation for the same integration system.

### Mock Endpoints

```http
POST /api/integrations
GET /api/integrations/:id
PATCH /api/integrations/:id
POST /api/integrations/:id/test
POST /api/integrations/:id/activate
GET /api/integrations/:id/activity
POST /api/bulk-import
```

### Example Create Integration Payload

```json
{
  "campaignId": "camp_hvac",
  "name": "Premier Home Services RTB",
  "direction": "buyer",
  "type": "rtb",
  "platformPreset": "generic_json_post",
  "config": {
    "method": "POST",
    "url": "https://buyer.example.com/ping",
    "headers": {
      "Content-Type": "application/json"
    },
    "requestBody": {
      "caller_id": "{{caller_id}}",
      "zip": "{{zip}}",
      "state": "{{state}}"
    },
    "responseParsing": {
      "acceptedPath": "$.accepted",
      "acceptedValue": true,
      "destinationNumberPath": "$.phone_number",
      "bidPath": "$.bid",
      "rejectReasonPath": "$.reason"
    },
    "timeoutSeconds": 3
  }
}
```

---

## 7. Data Model

## 7.1 Campaign

```ts
export type CampaignStatus = "draft" | "active" | "paused";

export interface Campaign {
  id: string;
  name: string;
  vertical: string;
  status: CampaignStatus;
  createdAt: string;
}
```

## 7.2 Integration

```ts
export type IntegrationDirection = "publisher" | "buyer";

export type IntegrationType =
  | "static_number"
  | "rtb"
  | "sip"
  | "webhook"
  | "generic_api";

export type IntegrationStatus =
  | "draft"
  | "needs_testing"
  | "test_passed"
  | "active"
  | "active_unused"
  | "dormant"
  | "stale"
  | "needs_retest"
  | "failing"
  | "paused"
  | "archived";

export interface Integration {
  id: string;
  campaignId: string;
  name: string;
  direction: IntegrationDirection;
  type: IntegrationType;
  platformPreset: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  activatedAt?: string;
  lastTestedAt?: string;
  lastSuccessfulTestAt?: string;
  lastUsedAt?: string;
  lastSuccessfulCallAt?: string;
  usageCount: number;
  errorRate: number;
}
```

## 7.3 Integration Config

```ts
export interface IntegrationConfig {
  method?: "GET" | "POST";
  url?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  destinationNumber?: string;
  sipAddress?: string;
  postingUrl?: string;
  requiredFields?: string[];
  acceptedResponse?: Record<string, unknown>;
  rejectedResponse?: Record<string, unknown>;
  responseParsing?: {
    acceptedPath?: string;
    acceptedValue?: string | boolean | number;
    destinationNumberPath?: string;
    sipAddressPath?: string;
    bidPath?: string;
    conversionDurationPath?: string;
    expiresInSecondsPath?: string;
    rejectReasonPath?: string;
  };
  timeoutSeconds?: number;
  expiresInSeconds?: number;
  payout?: number;
  conversionDurationSeconds?: number;
  caps?: {
    daily?: number;
    hourly?: number;
  };
  schedule?: {
    timezone: string;
    days: string[];
    startTime: string;
    endTime: string;
  };
}
```

## 7.4 Test Run

```ts
export interface TestChecklistItem {
  label: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

export interface TestRun {
  id: string;
  integrationId: string;
  status: "passed" | "failed";
  requestPreview: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
  parsedResult: Record<string, unknown>;
  checklist: TestChecklistItem[];
  responseTimeMs: number;
  createdAt: string;
}
```

## 7.5 Activity Event

```ts
export interface ActivityEvent {
  id: string;
  integrationId: string;
  eventType:
    | "created"
    | "updated"
    | "tested"
    | "activated"
    | "used"
    | "failed"
    | "paused"
    | "marked_stale";
  message: string;
  createdAt: string;
  actor: string;
}
```

---

## 8. Mock Presets

## 8.1 Generic JSON POST Buyer

```json
{
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestBody": {
    "caller_id": "{{caller_id}}",
    "zip": "{{zip}}",
    "state": "{{state}}",
    "campaign_id": "{{campaign_id}}"
  },
  "responseParsing": {
    "acceptedPath": "$.accepted",
    "acceptedValue": true,
    "destinationNumberPath": "$.phone_number",
    "bidPath": "$.bid",
    "conversionDurationPath": "$.duration",
    "rejectReasonPath": "$.reason"
  },
  "timeoutSeconds": 3
}
```

## 8.2 Generic GET Buyer

```json
{
  "method": "GET",
  "queryParams": {
    "caller_id": "{{caller_id}}",
    "zip": "{{zip}}",
    "state": "{{state}}"
  },
  "responseParsing": {
    "acceptedPath": "$.status",
    "acceptedValue": "accepted",
    "destinationNumberPath": "$.number",
    "bidPath": "$.payout",
    "rejectReasonPath": "$.reason"
  },
  "timeoutSeconds": 3
}
```

## 8.3 Static Number Buyer

```json
{
  "destinationNumber": "+18005551212",
  "conversionDurationSeconds": 120,
  "payout": 35
}
```

## 8.4 Publisher RTB

```json
{
  "postingUrl": "https://mock-ppcall-platform.local/rtb/campaign/{{campaign_id}}",
  "requiredFields": ["caller_id", "zip", "publisher_id"],
  "acceptedResponse": {
    "accepted": true,
    "phone_number": "+18005551212",
    "payout": 35,
    "expires_in_seconds": 30
  },
  "rejectedResponse": {
    "accepted": false,
    "reason": "no_buyer_available"
  }
}
```

## 8.5 SIP Buyer

```json
{
  "sipAddress": "sip:buyer@example.sip.provider.com",
  "conversionDurationSeconds": 120,
  "payout": 40
}
```

## 8.6 Webhook Postback

```json
{
  "method": "POST",
  "url": "https://partner.example.com/postback",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestBody": {
    "call_id": "{{call_id}}",
    "caller_id": "{{caller_id}}",
    "duration": "{{call_duration}}",
    "recording_url": "{{recording_url}}",
    "conversion": "{{conversion_status}}"
  },
  "timeoutSeconds": 3
}
```

---

## 9. Testing Simulation Logic

The mock should include a utility function that simulates integration testing.

## 9.1 Buyer Test Pass Conditions

A buyer integration test should pass if:

- URL exists for RTB/API/webhook integrations.
- Method exists for RTB/API/webhook integrations.
- Caller ID is mapped.
- ZIP is mapped when required.
- Response parser has `acceptedPath`.
- RTB buyer has destination number path or SIP path.
- Timeout is 5 seconds or less.
- Simulated response can be parsed successfully.

## 9.2 Buyer Test Failure Conditions

A buyer integration test should fail if:

- URL is missing.
- HTTP method is missing.
- Caller ID is missing.
- ZIP is missing when required.
- Response parsing is missing.
- Destination number cannot be parsed.
- Timeout is too high.
- Simulated response is rejected.

## 9.3 Publisher Test Pass Conditions

A publisher integration test should pass if:

- Campaign exists.
- Publisher ID exists.
- Required fields are present.
- Caller ID is present.
- ZIP is present.
- A mock buyer route is available.
- Accepted response can be generated.
- Response is returned before expiration.

## 9.4 Publisher Test Failure Conditions

A publisher integration test should fail if:

- Publisher ID is missing.
- Caller ID is missing.
- ZIP is missing.
- Campaign is unavailable.
- No mock buyer route is available.
- Required fields are missing.
- Response would exceed expiration window.

## 9.5 Simulated Accepted Response

```json
{
  "accepted": true,
  "phone_number": "+18005551212",
  "bid": 42,
  "duration": 120,
  "expires_in_seconds": 30
}
```

## 9.6 Simulated Rejected Response

```json
{
  "accepted": false,
  "reason": "zip_not_covered"
}
```

---

## 10. Activation Guardrails

The product should prevent users from activating broken integrations.

## 10.1 Buyer Activation Should Be Blocked If

- Integration has not been tested.
- Last test failed.
- URL is missing for API/RTB integrations.
- Method is missing for API/RTB integrations.
- Required tokens are missing.
- Response parser is missing.
- Destination number or SIP path is missing for RTB buyers.
- Timeout is too high.
- Integration was edited after last successful test.

## 10.2 Publisher Activation Should Be Blocked If

- Publisher ID is missing.
- Required fields are missing.
- Posting URL or static number is missing.
- Test has not passed.
- Integration was edited after last successful test.

## 10.3 Activation UI

The activation screen should show a readiness checklist:

```text
✅ Integration type selected
✅ Required fields mapped
✅ Response parser configured
✅ Test passed
✅ Last successful test is current
❌ Schedule missing
```

---

## 11. Token Mapping System

A central token picker should be available anywhere request bodies, query parameters, or instructions are configured.

## 11.1 Suggested Tokens

- `{{call_id}}`
- `{{caller_id}}`
- `{{inbound_number}}`
- `{{publisher_id}}`
- `{{campaign_id}}`
- `{{campaign_name}}`
- `{{zip}}`
- `{{state}}`
- `{{city}}`
- `{{sub_id}}`
- `{{click_id}}`
- `{{trusted_form}}`
- `{{jornaya}}`
- `{{call_start_time}}`
- `{{call_duration}}`
- `{{recording_url}}`
- `{{conversion_status}}`

## 11.2 Token Preview

When users configure a request body, they should be able to preview resolved values.

Template:

```json
{
  "caller_id": "{{caller_id}}",
  "zip": "{{zip}}"
}
```

Resolved preview:

```json
{
  "caller_id": "7275551234",
  "zip": "34655"
}
```

---

## 12. Freshness and Usage Tracking

The mock should make integration staleness visible.

## 12.1 Why This Matters

In PPCall operations, integrations often become stale because:

- A buyer stops accepting calls.
- A publisher stops sending traffic.
- A campaign changes.
- A buyer changes endpoint instructions.
- A platform migration leaves old integrations unused.
- A test was performed months ago but no real traffic has flowed.
- A buyer route silently fails due to response parser changes.

The product should help operators identify these situations quickly.

## 12.2 Freshness Indicators

Each integration should display:

- Last used date
- Days since last use
- Last test date
- Last successful test date
- Last edited date
- Whether edits happened after the last successful test
- Usage count
- Error rate
- Current freshness status

## 12.3 Freshness Status Logic

Pseudo-logic:

```ts
function calculateFreshnessStatus(integration: Integration): IntegrationStatus {
  if (integration.status === "paused" || integration.status === "archived") {
    return integration.status;
  }

  if (!integration.lastTestedAt) {
    return "needs_testing";
  }

  if (
    integration.lastSuccessfulTestAt &&
    new Date(integration.updatedAt) > new Date(integration.lastSuccessfulTestAt)
  ) {
    return "needs_retest";
  }

  if (integration.errorRate > 0.2) {
    return "failing";
  }

  if (integration.status === "active" && integration.usageCount === 0) {
    return "active_unused";
  }

  const daysSinceLastUse = getDaysSince(integration.lastUsedAt);

  if (integration.status === "active" && daysSinceLastUse >= 30) {
    return "stale";
  }

  if (integration.status === "active" && daysSinceLastUse >= 7) {
    return "dormant";
  }

  return integration.status;
}
```

---

## 13. Activity and Audit Trail

Every important user or system action should create an activity event.

## 13.1 Events to Track

- Integration created
- Integration updated
- Preset applied
- JSON edited
- Test run
- Test passed
- Test failed
- Integration activated
- Integration paused
- Integration archived
- Integration used
- Integration failed during use
- Integration marked stale
- Bulk import completed
- AI assistant proposed config
- AI config applied

## 13.2 Example Activity Feed

```text
May 19, 2026 10:42 AM — Sarah created Premier Home Services RTB.
May 19, 2026 10:45 AM — Sarah applied Generic JSON POST preset.
May 19, 2026 10:47 AM — Test failed: destination number path missing.
May 19, 2026 10:50 AM — Sarah updated response parser.
May 19, 2026 10:51 AM — Test passed in 412ms.
May 19, 2026 10:52 AM — Integration activated.
```

---

## 14. Recommended Technical Stack

The mock can be built with:

- React
- TypeScript
- Vite or Next.js
- Tailwind CSS
- shadcn-style components
- Local mock data
- localStorage persistence or in-memory state
- Optional JSON editor component
- Optional CSV parser utility

No real backend is required for the mock.

## 14.1 Suggested Project Structure

```text
src/
  components/
    layout/
    dashboard/
    campaigns/
    integrations/
    wizard/
    test-console/
    bulk-import/
    ai-assistant/
    developer/
    shared/
  data/
    mockCampaigns.ts
    mockIntegrations.ts
    mockActivity.ts
    presets.ts
  models/
    campaign.ts
    integration.ts
    testRun.ts
    activity.ts
  utils/
    testSimulation.ts
    freshness.ts
    tokenResolver.ts
    bulkImportValidator.ts
    aiInstructionParser.ts
  pages/ or app/
    dashboard
    campaigns
    integrations
    add-integration
    bulk-import
    test-console
    ai-assistant
    developer
```

---

## 15. Mock Data

Seed the app with sample data.

## 15.1 Campaigns

- HVAC Inbound
- Plumbing Inbound
- SSDI Transfers

## 15.2 Publishers

- ABC Media
- LeadFlow Partners
- SearchCalls Network

## 15.3 Buyers

- Premier Home Services
- Coastal Plumbing Buyer
- Disability Intake Group

## 15.4 Integration Status Mix

Include examples of:

- Active
- Needs Testing
- Test Passed
- Failing
- Stale
- Dormant
- Active but Unused
- Needs Retest
- Paused
- Archived

---

## 16. UX Requirements

The UI should feel like a clean SaaS admin product.

## 16.1 Navigation

Left sidebar navigation:

- Dashboard
- Campaigns
- Integrations
- Add Integration
- Bulk Import
- Test Console
- AI Assistant
- Developer/API
- Activity

## 16.2 Design Components

Use:

- Cards
- Tables
- Tabs
- Badges
- Accordions
- Stepper/wizard
- Toasts
- Copy buttons
- Empty states
- Inline validation
- Status banners
- Code blocks
- JSON editor area

## 16.3 Status Badge Examples

- Active
- Needs Testing
- Test Passed
- Failing
- Stale
- Dormant
- Active but Unused
- Needs Retest
- Paused
- Archived

## 16.4 Empty States

Empty states should explain what belongs there and what action to take.

Example:

```text
No buyers have been added to this campaign yet.
Add a buyer destination to start routing qualified calls.
```

---

## 17. Implementation Phases

## Phase 1 — Foundation

Build:

- App shell
- Sidebar navigation
- TypeScript models
- Mock data
- Presets
- Dashboard
- Campaign list
- Campaign detail shell

Goal:

Establish the product structure and data model.

## Phase 2 — Integration Management

Build:

- Integration list
- Integration detail page
- Buyer detail view
- Publisher detail view
- Raw JSON editor
- Form-based config editing

Goal:

Allow users to inspect and edit integrations.

## Phase 3 — Wizard

Build:

- Add Integration Wizard
- Direction selection
- Type selection
- Preset selection
- Configuration step
- Test step
- Activation step

Goal:

Demonstrate the main self-service setup workflow.

## Phase 4 — Test Console

Build:

- Test simulation utility
- Request preview
- Resolved token preview
- Simulated response
- Parsed result
- Checklist
- Suggested fixes
- Test history

Goal:

Make testing meaningful and clear.

## Phase 5 — Bulk Import

Build:

- CSV paste parser
- JSON paste parser
- Validation preview
- Row-level errors
- Import summary
- Mock import action

Goal:

Support one-by-one and multi-integration setup.

## Phase 6 — Freshness and Activity

Build:

- Freshness calculation utility
- Staleness indicators
- Activity feed
- Integration lifecycle events
- Dashboard stale/failing warnings

Goal:

Make integrations observable and auditable.

## Phase 7 — AI Assistant Mock

Build:

- Instruction paste area
- Rule-based instruction parser
- Proposed config output
- Confidence and warnings
- Apply config action

Goal:

Demonstrate Layer 5 AI-assisted setup.

## Phase 8 — Developer/API Page

Build:

- API documentation page
- Example endpoints
- Example payloads
- Example responses

Goal:

Demonstrate Layer 1 developer access.

---

## 18. AI Coding Agent Prompt

Use the following prompt with an AI coding agent.

```markdown
You are a senior full-stack product engineer and UX-minded prototype builder.

Build a mock self-service Pay-Per-Call integration management environment. This is not a real telecom platform and does not need to connect to live Ringba, Retreaver, TrackDrive, CallGrid, carriers, SIP providers, or external APIs. It should be a realistic clickable mock environment that demonstrates how a company could let its clients configure publisher/supplier and buyer integrations themselves.

Use a modern React/TypeScript stack. Prefer Next.js or Vite React, TypeScript, Tailwind, shadcn-style components, and local mock data. Use localStorage or in-memory mock data. Do not require a real database. Prioritize clean UX, believable product behavior, and clear implementation structure.

The mock product should be called:

Self-Service PPCall Integration Studio

Main objective:
Create a self-service environment where users can:
1. Create and view campaigns.
2. Add publisher/supplier integrations.
3. Generate publisher integration instructions.
4. Add buyer/destination integrations.
5. Configure integrations through multiple abstraction layers.
6. Test integrations with a meaningful mock test console.
7. Bulk import integrations.
8. See integration activity, usage, and freshness/staleness status.

Important concept:
The product should demonstrate five abstraction layers:

Layer 1: API/source-code style access
Layer 2: Raw JSON config
Layer 3: UI fields and dropdowns
Layer 4: Interactive wizard with presets
Layer 5: AI conversation-style integration assistant

Layer 2, the raw JSON config, should be the source of truth. The form UI, wizard, and AI assistant should all create or update the same JSON config object.

Core pages to build:

1. Dashboard
- Show summary cards:
  - Active integrations
  - Need testing
  - Failing
  - Stale
  - Used this week
- Show recent campaigns.
- Show recent integration activity.
- Show stale integration warnings.

2. Campaigns page
- List mock campaigns.
- Allow creating a new mock campaign.
- Each campaign should have:
  - name
  - vertical
  - status
  - number of publishers
  - number of buyers
  - total integrations
  - stale integrations

3. Campaign detail page
Tabs:
- Overview
- Publishers
- Buyers
- Routing
- Tests
- Activity

4. Publisher integration page
This is for adding suppliers/publishers to a campaign.
Show:
- Publisher name
- Campaign
- Integration type
- Generated static number or RTB endpoint
- Required fields
- Sample request
- Sample accepted response
- Sample rejected response
- Copyable integration instructions
- Test publisher integration button
- Last tested
- Last used
- Status
- Activity history

Publisher integration types:
- Static inbound number
- RTB endpoint
- SIP endpoint
- Webhook postback

5. Buyer integration page
This is for configuring where campaign calls are sent.
Show:
- Buyer name
- Campaign
- Buyer route type
- Platform preset
- Method
- URL
- Headers
- Request body or query params
- Token mappings
- Response parser
- Destination number path
- Bid path
- Conversion duration path
- Reject reason path
- Timeout
- Caps
- Schedule
- Status
- Raw JSON config
- Test console
- Activity history

Buyer integration types:
- Static number
- RTB ping/post
- SIP
- Generic GET
- Generic JSON POST
- Webhook postback

6. Add Integration Wizard
This should be the primary UX.
Wizard steps:
Step 1: Choose direction
- Publisher/Supplier
- Buyer/Destination

Step 2: Choose integration type
- Static number
- RTB ping/post
- SIP
- Webhook postback
- Generic API

Step 3: Choose preset
Include these presets:
- Ringba-style RTB
- Retreaver-style RTB
- TrackDrive-style ping/post
- CallGrid-style RTB
- Generic JSON POST
- Generic GET
- Static number

Step 4: Configure required fields
For buyer integrations:
- method
- URL
- headers
- request body
- required tokens
- response parser
- timeout
- conversion duration
- bid path
- reject reason path

For publisher integrations:
- generated posting URL or number
- required fields
- publisher ID
- sample request
- sample response
- expiration seconds

Step 5: Test
Run a mock integration test and show the full test console.

Step 6: Activate
Do not allow activation unless the integration has passed the required test checks.

7. Bulk Import page
Support mock bulk import through:
- CSV paste area
- JSON paste area
- file upload UI placeholder
- template download button placeholder
- validation preview
- import summary

Bulk import should validate rows and show:
- ready to import
- warnings
- errors

Example fields:
integration_name,type,direction,campaign,publisher_or_buyer,platform_preset,method,url,destination_number,payout,timeout_seconds,status

Show row-level validation messages like:
- Missing URL
- Invalid integration type
- Missing campaign
- Missing destination number
- Missing response parser
- Ready to import

8. Test Console
This is very important.
Every integration should have a meaningful test console that shows:
- test input values
- resolved token values
- request URL
- method
- headers
- request body
- simulated raw response
- parsed accepted/rejected status
- parsed destination number or SIP
- parsed bid
- parsed conversion duration
- parsed rejection reason
- response time
- pass/fail checklist
- suggested fixes

Checklist examples:
- Endpoint URL present
- HTTP method selected
- Caller ID mapped
- ZIP mapped
- State mapped
- Response received
- Accepted value parsed
- Destination number parsed
- Bid parsed
- Conversion duration configured
- Response time under timeout threshold

9. Integration Freshness/Staleness
Track and display:
- created at
- created by
- updated at
- updated by
- activated at
- last tested at
- last successful test at
- last used at
- last successful call at
- usage count
- error rate
- days since last use

Status logic:
- Draft: created but not configured
- Needs Testing: configured but not tested
- Test Passed: last test passed but not active
- Active: active and recently used
- Active but Unused: active, but usage count is 0
- Dormant: active but not used in 7+ days
- Stale: active but not used in 30+ days
- Needs Retest: edited after last successful test
- Failing: error rate above 20% or recent test failed
- Paused
- Archived

10. AI Integration Assistant
Add a mock AI assistant panel.
The user should be able to paste buyer instructions or publisher instructions into a textarea.
Example input:
"POST to https://buyer.example.com/ping with caller_id, zip, and state. If accepted=true, use phone_number as the transfer destination. Bid is returned as payout. Reject reason is returned as reason."

The mock assistant should generate a proposed integration config.
It can be rule-based. It does not need to use an actual LLM.
Show:
- extracted method
- extracted URL
- extracted required fields
- proposed request body
- proposed response parser
- confidence level
- warnings
- button to apply config

11. API / Developer page
Show mock documentation for:
POST /api/integrations
GET /api/integrations/:id
POST /api/integrations/:id/test
GET /api/integrations/:id/activity
POST /api/bulk-import

Include example JSON payloads.

Data models:

Campaign:
{
  id: string;
  name: string;
  vertical: string;
  status: "draft" | "active" | "paused";
  createdAt: string;
}

Integration:
{
  id: string;
  campaignId: string;
  name: string;
  direction: "publisher" | "buyer";
  type: "static_number" | "rtb" | "sip" | "webhook" | "generic_api";
  platformPreset: string;
  status: "draft" | "needs_testing" | "test_passed" | "active" | "active_unused" | "dormant" | "stale" | "needs_retest" | "failing" | "paused" | "archived";
  config: IntegrationConfig;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  activatedAt?: string;
  lastTestedAt?: string;
  lastSuccessfulTestAt?: string;
  lastUsedAt?: string;
  lastSuccessfulCallAt?: string;
  usageCount: number;
  errorRate: number;
}

IntegrationConfig:
{
  method?: "GET" | "POST";
  url?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestBody?: Record<string, any>;
  destinationNumber?: string;
  sipAddress?: string;
  requiredFields?: string[];
  responseParsing?: {
    acceptedPath?: string;
    acceptedValue?: string | boolean | number;
    destinationNumberPath?: string;
    sipAddressPath?: string;
    bidPath?: string;
    conversionDurationPath?: string;
    expiresInSecondsPath?: string;
    rejectReasonPath?: string;
  };
  timeoutSeconds?: number;
  expiresInSeconds?: number;
  payout?: number;
  conversionDurationSeconds?: number;
  caps?: {
    daily?: number;
    hourly?: number;
  };
  schedule?: {
    timezone: string;
    days: string[];
    startTime: string;
    endTime: string;
  };
}

TestRun:
{
  id: string;
  integrationId: string;
  status: "passed" | "failed";
  requestPreview: object;
  rawResponse: object;
  parsedResult: object;
  checklist: Array<{
    label: string;
    status: "pass" | "fail" | "warning";
    message: string;
  }>;
  responseTimeMs: number;
  createdAt: string;
}

ActivityEvent:
{
  id: string;
  integrationId: string;
  eventType: "created" | "updated" | "tested" | "activated" | "used" | "failed" | "paused" | "marked_stale";
  message: string;
  createdAt: string;
  actor: string;
}

Mock presets to include:

Generic JSON POST Buyer:
{
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestBody": {
    "caller_id": "{{caller_id}}",
    "zip": "{{zip}}",
    "state": "{{state}}",
    "campaign_id": "{{campaign_id}}"
  },
  "responseParsing": {
    "acceptedPath": "$.accepted",
    "acceptedValue": true,
    "destinationNumberPath": "$.phone_number",
    "bidPath": "$.bid",
    "conversionDurationPath": "$.duration",
    "rejectReasonPath": "$.reason"
  },
  "timeoutSeconds": 3
}

Generic GET Buyer:
{
  "method": "GET",
  "queryParams": {
    "caller_id": "{{caller_id}}",
    "zip": "{{zip}}",
    "state": "{{state}}"
  },
  "responseParsing": {
    "acceptedPath": "$.status",
    "acceptedValue": "accepted",
    "destinationNumberPath": "$.number",
    "bidPath": "$.payout",
    "rejectReasonPath": "$.reason"
  },
  "timeoutSeconds": 3
}

Static Number Buyer:
{
  "destinationNumber": "+18005551212",
  "conversionDurationSeconds": 120,
  "payout": 35
}

Publisher RTB:
{
  "postingUrl": "https://mock-ppcall-platform.local/rtb/campaign/{{campaign_id}}",
  "requiredFields": ["caller_id", "zip", "publisher_id"],
  "acceptedResponse": {
    "accepted": true,
    "phone_number": "+18005551212",
    "payout": 35,
    "expires_in_seconds": 30
  },
  "rejectedResponse": {
    "accepted": false,
    "reason": "no_buyer_available"
  }
}

Testing simulation rules:
A buyer integration test should pass if:
- URL exists for API/RTB integrations.
- Method exists.
- Caller ID is mapped.
- ZIP is mapped when required.
- Response parser has acceptedPath.
- Destination number path exists for RTB buyer.
- Timeout is 5 seconds or less.

A buyer integration test should fail if:
- URL is missing.
- HTTP method is missing.
- Caller ID is missing.
- ZIP is missing.
- Response parsing is missing.
- Destination number cannot be parsed.
- Timeout is too high.
- Simulated response is rejected.

A publisher integration test should pass if:
- Campaign is active or testable.
- Publisher ID exists.
- Required fields are present.
- Caller ID is present.
- ZIP is present.
- A mock buyer route is available.
- Response can be returned before expiration.

Design requirements:
- Clean SaaS UI.
- Left sidebar navigation.
- Cards, tables, tabs, badges, and accordions.
- Clear status badges.
- Copy-to-clipboard buttons for integration instructions.
- Good empty states.
- Inline validation.
- Helpful error messages.
- Mock but realistic sample data.
- Responsive enough for desktop use.
- No real external API calls required.

Navigation:
- Dashboard
- Campaigns
- Integrations
- Add Integration
- Bulk Import
- Test Console
- AI Assistant
- Developer/API
- Activity

Seed the app with sample data:
Campaigns:
- HVAC Inbound
- Plumbing Inbound
- SSDI Transfers

Publishers:
- ABC Media
- LeadFlow Partners
- SearchCalls Network

Buyers:
- Premier Home Services
- Coastal Plumbing Buyer
- Disability Intake Group

Include a mix of statuses:
- Active
- Needs Testing
- Failing
- Stale
- Dormant
- Active but Unused

Implementation guidance:
- Keep code modular.
- Use strongly typed TypeScript models.
- Put mock data in a dedicated file.
- Put preset configs in a dedicated file.
- Put test simulation logic in a dedicated utility file.
- Put freshness/staleness status logic in a dedicated utility file.
- Make it easy to later replace mock data with a real API.
- Do not overbuild authentication.
- Do not integrate real telecom APIs.
- Do not require a backend unless absolutely necessary.

Deliverable:
A working local prototype with all major screens, mock data, wizard flow, JSON editor, AI assistant mock, bulk import validation, test console, and freshness/staleness tracking.
```

---

## 19. Follow-Up QA Prompt for the AI Coding Agent

After the first build, use this prompt:

```markdown
Now review the prototype as if you are a PPCall operations manager who has to onboard publishers and buyers without engineering help.

Find every place where the workflow is unclear, too technical, missing validation, missing testing, or missing visibility.

Then improve the UX so the product better supports:
1. Non-technical setup
2. Technical escape hatches
3. Bulk onboarding
4. Integration testing
5. Stale integration detection
6. Clear publisher instructions
7. Buyer response parsing
8. Activation guardrails

Pay special attention to whether a user can understand:
- What they need to do next
- Whether the integration is safe to activate
- Why a test failed
- What field mapping is missing
- Whether the integration is stale or actively used
- How to copy/send publisher instructions
- How to convert buyer instructions into a working route
```

---

## 20. Acceptance Criteria

The mock environment is complete when it demonstrates the following:

### Core Product

- User can view campaigns.
- User can open a campaign detail page.
- User can view publisher and buyer integrations.
- User can add an integration through a wizard.
- User can choose platform presets.
- User can view and edit raw JSON config.
- User can view and edit form-based config.
- User can use a mock AI assistant to generate config.
- User can bulk import integrations.
- User can test integrations.
- User can see test results and suggested fixes.
- User can activate only after passing required tests.
- User can see activity history.
- User can see stale, dormant, failing, unused, and needs-retest statuses.

### Publisher-Specific

- User can generate publisher instructions.
- User can copy posting URL or static number.
- User can see required fields.
- User can see sample request and response.
- User can test publisher setup.

### Buyer-Specific

- User can configure endpoint, method, headers, body, and parser.
- User can map tokens.
- User can preview resolved tokens.
- User can test buyer setup.
- User can parse accepted/rejected response.
- User can parse destination number or SIP.
- User can parse bid, duration, and rejection reason.

### Bulk Import

- User can paste CSV.
- User can paste JSON.
- System validates each row.
- System displays ready/warning/error rows.
- User can import valid rows.

### Freshness

- Integration displays created, edited, tested, used, and activation timestamps.
- Integration displays days since last use.
- Integration displays status based on freshness rules.
- Dashboard surfaces stale and failing integrations.

---

## 21. Final Product Guidance

This mock should not merely show pages. It should prove the operating model.

The key product insight is that every manual integration task can become a repeatable software workflow:

- Manual endpoint setup becomes a preset and form.
- Manual field mapping becomes a token picker.
- Manual troubleshooting becomes a test console.
- Manual status checking becomes freshness tracking.
- Manual instruction writing becomes generated publisher docs.
- Manual bulk setup becomes CSV/JSON import.
- Manual interpretation of buyer instructions becomes AI-assisted config generation.

The mock should make the future product obvious:

> A client should be able to onboard publishers and buyers without needing support, while the platform still maintains guardrails, testing, observability, and auditability.
