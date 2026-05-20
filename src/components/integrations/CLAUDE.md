# src/components/integrations/

Integration list, detail, and edit surfaces. This is the most-used area of the app.

## Contents

- `IntegrationList.tsx` — All integrations with filters by direction, type, status, freshness.
- `IntegrationDetail.tsx` — Single integration: config view, recent test runs, activity, "Test" and "Edit" actions.
- `BuyerConfigForm.tsx` — Form for buyer-side integrations (RTB / webhook / generic_api / SIP / static_number). Field set varies by `type`.
- `PublisherInstructions.tsx` — Read-only handoff instructions for publishers (endpoint URL, expected tokens, response shape). Includes copy-to-clipboard buttons with error handling.
- `RawJsonEditor.tsx` — Escape-hatch editor for `Integration.config` as raw JSON. For advanced users / debugging.

## Conventions

- **Form defaults** come from `src/utils/buyerConfigDefaults.ts`. Don't hard-code defaults in the form components.
- **Validation = Zod**, defined in or near the form. Show field-level errors inline, not as toasts.
- **The Test button** calls `simulateIntegrationTest()` from `src/utils/testSimulation.ts` and dispatches `RUN_TEST` with the resulting `TestRun`. Don't reimplement validation in the component.
- **Raw JSON editor** must reject malformed JSON before dispatching. Validate against the Zod schema for the integration's `type`; do not save garbage into the store.
- **Clipboard writes** can fail (permissions, insecure context). Handle the rejection and show a toast — see the pattern already in `PublisherInstructions.tsx`.
- **`data-testid` on every action button** — these are heavily covered by `e2e/integration-detail.spec.ts`, `e2e/buyer-config.spec.ts`, `e2e/raw-json.spec.ts`.
