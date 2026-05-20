# src/utils/import/

Bulk import pipeline. Takes a user-uploaded CSV or JSON file and produces validated `Integration[]` ready for `BULK_IMPORT`.

## Pipeline (in order)

1. **`importParser.ts`** — Parse raw file. CSV via PapaParse, JSON via `JSON.parse`. Output: `ParsedImportRow[]` (rows + headers + per-row source metadata).
2. **`importNormalizer.ts`** — Auto-map source columns to `Integration` fields. Produces `ColumnMapping[]` with confidence scores so the UI can surface ambiguous matches for user review.
3. **`importValidator.ts`** — Validate each row against `importSchema.ts` (Zod). Output: `ImportValidationResult[]` with `errors[]`, `warnings[]`, and `fixSuggestion?` per row.
4. **`importSchema.ts`** — Zod schemas for each `Integration.type` (`static_number`, `rtb`, `sip`, `webhook`, `generic_api`). Single source of truth for what a valid imported row looks like.
5. **`importTemplates.ts`** — Downloadable CSV/JSON templates the UI offers users. Keep these in sync with the schema fields.

## Sub-directories

- `__fixtures__/` — CSV fixtures used by tests (valid rows, duplicates, quoted commas).
- `__tests__/` — Per-stage tests: `importParser`, `importNormalizer`, `importValidator`.

## Conventions

- **No regex** — even for "obviously safe" things like trimming whitespace or splitting on commas. Use string methods or PapaParse for CSV parsing.
- **Validate at the boundary.** This module is the boundary between untrusted user input and the trusted internal `Integration` shape. Anything that escapes here without going through `importSchema` is a bug.
- **Fail loud, fail per-row.** A bad row should produce a useful error message with a `fixSuggestion`; it should not abort the entire import. The UI lets users skip or correct rows.
- **No side effects.** This module returns data; it never dispatches. The component that calls it dispatches `BULK_IMPORT` with the result.
- If you add a new `Integration.type`, add a schema variant in `importSchema.ts`, a template in `importTemplates.ts`, fixtures in `__fixtures__/`, and tests in `__tests__/`.
