# src/components/bulk-import/

CSV/JSON bulk-import wizard. Walks the user through file upload → column mapping → validation preview → confirm.

## Contents

- `BulkImport.tsx` — Multi-step wizard. Holds the current step in local state; the parsed/normalized/validated data is the source of truth driving each step.

## Flow

1. **Upload** — User picks a CSV or JSON file. Component calls `importParser` from `src/utils/import/`.
2. **Map columns** — Component displays auto-detected column mappings with confidence; user edits ambiguous ones. Backed by `importNormalizer`.
3. **Validate** — Component runs `importValidator`; shows per-row errors/warnings with fix suggestions. Bad rows can be skipped.
4. **Confirm** — User dispatches `BULK_IMPORT` with the normalized `Integration[]`.

## Conventions

- **All logic lives in `src/utils/import/`.** This component is presentation + step orchestration only. If you find yourself doing string parsing or validation in this file, move it out.
- **Templates** for users to download come from `src/utils/import/importTemplates.ts`.
- **No partial dispatch.** The component holds intermediate state until the user confirms; only then is `BULK_IMPORT` dispatched. This avoids polluting the store with half-imported data.
- E2E: `e2e/bulk-import.spec.ts`. Unit tests for the pipeline stages are in `src/utils/import/__tests__/`.
