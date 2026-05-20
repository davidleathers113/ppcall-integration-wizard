# AI Agent Directions — PPCall Integration Wizard Next Steps

## Current state

The project is a good first-pass UI mock, but it is still mostly a static demo. It has many of the right screens and concepts, but it does **not currently build**, and the core product architecture is not connected yet.

The next implementation pass should focus on making the app compile, then turning the static screens into a cohesive mock product where the wizard, form UI, raw JSON config, AI assistant, bulk import, test console, and freshness tracking all operate on the same normalized integration objects.

---

## Immediate build blockers

Run:

```bash
npm run build
npm run lint
```

The current project fails TypeScript/build and lint.

### Must fix first

1. Import `Zap` in `src/components/test-console/TestConsole.tsx`.
2. Fix `testRun` nullability in `TestConsole.tsx`.
   - The current JSX branch assumes `testRun` is non-null after the `isRunning` branch, but TypeScript does not narrow it safely.
   - Use an explicit condition like `testRun ? (...) : null`.
3. Remove unused imports:
   - `History` in `ActivityHistory.tsx`
   - `ArrowRight` and `ArrowLeft` in `CampaignDetail.tsx`
   - `Terminal` in `DeveloperDocs.tsx`
   - `Zap` in `IntegrationList.tsx`
   - `Badge` in `AddIntegrationWizard.tsx`
4. Remove unused variables:
   - `i` in `ActivityHistory.tsx`
   - `presetKey` in `AddIntegrationWizard.tsx`, or actually display/use it
   - unused parameter `p` in the preset filter inside `AddIntegrationWizard.tsx`
5. Fix `Badge.tsx`.
   - `children.toString()` is unsafe because `children` may be null/undefined or a React element.
   - Prefer a helper that only formats strings:
   ```tsx
   const label = typeof children === "string" ? children.replaceAll("_", " ") : children;
   ```
6. Fix `no-case-declarations` lint errors.
   - Wrap case blocks that declare variables in braces.
   - Example:
   ```tsx
   case "publishers": {
     const list = ...
     return ...
   }
   ```
7. Replace `any` with proper types in:
   - `AIAssistant.tsx`
   - `AddIntegrationWizard.tsx`
   - `tokenResolver.ts`
   - places where `Badge variant={... as any}` is used

Do not continue product work until `npm run build` and `npm run lint` pass.

---

## Product-level assessment

### What is already in decent shape

The first version already includes:

- A left sidebar navigation.
- Dashboard.
- Campaign list.
- Campaign detail shell with tabs.
- Integration list.
- Add integration wizard shell.
- Bulk import shell.
- Test console shell.
- AI assistant shell.
- Developer/API docs page.
- Activity history page.
- TypeScript model definitions.
- Mock campaign, integration, and activity data.
- Preset configs.
- Token resolver utility.
- Freshness/status utility.
- Simulated test utility.

This is a good structural start.

### Main issue

The app looks like a mock SaaS product, but the core flows do not actually work together.

Right now, the app has separate static screens. The user cannot truly:

- Create a campaign.
- Add a publisher.
- Add a buyer.
- Save a wizard-created integration.
- Edit an integration through fields.
- Edit the same integration through JSON.
- Apply an AI-generated config.
- Validate real bulk import content.
- Activate an integration only after passing tests.
- Open an integration detail page.
- See real activity events generated from user actions.
- Persist state after refreshing.
- Track freshness based on actual interactions.

The next phase should connect the product.

---

## North-star architecture

Use the Markdown implementation plan as the source of truth.

The key architecture rule:

> The normalized JSON integration config is the source of truth. The wizard, form fields, raw JSON editor, AI assistant, bulk import, and API layer should all create or update the same integration object.

That means the app needs a centralized store.

Recommended mock architecture:

