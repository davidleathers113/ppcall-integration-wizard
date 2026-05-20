# src/components/

All React components, grouped by feature area.

## Layout

```
components/
  activity/        Activity history list
  ai-assistant/    AI draft flow for generating integration configs
  bulk-import/     CSV/JSON import wizard
  campaigns/       Campaign list + detail
  dashboard/       Overview / health metrics
  developer/       API / integration documentation viewer
  integrations/    Integration list, detail, edit forms, raw-JSON editor
  layout/          Sidebar + chrome
  shared/          Reusable primitives (Card, Badge, ErrorBoundary, Toast, TokenPicker)
  test-console/    Test simulation UI
  wizard/          Add Integration wizard
```

## Conventions

- **One feature area per subdirectory.** Co-locate components, hooks, and types that are only used by that feature. If something is shared across two features, promote it to `shared/`.
- **PascalCase filenames** for components; the default export name must match the filename.
- **State via `useAppContext()` / `useAppActions()`** from `src/store/`. Do not introduce a second state container, do not pass the whole store down via props, and do not call `localStorage` directly.
- **Selectors over inline filtering.** Heavy filtering/aggregation belongs in `src/store/selectors.ts` so it can be memoized and reused.
- **Tailwind utility classes only.** No CSS modules, no styled-components, no inline `<style>` tags.
- **`data-testid` on every interactive element** that has an E2E test. The Playwright suite selects exclusively by `data-testid` — see `e2e/CLAUDE.md`.
- **No business logic in components.** Token resolution, JSON path extraction, simulation, freshness — all live in `src/utils/`. Components compose these; they don't reimplement them.
- **No regex.** Use string methods or Zod for any parsing/validation.

## Adding a new feature area

1. Create `src/components/<feature-name>/` with the main component.
2. Add a view key to the union in `App.tsx` and a nav entry in `layout/Sidebar.tsx`.
3. If the feature mutates state, add the action(s) to `src/store/appReducer.ts` plus reducer tests.
4. Add `data-testid` attributes to interactive elements.
5. Add an E2E spec in `e2e/`.
