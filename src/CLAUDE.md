# src/

Application source. Entry points and top-level layout live here; everything else is organized by concern.

## Entry points

- `main.tsx` — React root, wraps `<App />` in `AppStoreProvider` and `ToastProvider`.
- `App.tsx` — View router. There is **no react-router**; navigation is a single `currentView` string with conditional rendering. `wizardContext` preserves "where the wizard was launched from" (campaign vs. global).
- `index.css` — Tailwind v4 entry (`@import "tailwindcss";`) plus a few global utilities.

## Layout

```
src/
  assets/      static images imported by components (empty today)
  components/  UI, grouped by feature area
  data/        seed data for first-run state
  models/      shared TypeScript types
  store/       Redux-like state container (Context + useReducer)
  utils/       pure logic: token resolution, JSON path, import, simulation, freshness
```

## Conventions

- **No regex anywhere.** Use string methods or Zod. See root `CLAUDE.md`.
- **No backend.** All persistence is `localStorage` via `store/AppStore.tsx`. Do not add `fetch`/`axios` calls.
- **Types live in `models/appTypes.ts`.** Do not redeclare `Integration`, `Campaign`, etc. in components — import them.
- **Tailwind utility classes only.** No CSS modules, no styled-components.
- **File naming**: components are PascalCase (`Foo.tsx`), utilities are camelCase (`foo.ts`).