```text
src/
  store/
    AppStore.tsx
  data/
    mockData.ts
    presets.ts
  models/
    appTypes.ts
  utils/
    testSimulation.ts
    freshness.ts
    tokenResolver.ts
    validation.ts
    jsonPath.ts
    importParser.ts
  components/
    integrations/
      IntegrationDetail.tsx
      IntegrationEditor.tsx
      RawJsonEditor.tsx
      PublisherInstructions.tsx
      BuyerConfigForm.tsx
```

For this prototype, use React Context + `useReducer` + `localStorage`.

Do not introduce a real backend yet.

---

## Data/store requirements

Create a centralized app store that contains:

```ts
{
  campaigns: Campaign[];
  integrations: Integration[];
  testRuns: TestRun[];
  activityEvents: ActivityEvent[];
}
```

Add actions:

```ts
createCampaign
updateCampaign
createIntegration
updateIntegration
deleteIntegration
runIntegrationTest
activateIntegration
pauseIntegration
archiveIntegration
bulkImportIntegrations
applyAIConfigToDraft
markIntegrationUsed
resetMockData
```

Every meaningful action should append an `ActivityEvent`.

Persist the store to `localStorage`.

---

## Required UX changes by screen

## 1. Dashboard

Current issue:
- Dashboard stats are based on mock arrays only.
- "Used this week" currently counts every integration with `usageCount > 0`, not actually used this week.
- Cards are not clickable.
- Stale/dormant/failing statuses are not deeply explained.

Directions:
- Pull stats from the centralized store.
- Calculate "Used this week" based on `lastUsedAt` within the last 7 days.
- Add dashboard sections:
  - Failing integrations
  - Stale integrations
  - Needs testing
  - Active but unused
- Add CTA buttons:
  - Add Integration
  - Bulk Import
  - Review Stale Integrations
- Clicking an integration should open its detail page.

---

## 2. Campaign List

Current issue:
- "Create Campaign" is a dead button.
- Campaigns are static.
- No stale count is shown, even though the plan requires it.

Directions:
- Implement a create campaign modal or inline form.
- Add columns:
  - Stale integrations
  - Failing integrations
  - Last activity
- Use actual store data.
- Let users click into the campaign detail page.

---

## 3. Campaign Detail

Current issue:
- Publishers and buyers are shown in tables, but actions do not do anything.
- Tests tab is "Coming soon."
- Routing is a visual stub.
- Publisher instructions are generic and only show the first publisher.
- No real integration detail/edit flow.

Directions:
- Add buttons:
  - Add Publisher
  - Add Buyer
  - Get Instructions
  - Configure
  - Test
  - View JSON
- Implement `IntegrationDetail` and route actions to it.
- In the `Tests` tab, show test runs for integrations in that campaign.
- In the `Routing` tab, show buyers in priority order with:
  - buyer name
  - route type
  - status
  - cap
  - schedule
  - last test
  - error rate
- In the `Publishers` tab, each publisher should have its own generated instructions.

---

## 4. Integration List

Current issue:
- It is a table only.
- No filtering, no detail page, no actions.

Directions:
- Add filters:
  - Direction: All / Publisher / Buyer
  - Status
  - Campaign
  - Type
- Add search.
- Add actions:
  - View
  - Edit
  - Test
  - Duplicate
  - Pause
  - Archive
- Add columns:
  - Campaign
  - Last tested
  - Last used
  - Days since last use
  - Error rate
- Clicking a row should open `IntegrationDetail`.

---

## 5. Integration Detail Page

This is currently missing and should become the heart of the app.

Build a new `IntegrationDetail.tsx` page.

Tabs:

1. Overview
2. Configure
3. Raw JSON
4. Test Console
5. Publisher Instructions, only for publisher integrations
6. Activity
7. Freshness

### Overview should show

- Name
- Campaign
- Direction
- Type
- Platform preset
- Status
- Last tested
- Last successful test
- Last used
- Usage count
- Error rate
- Days since last use
- Activation readiness

### Configure should show

