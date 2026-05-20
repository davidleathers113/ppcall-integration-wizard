# src/utils/import/__fixtures__/

CSV fixtures consumed by import tests.

## Contents

- `valid-buyer-rtb.csv` — Happy-path RTB buyer rows. All required fields present, well-formed.
- `duplicate-names.csv` — Multiple rows with the same `name`. Drives the de-duplication / warning logic in `importValidator.ts`.
- `quoted-commas.csv` — Fields containing commas inside double quotes. Drives CSV parsing correctness in `importParser.ts`.

## Conventions

- **Keep fixtures small** — 3-10 rows is plenty. Tests should be readable; a 200-row fixture buries the intent.
- **Each fixture targets one concern.** Name it for the concern (`quoted-commas.csv`), not the integration type.
- **Do not include real customer data** — even fake-looking phone numbers and emails should obviously be synthetic.
- When adding a fixture, add a corresponding test in `../__tests__/`. An unused fixture is a maintenance liability.
- CSV only here. JSON fixtures live inline in the test files since they're easy to express as object literals.
