# src/utils/

Pure logic. No React, no `localStorage`, no DOM. Anything stateful belongs in `src/store/` or a component.

## Contents

- `tokenResolver.ts` — Resolves `{{caller_id}}`, `{{zip}}`, etc. in config strings using a context object. Used when constructing buyer API requests.
- `jsonPath.ts` — Dot-notation path extraction (`a.b.c` → `obj.a.b.c`). Used for response parsing rules.
- `testSimulation.ts` — Deterministic client-side validation of integration configs. Produces `TestRun` with a checklist (pass/fail/warning items). No real network.
- `freshness.ts` — Derives an integration's health status from `lastUsedAt`, `lastTestedAt`, error rate.
- `buyerConfigDefaults.ts` — Default config skeletons for each buyer integration `type`.
- `importParser.ts` — Top-level import entry point (older; `import/` is the newer modular version).
- `clock.ts` — `now()` indirection so tests can stub time.
- `id.ts` — ID generation indirection so tests can stub IDs.
- `import/` — CSV/JSON import pipeline (parse → map → validate → normalize).
- `__tests__/` — Vitest unit tests for the utilities above.

## Conventions

- **Pure functions only.** No `Date.now()`, no `Math.random()`, no `crypto.randomUUID()` directly — go through `clock.ts` / `id.ts` so callers can inject deterministic values in tests.
- **No regex.** Project-wide constraint. Use string methods (`includes`, `startsWith`, `split`, `indexOf`) or Zod schemas.
- **Validation = Zod.** Define schemas next to their consumer; don't put them in `models/`.
- Every utility here should have a unit test in `__tests__/`. If you add a new file, add the test in the same PR.
