# src/components/dashboard/

Landing view. Aggregated health metrics and an "integrations that need attention" list.

## Contents

- `Dashboard.tsx` — Tiles for totals (campaigns, integrations, recent test runs), freshness breakdown, attention list. Shows an empty-state message when nothing needs attention.

## Conventions

- **Freshness comes from `src/utils/freshness.ts`** — don't duplicate the staleness heuristic here.
- **Aggregation goes through selectors** in `src/store/selectors.ts` so the dashboard re-renders cheaply when unrelated state changes.
- **Empty state matters.** The "no integrations need attention" message is intentional UX (see commit `8d63901`); don't replace it with a blank `null`.
- Clicking an attention-list item should navigate to the integration detail view via `App.tsx`'s view router, not open a modal.
