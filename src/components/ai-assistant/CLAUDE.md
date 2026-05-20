# src/components/ai-assistant/

AI-assisted integration draft flow. Lets the user describe an integration in natural language and produces a populated config the wizard can pick up.

## Contents

- `AIAssistant.tsx` — Chat-style input + parsed-result preview.

## Conventions

- **No real LLM call.** This is a local prototype; the "AI" is deterministic string-extraction logic that pulls URL, publisher ID, expiration, etc. out of the user's text using string methods (not regex — see root `CLAUDE.md`).
- Extraction helpers should live in `src/utils/` if they're reusable, or inline if they only serve this component.
- Output is a partial `Integration` config object. Do not dispatch directly; hand the draft to the wizard via `wizardContext` so the user can review/edit before saving.
- E2E: `e2e/ai-assistant.spec.ts`.
