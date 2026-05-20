# src/utils/__tests__/

Unit tests for `src/utils/*`. Vitest.

## Contents

One test file per utility: `tokenResolver`, `jsonPath`, `freshness`, `testSimulation`, `buyerConfigDefaults`, `importParser`.

## Conventions

- Cover edge cases explicitly: empty string, missing keys, malformed paths, null/undefined inputs, deeply-nested objects.
- Inject `now`/`id` via function arguments — never rely on the real clock. `freshness` tests in particular should drive `now` forward to verify state transitions (`fresh` → `stale` → `dormant`).
- No regex in tests either. Use `expect(str).toContain(...)`, `toMatch` with strings, or property assertions on parsed objects.
- Keep fixtures tiny and inline. Large fixtures (e.g., CSV samples) live in `src/utils/import/__fixtures__/`.

## Running

```bash
npm test                          # all
npm test -- tokenResolver         # one file
npm test -- -t "expired token"    # one test name
npm run test:watch                # watch mode
```
