# src/components/test-console/

Interactive test-simulation UI. Lets the user fire a synthetic test call through an integration and inspect the resulting checklist.

## Contents

- `TestConsole.tsx` — Integration picker, input form (caller ID, zip, custom token values), Run button, checklist results, raw request/response preview.

## Conventions

- **Simulation is client-side.** All "testing" goes through `simulateIntegrationTest()` in `src/utils/testSimulation.ts`. No `fetch` calls. The integration's endpoint URL is shown but never hit.
- **Token resolution** for the displayed request preview uses `src/utils/tokenResolver.ts`. Don't reimplement it here.
- **Result is a `TestRun`.** Dispatch `RUN_TEST` so it shows up in the integration's history. The console is not a scratchpad — runs are persisted.
- **Determinism**: `testSimulation` is deterministic given the same input. Tests rely on this — don't add `Math.random()` to the UI side either.
- E2E: `e2e/test-console.spec.ts`.
