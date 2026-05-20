# e2e/

Playwright end-to-end tests. Each `*.spec.ts` file targets one user-facing flow.

## Layout

- `helpers.ts` — Shared selectors, login/seed helpers, page-object utilities. Prefer extending this over duplicating selectors per spec.
- `*.spec.ts` — One file per flow:
  - `app-load` — Smoke test that the SPA boots and the dashboard renders.
  - `wizard-flow` — Add Integration wizard end-to-end.
  - `bulk-import` — CSV/JSON import wizard.
  - `ai-assistant` — AI draft flow.
  - `buyer-config` — Buyer-side integration form.
  - `integration-detail` — Detail view, edit, retest.
  - `raw-json` — Raw JSON editor for configs.
  - `test-console` — Test simulation UI.
  - `activity` — Activity history list/filtering.
  - `persistence` — localStorage round-trip across reloads.
  - `toasts` — Toast notifications surface on success/error.

## Conventions

- **Selectors**: Use `data-testid` attributes only. Do not select by class names, text, or DOM structure — those churn. If a needed `data-testid` is missing, add it to the component first.
- **State isolation**: Tests share a single browser context per file but should not depend on order. Reset state via `localStorage.clear()` in `beforeEach` (see `helpers.ts`).
- **No network mocking**: This app has no backend. All "API calls" are client-side simulation; tests assert on resulting UI/state, not on network traffic.
- **Test data**: Use the seed data from `src/data/mockData.ts` or import fixtures from `src/utils/import/__fixtures__/`. Do not invent ad-hoc data inline unless trivial.

## Running

```bash
npx playwright test                    # all
npx playwright test wizard-flow        # one spec
npx playwright test --ui               # interactive
npx playwright test --headed --debug   # step through
```

Reports land in `playwright-report/`; traces and screenshots in `test-results/`.
