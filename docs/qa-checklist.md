# QA Checklist - PPCall Integration Studio

## Automated Test Commands

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Lint
npm run lint

# Build
npm run build
```

## Manual Smoke Test Checklist

### App Load & Navigation
- [ ] App loads without console errors
- [ ] Sidebar navigation renders
- [ ] Dashboard displays with stats
- [ ] All main navigation links work (Dashboard, Campaigns, Integrations, etc.)
- [ ] Seeded data appears on first load

### Campaign Management
- [ ] Campaign list displays
- [ ] Create new campaign works
- [ ] Campaign detail opens
- [ ] All tabs render (Overview, Publishers, Buyers, Routing, Tests, Activity)
- [ ] Add Publisher Source button works
- [ ] Add Buyer Target button works

### Integration Wizard
- [ ] Wizard opens from navigation
- [ ] Direction selection works (Buyer vs Publisher)
- [ ] Type selection works (RTB, Static, SIP, Webhook)
- [ ] Campaign selection populated
- [ ] Integration name required
- [ ] Preset selection works
- [ ] Configuration steps validate
- [ ] Save Draft creates integration
- [ ] Created integration appears in list
- [ ] Created integration has correct status (draft/needs_testing, NOT active)
- [ ] Navigation to integration detail works

### Direct Target Mode (Buyer)
- [ ] Wizard exposes "Direct Number Target" and "Direct SIP Target" type options when direction is Buyer
- [ ] Direct Number wizard flow: destination number → payout + conversion duration → timezone + daily cap → Save Draft
- [ ] Direct SIP wizard flow: SIP address → payout + conversion duration → timezone + daily cap → Save Draft
- [ ] Direct targets do not show HTTP request URL / method / body fields in the wizard
- [ ] Step 6 ("Response Parsing") shows the "No parsing required" message for direct targets
- [ ] Saved direct target lands in `draft` (not `active`)
- [ ] Toast: "Direct target draft created. Run a test before activation."
- [ ] Configure tab on a direct target shows: Destination, Call Handling, Caps & Schedule, Duplicate Rules, Revenue Recovery, Shareable Tags, Predictive Routing
- [ ] Configure tab does NOT show: Request, Response Parsing, Filters, Revenue & Errors, Advanced Call Behavior
- [ ] Configure tab on an RTB target still shows the full RTB section set
- [ ] Test console for a direct target checklist mentions destination, timezone, caps, payout, conversion duration; it does NOT mention endpoint URL or response parsing
- [ ] Test console request preview for a direct target shows `buyer_destination_kind` and `destination` (not `url` / `method`)
- [ ] CSV import: direct number and direct SIP templates round-trip through the bulk import flow
- [ ] CSV import: a direct target row with `status=active` is downgraded to `needs_testing` with a warning
- [ ] AI Assistant: "Send calls to +18005551212. Buyer pays $35 after 120 seconds. Hours Monday through Friday 8am to 6pm Eastern. Daily cap is 100." produces a direct_number proposal
- [ ] AI Assistant: "Route to SIP sip:intake@buyer.example.com with max concurrency 5 and daily cap 50." produces a direct_sip proposal
- [ ] Raw JSON editor: editing the destination number on a direct target marks it `needs_retest`
- [ ] Activation: a direct target cannot be activated until a passing stored test exists

### Integration Detail
- [ ] Overview tab displays all fields
- [ ] Configure tab shows form fields
- [ ] Raw JSON tab displays editable JSON
- [ ] Test Console tab loads
- [ ] Activity tab shows events
- [ ] Freshness tab explains status
- [ ] Publisher Instructions tab only shows for publisher integrations
- [ ] Status badges display correctly

### Test Console & Activation Guardrails
- [ ] Test can be run
- [ ] Test inputs editable
- [ ] Request preview shown
- [ ] Response preview shown
- [ ] Checklist displays
- [ ] Failed tests show failure reasons
- [ ] Activation blocked without passing test
- [ ] UI explains why activation is blocked
- [ ] Passing test enables activation
- [ ] Activation updates status
- [ ] Activation creates activity event

### Raw JSON Editor
- [ ] JSON displays formatted
- [ ] Copy JSON button works
- [ ] Invalid JSON shows error
- [ ] Invalid JSON blocks save
- [ ] Schema-invalid JSON shows error
- [ ] Valid changes save
- [ ] Changes reflected in form/overview
- [ ] Activity event created on save
- [ ] Config changes after passing test mark as needs_retest

### Bulk Import - CSV
- [ ] CSV tab accessible
- [ ] Paste CSV works
- [ ] File upload works (if implemented)
- [ ] Template download/copy works
- [ ] Parser handles BOM
- [ ] Parser handles CRLF line endings
- [ ] Parser handles quoted commas
- [ ] Parser handles escaped quotes
- [ ] Validation shows errors
- [ ] Validation shows warnings
- [ ] Duplicate names detected
- [ ] Invalid campaign errors
- [ ] Missing required fields errors
- [ ] Active status downgraded to needs_testing
- [ ] Valid rows import successfully
- [ ] Imported integrations appear in list
- [ ] Imported integrations NOT active
- [ ] Activity events created

### Bulk Import - JSON
- [ ] JSON tab accessible
- [ ] Paste JSON works
- [ ] Invalid JSON shows error
- [ ] Valid JSON imports
- [ ] Schema validation works
- [ ] Activity events created

### AI Assistant
- [ ] AI Assistant opens
- [ ] Instructions textarea works
- [ ] Generate/Analyze button works
- [ ] Extracted method displays
- [ ] Extracted URL displays
- [ ] Required fields detected
- [ ] Parser fields detected
- [ ] Warnings separated from config
- [ ] Campaign selection works
- [ ] Draft name input works
- [ ] Apply creates draft integration
- [ ] Created integration opens
- [ ] Config contains extracted values
- [ ] Activity event created

### Persistence & Reset
- [ ] Created data persists after refresh
- [ ] localStorage contains state
- [ ] Reset Mock Data button accessible
- [ ] Reset removes custom data
- [ ] Reset restores seeded data
- [ ] Reset creates activity event

### Error Handling
- [ ] Console shows no unexpected errors during normal use
- [ ] Invalid forms show inline validation
- [ ] Network/async errors handled gracefully
- [ ] Error boundaries catch component crashes
- [ ] Toast notifications appear for actions
- [ ] Copy actions show feedback

## CSV Import Test Cases

### Valid Imports
- [ ] Buyer RTB with all fields
- [ ] Static buyer with minimal fields
- [ ] Publisher RTB
- [ ] Multiple rows
- [ ] Quoted commas in values
- [ ] Escaped quotes
- [ ] CRLF line endings
- [ ] BOM at start of file

### Invalid Imports
- [ ] Empty file
- [ ] Missing header row
- [ ] Duplicate headers
- [ ] Duplicate integration names (within file)
- [ ] Duplicate integration names (against existing)
- [ ] Invalid campaign ID/name
- [ ] Missing required field (integration_name)
- [ ] Missing required field (direction)
- [ ] Invalid direction value
- [ ] Invalid type value
- [ ] Active status in CSV (should downgrade)
- [ ] Over max row limit
- [ ] Malformed CSV syntax
- [ ] Invalid JSON in JSON field

## Wizard Test Cases

### Buyer RTB
- [ ] Complete wizard with generic_json_post preset
- [ ] Complete wizard with custom config
- [ ] Validation blocks progress without URL
- [ ] Validation blocks progress without method
- [ ] Validation blocks progress without campaign
- [ ] Validation blocks progress without name

### Static Buyer
- [ ] Complete wizard
- [ ] Validation requires destination number
- [ ] Validation requires payout
- [ ] Validation requires conversion duration

### Publisher RTB
- [ ] Complete wizard
- [ ] Validation requires publisher ID
- [ ] Validation requires posting URL OR number
- [ ] Validation requires required fields
- [ ] Validation requires caller_id in required fields

## Activation Guardrail Test Cases

- [ ] Draft integration cannot be activated
- [ ] needs_testing integration cannot be activated
- [ ] Failed test does not enable activation
- [ ] Passing test enables activation
- [ ] needs_retest after config change cannot activate
- [ ] Re-test after config change required
- [ ] Passing re-test enables activation
- [ ] UI clearly indicates why blocked
- [ ] UI shows which checks failed

## AI Assistant Test Cases

### Buyer Instructions
- [ ] POST URL detection
- [ ] GET URL detection
- [ ] caller_id field detection
- [ ] zip field detection
- [ ] state field detection
- [ ] accepted field detection
- [ ] destination field detection (phone_number, transfer_number, etc.)
- [ ] bid/payout field detection
- [ ] reject reason field detection
- [ ] Expiration field detection
- [ ] Method detection (GET vs POST)
- [ ] Warning for missing URL
- [ ] Warning for missing caller_id

### Publisher Instructions
- [ ] Publisher ID detection
- [ ] Posting URL detection
- [ ] RTB expiration detection
- [ ] Required fields detection
- [ ] Warning for missing publisher ID

## Known Limitations

This is a local mock prototype for demonstration and testing purposes:

- **No Real Backend**: All state is client-side in localStorage
- **No Real API Calls**: Test simulation is deterministic client-side logic
- **No Real Integrations**: Does not connect to actual buyer APIs, publisher endpoints, SIP providers, Ringba, Retreaver, TrackDrive, or CallGrid
- **No Real Telecom**: Does not interface with carriers, DIDs, SIP trunks, or call routing infrastructure
- **No Authentication**: No login, user management, or access control
- **No Billing**: No payment processing or usage tracking
- **Mock Data Only**: All campaigns, integrations, and test runs are simulated
- **localStorage Only**: Data cleared if browser storage cleared
- **Single User**: No multi-user support or concurrency
- **Client-Side Only**: No server-side validation or processing

## Development Environment

- **Node Version**: 22.15.0+
- **Browser**: Chrome/Chromium (latest)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Build Tool**: Vite
- **Framework**: React 19.2.6
- **TypeScript**: 6.0.2

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Screenshots (if applicable)
6. localStorage state (if relevant)

## Testing Best Practices

1. **Run unit tests first**: `npm run test`
2. **Then E2E tests**: `npm run test:e2e`
3. **Manual smoke test** after significant changes
4. **Clear localStorage** between test runs if needed
5. **Use Reset Mock Data** to return to known state
6. **Check browser console** for unexpected errors
7. **Test in clean browser profile** for accurate results

## Pre-Release Checklist

Before considering a release or demo:

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Lint passes with no warnings
- [ ] Build succeeds with no errors
- [ ] Manual smoke test completed
- [ ] No console errors in normal flows
- [ ] README is up to date
- [ ] Documentation reflects current features
- [ ] Known limitations documented
- [ ] Sample data is appropriate and realistic
