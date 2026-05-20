# src/store/__tests__/

Reducer unit tests. Vitest.

## Contents

- `AppStore.reducer.test.ts` — Per-action tests covering each `case` in `appReducer`.

## Conventions

- Test the reducer as a pure function: `appReducer(prevState, action) === expectedState`. Do not mount the provider.
- Build inputs with object literals; do not import `mockData` (that drift-couples reducer tests to the seed).
- Inject `now`/`id` via the action payload — never let the reducer call `Date.now()` or generate an ID itself.
- Cover the boring branches: unknown action type returns state unchanged; updates to a non-existent ID are no-ops, not throws.

## Running

```bash
npm test                         # all
npm test -- AppStore.reducer     # this file only
npm test -- -t "BULK_IMPORT"     # one case
```
