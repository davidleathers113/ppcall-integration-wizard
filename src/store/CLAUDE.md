# src/store/

Centralized state container. Redux-like pattern built on `React.Context` + `useReducer`. No external state library.

## Contents

- `AppStore.tsx` — Context provider, `useAppContext` hook, `localStorage` persistence with `STORAGE_VERSION` gating.
- `appReducer.ts` — The reducer and `AppAction` union. All state mutations go through here.
- `selectors.ts` — Memoized selector helpers (e.g., integrations by campaign, freshness aggregates). Prefer these over inline filtering in components.
- `useAppActions.ts` — Thin hook that wraps `dispatch` with named action creators for ergonomics.
- `__tests__/` — Reducer unit tests.

## State shape

```ts
{
  campaigns: Campaign[]
  integrations: Integration[]
  testRuns: TestRun[]
  activityEvents: ActivityEvent[]
}
```

## Adding a new action

1. Extend the `AppAction` discriminated union in `appReducer.ts`.
2. Add a `case` in the reducer's `switch`. Return new state immutably — do not mutate.
3. Add a named creator in `useAppActions.ts` if components will dispatch it.
4. Add a reducer test in `__tests__/AppStore.reducer.test.ts`.

## Persistence

- The entire state is serialized to `localStorage` on every change.
- Keyed by `STORAGE_VERSION`. Bump this constant whenever the persisted shape changes in a non-backward-compatible way — existing users will fall back to the seed in `src/data/mockData.ts`.
- To reset locally: `localStorage.clear()` or DevTools → Application → Storage.

## Conventions

- Reducer must be pure: no `Date.now()`, no `Math.random()`, no `crypto.randomUUID()` inline. Inject via the action payload using the helpers in `src/utils/clock.ts` and `src/utils/id.ts` so tests stay deterministic.
- Never call `dispatch` from inside a reducer. Side effects go in the component or a `useEffect`.
- Do not export the reducer's internal state object — components consume via `useAppContext()` or selectors.
