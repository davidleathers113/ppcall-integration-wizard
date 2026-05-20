# src/data/

Seed data for first-run state.

## Contents

- `mockData.ts` — Initial `campaigns`, `integrations`, `testRuns`, and `activityEvents` loaded into the store when no persisted state exists in `localStorage`.

## Conventions

- Treat this as fixtures, not source-of-truth. The store is the runtime authority; this file only seeds it.
- Keep enough variety that the dashboard, freshness indicators, and filters all have something to render on first load (e.g., at least one stale integration, one with errors, one healthy).
- IDs must be stable strings — they get persisted to `localStorage` and referenced by `TestRun.integrationId` etc.
- If you change the shape of `Integration` / `Campaign`, bump `STORAGE_VERSION` in `src/store/AppStore.tsx` so existing users get a fresh seed instead of a runtime crash.