For buyer integrations:
- Method
- URL
- Headers
- Query params
- Request body
- Required fields
- Response parser
- Destination number path
- SIP path
- Bid path
- Conversion duration path
- Reject reason path
- Timeout
- Caps
- Schedule

For publisher integrations:
- Generated posting URL or number
- Publisher ID
- Required fields
- Accepted response
- Rejected response
- Expiration seconds
- Allowed traffic type
- Copyable instructions

### Raw JSON should show

- Editable JSON editor
- Validate JSON button
- Apply JSON button
- Reset changes button
- Clear parse errors
- Warning when raw JSON changes require retesting

### Test Console should embed the same real test console component

### Activity should show events for this integration

### Freshness should explain

- Current freshness status
- Why the status was assigned
- Days since last use
- Days since last successful test
- Edited after last test?
- Error rate threshold
- Recommended next action

---

## 6. Add Integration Wizard

Current issue:
- Wizard only has six visual steps.
- The plan requires direction, type, preset, configure fields, map tokens, test, activate.
- Integration name input is uncontrolled and not saved.
- Method select has no `onChange`.
- Timeout input has no `onChange`.
- There is no token mapping step.
- There is no response parser configuration step.
- Test step is hardcoded and does not use `simulateIntegrationTest`.
- Finish does not create/save an integration.
- Activation is never blocked.

Directions:
- Refactor the wizard to use a typed draft object:
```ts
type IntegrationDraft = Partial<Integration> & {
  config: IntegrationConfig;
};
```
- Steps:
  1. Direction
  2. Type
  3. Campaign + name
  4. Preset
  5. Configure request/destination
  6. Map tokens
  7. Configure response parsing
  8. Test
  9. Activate or save as draft
- Use presets to populate the draft config.
- Use the same field editor components used on `IntegrationDetail`.
- Run the real `simulateIntegrationTest`.
- If test fails, show failures and suggested fixes.
- Disable activation unless test passes.
- On activation, save the integration to the store and append activity events.

---

## 7. Publisher Instructions

Current issue:
- Publisher instructions are shown as a generic JSON block in Campaign Detail.
- No copy-to-clipboard actually works.
- Instructions are not customized per publisher.

Directions:
Build `PublisherInstructions.tsx`.

It should show:

- Publisher name
- Campaign name
- Publisher ID
- Integration type
- Static number / SIP / RTB posting URL
- Required fields
- Optional fields
- Example request
- Example accepted response
- Example rejected response
- Bid expiration rule
- Caller ID requirements
- Test instructions
- Copy buttons for each section
- Download instructions as `.md` button

For RTB publisher instructions, include:

