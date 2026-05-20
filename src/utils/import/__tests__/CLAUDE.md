# src/utils/import/__tests__/

Per-stage tests for the import pipeline. Vitest.

## Contents

- `importParser.test.ts` — CSV/JSON parsing, header detection, quoted-field handling.
- `importNormalizer.test.ts` — Column auto-mapping, confidence scores, fallback when no header matches.
- `importValidator.test.ts` — Zod schema validation, error messages, fix suggestions, duplicate detection.

## Conventions

- Test each pipeline stage **in isolation**. Don't chain parser → normalizer → validator in a single test — each stage's behavior should be pinned down independently. End-to-end import is covered by `e2e/bulk-import.spec.ts`.
- Load CSV fixtures from `../__fixtures__/`; inline JSON fixtures as object literals in the test file.
- Assert on **specific error messages and codes**, not just `result.ok === false`. The UI surfaces these messages to users, so they're part of the contract.
- Cover the unhappy paths: empty file, headers-only file, missing required column, unknown column, type coercion failures, BOM-prefixed CSV, mixed line endings.
- No regex in assertions. Use `toContain`, `toEqual`, or property checks.

## Running

```bash
npm test -- src/utils/import
npm test -- importValidator
```
