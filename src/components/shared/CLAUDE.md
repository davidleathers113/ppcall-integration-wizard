# src/components/shared/

Reusable UI primitives used across feature areas. The bar for adding here is "used by two or more feature directories."

## Contents

- `Card.tsx` — Container with consistent padding, border, shadow.
- `Badge.tsx` — Small status pill. Variants for success / warning / error / neutral.
- `ErrorBoundary.tsx` — Catches render errors, shows a fallback, lets the user reset. Wrap risky subtrees with this rather than letting the whole app blank out.
- `ToastProvider.tsx` — Toast context + `useToast()` hook. Mounted once in `main.tsx`.
- `TokenPicker.tsx` — Picker for `{{caller_id}}` / `{{zip}}` style tokens, used by forms that build buyer requests.

## Conventions

- **No domain knowledge.** A primitive in here should not know about `Integration`, `Campaign`, or any other app type. If it does, it belongs in a feature directory.
- **Presentational only.** No `useAppContext()`, no `dispatch`. Pass data and callbacks in via props.
- **API stability matters.** Many components depend on these — when changing a prop, update all call sites rather than adding a parallel "v2" variant.
- **Toasts**: prefer `useToast()` over rolling your own banner. Keep messages short (<80 chars); detail goes in the UI, not the toast.
- **ErrorBoundary**: wrap at the feature-area level, not per component. One boundary per major view is the right granularity.
