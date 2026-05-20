# src/components/wizard/

Add Integration wizard — the primary onboarding flow for new publisher sources and buyer targets.

## Contents

- `AddIntegrationWizard.tsx` — Multi-step wizard. Local state holds the draft `Integration`; on the final step it dispatches `ADD_INTEGRATION` (or attaches to a campaign).

## Flow

1. **Direction** — Publisher source or buyer target. May be pre-set by `wizardContext` when launched from a campaign.
2. **Type** — `static_number` | `rtb` | `sip` | `webhook` | `generic_api`. Field set on later steps depends on this choice.
3. **Config** — Type-specific form. Defaults from `src/utils/buyerConfigDefaults.ts` for buyer flows.
4. **Test (optional)** — Run `simulateIntegrationTest()` to validate before saving.
5. **Save** — Dispatch `ADD_INTEGRATION`. If `wizardContext.campaignId` is set, also attach to that campaign.

## Conventions

- **`wizardContext` is the launch-context contract** with `App.tsx`. Read it on mount to pre-fill direction / campaign; clear it when the wizard closes so the next launch starts clean.
- **Draft state is local** until the final dispatch. Do not write half-built integrations to the store — the user can abandon the wizard at any step.
- **AI Assistant handoff**: when `AIAssistant.tsx` produces a draft, it lands in `wizardContext` as a partial config. Merge it over the type defaults, not under them.
- **Validation = Zod**, same schemas the import pipeline uses (`src/utils/import/importSchema.ts`). One source of truth for "what makes a valid integration."
- **`data-testid` on every step's Next/Back/Save button.** `e2e/wizard-flow.spec.ts` walks the full flow.
