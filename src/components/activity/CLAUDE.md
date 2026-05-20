# src/components/activity/

Activity / event history view.

## Contents

- `ActivityHistory.tsx` — Renders the `activityEvents` list with filtering by integration, type, and time range.

## Conventions

- Read events from `useAppContext()` — do not maintain a parallel cache. Events are append-only in the reducer; rely on that.
- Filtering / aggregation belongs in a selector in `src/store/selectors.ts` (memoized), not inline in the render.
- Time formatting goes through `src/utils/clock.ts` so tests stay deterministic.
- E2E: `e2e/activity.spec.ts`.
