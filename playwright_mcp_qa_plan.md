# Playwright MCP QA Plan

This plan describes how to use Playwright MCP to run a full browser QA pass for **Self-Service PPCall Integration Studio**.

The app is a local mock prototype. QA should verify UI behavior, local state, localStorage persistence, simulated tests, and normalized integration data flow. It should not attempt to connect to real telecom carriers, SIP infrastructure, buyer APIs, publisher endpoints, authentication, billing, or production databases.

## Prerequisites

1. Add Playwright MCP to Codex CLI:

   ```bash
   codex mcp add playwright -- npx -y @playwright/mcp@latest
   ```

2. Restart Codex CLI so the MCP tools are available.

3. Verify the MCP server is registered:

   ```bash
   codex mcp list
   codex mcp get playwright
   ```

4. Install browser binaries if needed:

   ```bash
   npx playwright install chromium
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open the dev server URL shown by Vite, usually:

   ```text
   http://localhost:5173
   ```

## QA Goals

- Confirm the app loads with styled UI and no obvious console errors.
- Verify navigation works across all major screens.
- Verify campaigns, publisher integrations, buyer integrations, and activity render from centralized app state.
- Verify integrations can be created from campaign, publisher, buyer, wizard, AI assistant, and bulk import entry points where supported.
- Verify imported, wizard-created, and AI-created integrations become normalized `Integration` objects.
- Verify testing, activation blocking, pause/archive, mark-used, and activity logging work consistently.
- Verify localStorage persistence and reset behavior.
- Capture screenshots and reproducible notes for any defects.

## Browser Setup

Use one Chromium browser context for the main pass.

Before the first fresh-state pass:

1. Navigate to the app.
2. Clear localStorage for the app origin.
3. Reload.
4. Confirm seeded mock data appears.

For persistence checks:

1. Complete a few state-changing actions.
2. Reload without clearing localStorage.
3. Confirm state persists.

For reset checks:

1. Use the app's reset mock data control.
2. Confirm seeded data returns.

## Global Checks

Run these checks on every screen visited:

- Page is visually styled, not plain unstyled HTML.
- No modal, menu, or panel is cut off at the current viewport.
- Buttons that appear enabled perform an action.
- Disabled buttons explain the blocked condition where appropriate.
- Empty states are clear when data is absent.
- Copy buttons either copy content or show a useful error.
- Console has no new uncaught errors.
- Navigation does not lose state unexpectedly.

Recommended viewport sizes:

- Desktop: `1440 x 900`
- Narrow desktop/tablet: `1024 x 768`
- Mobile sanity check: `390 x 844`

## Test Data

Use seeded campaigns first. If seed data has changed, use whatever campaign is visible in the campaign list.

Suggested manual inputs:

```text
caller_id: 2125550199
zip: 10001
state: NY
publisher_id: pub_qa_source
campaign_id: selected campaign id
trusted_form: https://cert.trustedform.com/qa
jornaya: QA-JORNAYA-TOKEN
```

Valid buyer RTB CSV:

```csv
integration_name,campaign,direction,type,platform_preset,method,url,timeout_seconds,required_fields,accepted_path,accepted_value,destination_number_path,bid_path,conversion_duration_path,reject_reason_path
QA Buyer RTB,HVAC Inbound,buyer,rtb,custom,POST,https://buyer.example.test/ping,3,caller_id|zip,$.accepted,true,$.phone_number,$.bid,$.duration,$.reason
```

Valid static buyer CSV:

```csv
integration_name,campaign,direction,type,destination_number,payout,conversion_duration_seconds
QA Static Buyer,HVAC Inbound,buyer,static_number,+15551234567,45,90
```

Valid publisher RTB CSV:

```csv
integration_name,campaign,direction,type,platform_preset,publisher_id,posting_url,required_fields,expires_in_seconds
QA Publisher RTB,HVAC Inbound,publisher,rtb,custom,pub_qa_source,https://mock-ppcall.local/rtb/qa,caller_id|zip,300
```

## QA Flow 1: App Load And Navigation

1. Open the app.
2. Confirm the sidebar shows `PPCall Studio`.
3. Visit:
   - Dashboard
   - Campaigns
   - Integrations
   - Add Integration
   - Bulk Import
   - Test Console
   - AI Assistant
   - Developer/API
   - Activity
4. Confirm each screen renders meaningful content.
5. Check console errors after navigation.

Expected result: all primary routes render, navigation state is stable, and no route is a dead placeholder unless clearly labeled as mock/incomplete.

## QA Flow 2: Campaign Detail Entry Points

1. Open Campaigns.
2. Open a campaign detail page.
3. On Overview, use the campaign-level create integration action.
4. Confirm the wizard opens with campaign preselected.
5. Cancel or navigate back.
6. Open the Publishers tab.
7. Use the publisher create action.
8. Confirm the wizard opens with:
   - selected campaign
   - direction set to publisher
9. Cancel or navigate back.
10. Open the Buyers tab.
11. Use the buyer create action.
12. Confirm the wizard opens with:
   - selected campaign
   - direction set to buyer

Expected result: contextual create actions reduce duplicate data entry and do not create integrations until the wizard is saved.

## QA Flow 3: Expanded Wizard

1. Open Add Integration.
2. Complete the wizard steps:
   - Direction
   - Type
   - Campaign + integration name
   - Preset
   - Configure request/destination
   - Response parsing
   - Review JSON
   - Save draft
   - Test / open detail
3. Try moving forward with required fields missing.
4. Confirm validation blocks progression.
5. Create a buyer RTB draft.
6. Confirm the saved integration opens in detail.
7. Confirm the status is draft or needs testing, not active.
8. Confirm raw JSON reflects the normalized `Integration` object.

Expected result: the wizard saves one normalized draft integration and navigates to the detail view.

## QA Flow 4: Buyer Config Editors

1. Open a buyer integration detail page.
2. Edit buyer config fields:
   - method
   - URL
   - headers
   - query params
   - request body JSON
   - required fields
   - caps
   - schedule
   - response parsing paths
3. Confirm invalid JSON is blocked with an inline error.
4. Confirm valid edits update the raw JSON view.
5. Confirm edits after a successful test mark the integration as needing retest when applicable.

Expected result: form edits and raw JSON stay synchronized through the normalized integration config.

## QA Flow 5: Raw JSON Editor

1. Open an integration detail page.
2. Open the raw JSON editor.
3. Copy JSON and confirm copy feedback.
4. Format JSON and confirm formatting changes only whitespace.
5. Attempt invalid JSON.
6. Attempt missing required top-level fields.
7. Attempt invalid enum values.
8. Attempt an unknown campaign ID.
9. Save a valid config change.
10. Confirm the detail/form view updates.

Expected result: schema validation prevents invalid normalized integration objects.

## QA Flow 6: Test Console And Activation

1. Open an integration that should pass after valid config.
2. Open Test Console from the detail page or global nav.
3. Select the integration.
4. Edit test inputs.
5. Run a simulated test.
6. Confirm the result shows:
   - request preview
   - resolved tokens
   - raw response
   - parsed result
   - checklist
   - response time
   - suggested fixes for failures
7. Confirm the test run is stored in recent history.
8. Return to integration detail.
9. Confirm latest test result appears.
10. Activate the integration.
11. Confirm activation succeeds only after a passing latest test.
12. Create or select a failing integration.
13. Confirm activation is blocked and the blocked reason is visible.

Expected result: testing is deterministic, stored, and controls activation.

## QA Flow 7: Freshness And Status

1. Open an active integration detail page.
2. Open the Freshness tab.
3. Confirm it shows:
   - persisted status
   - computed freshness status
   - reason
   - recommended action
   - days since last use
   - days since last successful test
   - edited after last successful test
   - latest test result
4. Use Mark Used.
5. Confirm freshness details update.
6. Pause the integration.
7. Confirm paused status is preserved.
8. Archive the integration.
9. Confirm archived status is preserved.

Expected result: persisted lifecycle status and computed freshness status are labeled clearly.

## QA Flow 8: AI Assistant

1. Open AI Assistant.
2. Enter buyer RTB instructions that include:
   - POST
   - URL
   - caller ID
   - ZIP
   - accepted response field
   - destination number field
   - payout field
3. Choose campaign and draft name.
4. Apply the proposal.
5. Confirm the app navigates to the new integration detail page.
6. Confirm warnings are separate from config.
7. Confirm raw JSON contains normalized config only.
8. Repeat with publisher RTB instructions including publisher ID, posting URL, required fields, and expiration.

Expected result: AI extraction creates normalized drafts and does not mix metadata into `config`.

## QA Flow 9: Bulk Import

1. Open Bulk Import.
2. Select CSV mode.
3. Paste the valid buyer RTB CSV.
4. Parse content.
5. Confirm file/content metadata and row count.
6. Confirm columns auto-map.
7. Reset mappings.
8. Auto-map again.
9. Validate rows.
10. Preview normalized integrations.
11. Expand normalized JSON preview.
12. Import valid rows.
13. Confirm result summary shows imported, skipped, warning, and error counts.
14. Open an imported integration.
15. Confirm status is draft or needs testing, not active.
16. Repeat with campaign name instead of campaign ID.
17. Confirm campaign resolves.
18. Paste CSV with quoted commas.
19. Confirm quoted fields parse correctly.
20. Paste CSV with duplicate integration names.
21. Confirm warnings appear.
22. Leave Include rows with warnings off.
23. Confirm warning rows are skipped.
24. Turn Include rows with warnings on.
25. Confirm warning rows import.
26. Paste invalid JSON in JSON mode.
27. Confirm useful error.
28. Upload a CSV file through the file input.
29. Confirm file metadata appears.
30. Download a template and re-import it successfully.

Expected result: parsing, mapping, validation, preview, and import are separate visible steps.

## QA Flow 10: Developer/API Docs

1. Open Developer/API.
2. Confirm the page clearly says the docs are mock API docs only.
3. Confirm endpoints are documented:
   - `POST /api/campaigns`
   - `GET /api/campaigns/:id`
   - `POST /api/integrations`
   - `GET /api/integrations/:id`
   - `PATCH /api/integrations/:id`
   - `POST /api/integrations/:id/test`
   - `POST /api/integrations/:id/activate`
   - `POST /api/integrations/:id/pause`
   - `POST /api/integrations/:id/archive`
   - `GET /api/integrations/:id/activity`
   - `GET /api/integrations/:id/test-runs`
   - `POST /api/bulk-import`
4. Confirm example payloads exist for:
   - buyer RTB
   - publisher RTB
   - static buyer
   - bulk import
5. Use every visible copy button.
6. Confirm success or failure feedback appears.

Expected result: docs match the actual mock model/actions.

## QA Flow 11: Activity

1. Create a wizard draft.
2. Run a test.
3. Activate an integration.
4. Pause an integration.
5. Archive an integration.
6. Import at least one integration.
7. Apply an AI proposal.
8. Open Activity.
9. Confirm each action appears with useful actor, timestamp, and context.

Expected result: meaningful user actions create audit events consistently.

## QA Flow 12: Persistence And Reset

1. Record the current integration count.
2. Create or import a new integration.
3. Reload the page.
4. Confirm the integration still exists.
5. Confirm recent activity still exists.
6. Use Reset Mock Data.
7. Confirm seeded state returns.
8. Reload again.
9. Confirm reset state persists.

Expected result: localStorage persistence works and versioned reset does not crash the app.

## Defect Reporting Format

For each issue found, capture:

- Title
- Severity: blocker, high, medium, low
- Screen
- Steps to reproduce
- Expected result
- Actual result
- Console errors, if any
- Screenshot path or description
- Whether it blocks final verification

## Final Verification Commands

After browser QA and any fixes, run:

```bash
npm run test
npm run lint
npm run build
```

Do not mark the QA pass complete unless all three commands pass.

## Completion Report

The final QA report should include:

- Browser and viewport used
- Whether fresh localStorage and existing localStorage were both tested
- Screens and flows completed
- Defects found and fixed
- Defects deferred
- Screenshots captured
- Final command results for `test`, `lint`, and `build`
