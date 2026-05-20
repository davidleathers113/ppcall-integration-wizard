# src/components/developer/

In-app developer documentation. Reference material for integration types, token syntax, JSON-path syntax, and example payloads.

## Contents

- `DeveloperDocs.tsx` — Static reference page. Tabs or sections for each integration type and utility.

## Conventions

- **This is reference content, not interactive tooling.** Code samples are copy-paste examples; do not turn this into a live playground (use `test-console/` for that).
- **Examples must stay in sync with reality.** If you change token syntax (`tokenResolver.ts`), JSON-path semantics (`jsonPath.ts`), or `Integration` config shapes, update the examples here in the same PR.
- Use the same syntax-highlight component everywhere — don't inline different styling per section.
- Long-form docs that aren't user-facing belong in `/docs/`, not here.
