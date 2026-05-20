# src/models/

Shared TypeScript types. This is the single source of truth for domain shapes.

## Contents

- `appTypes.ts` — All domain types: `Integration`, `Campaign`, `TestRun`, `ActivityEvent`, action payloads, config sub-shapes.

## Conventions

- **One file, one source of truth.** Do not redefine these types in components or utilities. Import from here.
- Use `interface` for object shapes that may be extended, `type` for unions and aliases. Prefer discriminated unions (e.g., `Integration.direction`, `Integration.type`) over optional fields.
- Breaking changes to persisted shapes (`Integration`, `Campaign`, `TestRun`, `ActivityEvent`) require bumping `STORAGE_VERSION` in `src/store/AppStore.tsx`.
- Keep this file pure types — no runtime code, no Zod schemas (those live next to their consumers, e.g. `src/utils/import/importSchema.ts`).