```json
{
  "postingUrl": "https://mock-ppcall.local/rtb/{campaign_id}/{publisher_id}",
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

## 8. Buyer Config Form

Current issue:
- Buyer setup is mostly absent outside of a few wizard fields.
- There is no rich response parser configuration.

Directions:
Build `BuyerConfigForm.tsx`.

Include:

- Method
- URL
- Headers editor
- Query params editor
- JSON body editor
- Required token checklist
- Response parser fields:
  - acceptedPath
  - acceptedValue
  - destinationNumberPath
  - sipAddressPath
  - bidPath
  - conversionDurationPath
  - expiresInSecondsPath
  - rejectReasonPath
- Timeout
- Caps
- Schedule
- Conversion rules

Make all fields update the same `IntegrationConfig`.

---

## 9. Raw JSON Editor

Current issue:
- Raw JSON is not actually implemented as a first-class editing layer.

Directions:
Build `RawJsonEditor.tsx`.

Requirements:

- Display full normalized integration object, not only config.
- Let user edit JSON.
- Validate JSON syntax.
- Validate schema.
- Show errors inline.
- Apply changes to store.
- Mark integration as `needs_retest` if config changes after last successful test.
- Include copy-to-clipboard.

---

## 10. Test Console

Current issue:
- Compile error because `Zap` is missing.
- The test engine is too shallow.
- It does not show all required sections.
- It does not actually parse response paths.
- It does not show suggested fixes.
- It randomly simulates response time, which makes tests inconsistent.
- No test input editor exists.

Directions:
Refactor test simulation to be deterministic and more meaningful.

Add test input fields:

```ts
{
  caller_id: "7275551234",
  zip: "34655",
  state: "FL",
  publisher_id: "pub_abc",
  campaign_id: "camp_hvac",
  trusted_form: "...",
  jornaya: "..."
}
```

Test console should display:

- Test input values
- Resolved token values
- Request URL
- HTTP method
- Headers
- Query params
- Request body
- Simulated raw response
- Parsed accepted/rejected status
- Parsed destination number or SIP
- Parsed bid
- Parsed conversion duration
- Parsed rejection reason
- Response time
- Pass/fail checklist
- Suggested fixes

Implement simple JSONPath-style lookup for paths like:

```text
$.accepted
$.phone_number
$.lead.payout
```

Do not use a heavy dependency unless needed. A simple dot-path resolver is enough for the mock.

Test rules should include:

Buyer API/RTB integrations fail if:
- URL missing
- Method missing
- caller_id token missing
- ZIP token missing when required
- Response parser missing
- Accepted path missing
- Destination number or SIP path missing
- Timeout > 5 seconds
- Simulated response cannot be parsed

Static buyer integrations fail if:
- Destination number missing
- Conversion duration missing
- Payout missing

Publisher integrations fail if:
- Publisher ID missing
- Posting URL / number / SIP missing
- Required fields missing
- Required fields do not include caller_id
- RTB publisher expiration missing

When a test runs:
- Create a `TestRun`.
- Store it.
- Update `lastTestedAt`.
- If passed, update `lastSuccessfulTestAt`.
- If failed, mark integration `failing` or `needs_testing`.
- Append activity event.

---

## 11. Bulk Import

Current issue:
- Validation results are hardcoded.
- Content is not parsed.
- Import button does not import anything.

Directions:
Build real mock import logic.

Support:

- CSV paste
- JSON paste
- file upload placeholder
- template download placeholder
- dry-run validation
- row-level validation
- import valid rows
- skip invalid rows
- append activity events

CSV fields:

```csv
integration_name,type,direction,campaign,publisher_or_buyer,platform_preset,method,url,destination_number,payout,timeout_seconds,status
```

Validation rules:

- integration_name required
- direction must be buyer or publisher
- type must be valid
- campaign must match existing campaign name or ID
- buyer API/RTB rows require URL and method
- static number rows require destination number
- duplicate names warn
- unknown preset warns or errors
- missing timeout defaults to 3 seconds
- missing status defaults to draft

After import:
- Add valid integrations to the store.
- Show an import summary.
- Append activity events.
- Mark imported items as `needs_testing` unless explicitly imported as draft.

---

## 12. AI Assistant

Current issue:
- It produces a config-like object, but not a full normalized integration object.
- The "Apply Proposed Config" button does nothing.
- The confidence/warnings are mixed into the config itself.
- Extraction is very shallow.
- No distinction between buyer and publisher instructions.

Directions:
Create a typed structure:

```ts
interface AIConfigProposal {
  direction: IntegrationDirection;
  type: IntegrationType;
  platformPreset?: string;
  config: IntegrationConfig;
  extracted: {
    method?: string;
    url?: string;
    requiredFields: string[];
    acceptedField?: string;
    destinationField?: string;
    bidField?: string;
    rejectReasonField?: string;
  };
  confidence: number;
  warnings: string[];
}
```

Improve rule-based extraction:

- Detect `GET` vs `POST`.
- Detect URLs.
- Detect required fields:
  - caller_id
  - phone
  - CID
  - zip
  - zipcode
  - state
  - publisher_id
  - trusted_form
  - jornaya
- Detect accepted fields:
  - accepted
  - success
  - status
  - code
- Detect destination fields:
  - phone_number
  - number
  - destination
  - sip
  - transfer_number
- Detect bid/payout fields:
  - bid
  - payout
  - price
- Detect reject reason fields:
  - reason
  - message
  - rejection_reason
- Detect timeout or expiration if mentioned.

"Apply Proposed Config" should:
- Create a draft integration, or
- Apply to selected draft/current integration.
- Send the user to the wizard/configure screen with values populated.

---

## 13. Freshness and staleness logic

Current issue:
- The date is hardcoded to `2026-05-19T16:00:00Z`.
- `Math.abs` can hide future-date bugs.
- Current status is calculated but not persisted/explained.
- `active_unused`, `paused`, `archived`, and `draft` do not have proper Badge variants.

Directions:
- Use a single `NOW` constant for mock mode, or actual `new Date()` with seed data relative to now.
- Do not use `Math.abs`; if a date is in the future, return 0 or flag as invalid.
- Add:
```ts
getFreshnessReason(integration): string
getRecommendedAction(integration): string
```
- Display days since last use.
- Display days since last successful test.
- Display whether edited after last successful test.
- Update Badge variants for every `IntegrationStatus`.

Rules:
- `paused` and `archived` preserve their status.
- `draft` remains draft.
- no `lastTestedAt` = needs_testing
- updated after lastSuccessfulTestAt = needs_retest
- errorRate > 0.2 = failing
- active + usageCount = 0 = active_unused
- active + no use in 30+ days = stale
- active + no use in 7+ days = dormant
- otherwise active/test_passed/etc.

---

## 14. Developer/API docs

Current issue:
- Good start, but thin.
- Missing bulk import endpoint.
- Missing activity endpoint.
- Missing test result endpoint.
- Copy button is not functional.

Directions:
Add docs for:

```http
POST /api/campaigns
GET /api/campaigns/:id
POST /api/integrations
GET /api/integrations/:id
PATCH /api/integrations/:id
POST /api/integrations/:id/test
POST /api/integrations/:id/activate
POST /api/integrations/:id/pause
GET /api/integrations/:id/activity
GET /api/integrations/:id/test-runs
POST /api/bulk-import
```

Show example payloads for:
- buyer RTB
- publisher RTB
- static number
- bulk import

Make copy buttons functional.

---

## 15. UI polish and cleanup

Directions:

- Rename the package from `scaffold` to something like `ppcall-integration-studio`.
- Update README. The current README is still the default Vite README.
- Remove unused Vite/React assets.
- Remove or replace unused `App.css` boilerplate.
- Make product naming consistent:
  - Use `Self-Service PPCall Integration Studio`
  - Sidebar can show `PPCall Studio`
- Add empty states.
- Add copy-to-clipboard behavior everywhere copy buttons appear.
- Add user-facing success messages/toasts or inline confirmations.
- Ensure buttons that look clickable actually perform actions or clearly say "Mock only."
- Add responsive overflow handling for wide tables.

---

## Acceptance criteria for the next agent pass

The next pass is complete when:

1. `npm run build` passes.
2. `npm run lint` passes.
3. App state is centralized and persisted in localStorage.
4. The wizard creates real integrations in the mock store.
5. The wizard uses presets and creates normalized config JSON.
6. Integration detail page exists.
7. Form fields and raw JSON editor edit the same integration object.
8. The test console runs against selected integrations and stores test runs.
9. Activation is blocked until required checks pass.
10. Publisher instructions are generated per publisher and copyable.
11. Bulk import parses actual CSV/JSON text and imports valid rows.
12. AI assistant can apply a proposed config to a draft integration.
13. Freshness/staleness is visible and explained.
14. Campaign detail actions work.
15. Integration list actions work.
16. Activity history updates when the user creates, edits, tests, activates, pauses, archives, or imports integrations.

---

# Copy/paste prompt for the AI agent

```markdown
You are a senior React/TypeScript product engineer. Continue building the Self-Service PPCall Integration Studio prototype using the attached Markdown implementation plan and the existing codebase.

First, inspect the project and run:

npm run build
npm run lint

Do not add new product features until both commands pass.

Immediate fixes:
- Import missing icons such as Zap in TestConsole.
- Fix nullable testRun usage in TestConsole.
- Remove unused imports and unused variables.
- Replace any with proper types.
- Fix Badge so it safely handles ReactNode children.
- Fix no-case-declarations lint issues by wrapping case blocks with braces.
- Add missing Badge variants for all IntegrationStatus values.

After the project builds, refactor the app from static mock screens into a connected mock product.

The most important architecture rule is:
The normalized JSON integration config is the source of truth. The wizard, form UI, raw JSON editor, AI assistant, bulk import, and API layer must all create or update the same Integration object.

Implement a centralized mock store using React Context + useReducer + localStorage. Store campaigns, integrations, testRuns, and activityEvents. Every meaningful user action should update the store and append an ActivityEvent.

Add these actions:
- createCampaign
- updateCampaign
- createIntegration
- updateIntegration
- runIntegrationTest
- activateIntegration
- pauseIntegration
- archiveIntegration
- bulkImportIntegrations
- applyAIConfigToDraft
- markIntegrationUsed
- resetMockData

Build or complete these product areas:

1. Integration Detail Page
Tabs:
- Overview
- Configure
- Raw JSON
- Test Console
- Publisher Instructions, for publisher integrations only
- Activity
- Freshness

2. Buyer Config Form
Fields:
- method
- URL
- headers
- query params
- JSON body
- required tokens
- response parser paths
- timeout
- caps
- schedule
- conversion rules

3. Publisher Instructions
Generate per-publisher copyable instructions with:
- publisher name
- campaign
- publisher ID
- posting URL or number
- required fields
- sample request
- accepted response
- rejected response
- expiration seconds
- caller ID requirements
- testing instructions

4. Raw JSON Editor
Show and edit the full normalized integration object. Validate syntax and schema. Applying changes should update the same integration object and mark it needs_retest if config changed after the last successful test.

5. Add Integration Wizard
Refactor it to a real flow:
- Choose direction
- Choose type
- Choose campaign and name
- Choose preset
- Configure request/destination
- Map tokens
- Configure response parsing
- Test
- Activate or save as draft

The wizard must save a real integration to the store. Activation must be blocked unless the integration passes required test checks.

6. Test Console
Make it deterministic and meaningful. Add test input values, resolved tokens, request URL, method, headers, body/query params, raw simulated response, parsed result, checklist, response time, and suggested fixes. Implement simple dot-path JSON parsing for paths like $.accepted and $.lead.payout. Store every TestRun.

7. Bulk Import
Replace hardcoded validation with real CSV/JSON parsing. Validate row-level errors and warnings. Allow importing valid rows. Add activity events.

8. AI Assistant
Keep it mock/rule-based, but make it output a typed AIConfigProposal with direction, type, config, extracted fields, confidence, and warnings. The Apply Proposed Config button must create or update a draft integration.

9. Freshness/Staleness
Improve the freshness utility. Show days since last use, days since last successful test, current status reason, and recommended action. Correct the Used This Week dashboard metric.

10. Developer/API docs
Add docs for campaigns, integrations, test runs, activity, activation, pause/archive, and bulk import. Make copy buttons functional.

11. Cleanup
- Rename package from scaffold.
- Replace default Vite README.
- Remove unused assets and App.css boilerplate.
- Ensure product naming is consistent.
- Add working copy-to-clipboard actions.
- Add empty states and inline validation.

Acceptance criteria:
- npm run build passes.
- npm run lint passes.
- Wizard creates and saves integrations.
- Bulk import imports valid integrations.
- AI assistant applies configs.
- Test console stores test runs.
- Activation requires a passed test.
- Publisher instructions are copyable and specific to each publisher.
- Raw JSON and form UI edit the same object.
- Freshness/staleness status is visible and explained.
- Activity history updates based on real mock actions.
```
