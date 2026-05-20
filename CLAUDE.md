# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Self-Service PPCall Integration Studio is a mock self-service management environment for Pay-Per-Call publisher/supplier and buyer integrations. This is a **local prototype only** with no real backend, telecom infrastructure, or production systems.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
tsc -b && vite build

# Lint
npm run lint

# Tests
npm test           # Run all tests once
npm run test:watch # Watch mode

# Preview production build
npm run preview
```

## Architecture Overview

### State Management (Redux-like Pattern)

The app uses a **centralized state store** with reducer pattern:

- **Store**: `src/store/AppStore.tsx` - React Context provider with `useReducer`
- **Reducer**: `src/store/appReducer.ts` - All state mutations via dispatched actions
- **Persistence**: Entire state auto-persisted to `localStorage` with versioning (`STORAGE_VERSION`)
- **Initial Data**: Seeded from `src/data/mockData.ts`

State shape:
```typescript
{
  campaigns: Campaign[]
  integrations: Integration[]
  testRuns: TestRun[]
  activityEvents: ActivityEvent[]
}
```

To reset state: Clear browser localStorage or increment `STORAGE_VERSION` in `AppStore.tsx`.

### Core Domain Model

**Integration**: Represents either a publisher source OR buyer target configuration.
- `direction`: "publisher" | "buyer"
- `type`: "static_number" | "rtb" | "sip" | "webhook" | "generic_api"
- `config`: Normalized JSON object containing endpoint, tokens, parsing rules, caps, schedules

**Campaign**: Logical grouping for integrations. Publisher sources and buyer targets can be attached.

**Nested Routing**: Campaigns can contain `publisherSources[]` and `buyerTargets[]` within their integration configs for multi-tier routing.

### Component Organization

```
src/components/
  activity/          - Activity/event history
  ai-assistant/      - AI draft configuration flow
  bulk-import/       - CSV/JSON bulk import wizard
  campaigns/         - Campaign list and detail views
  dashboard/         - Overview with health metrics
  developer/         - API/integration documentation
  integrations/      - Integration list, detail, forms
  layout/            - Sidebar navigation
  shared/            - Reusable UI components (Card, Badge, etc.)
  test-console/      - Test simulation UI
  wizard/            - Add Integration wizard flow
```

### Key Utilities

**Token Resolution** (`src/utils/tokenResolver.ts`):
- Resolves `{{caller_id}}`, `{{zip}}` etc. in integration configs
- Used when constructing buyer API requests from publisher inputs

**JSON Path Extraction** (`src/utils/jsonPath.ts`):
- Parses dot-notation paths like `lead.phone_number` or `data.payout`
- Used for response parsing configuration

**Test Simulation** (`src/utils/testSimulation.ts`):
- Client-side mock validation of integration configs
- Generates deterministic test results with checklist items
- Validates required fields, endpoints, parsing rules, timeouts

**Import System** (`src/utils/import/`):
- CSV/JSON parsing with PapaParse
- Intelligent column auto-mapping with confidence scores
- Validation with detailed error messages and fix suggestions
- Normalizes imported data to `Integration` schema

**Freshness** (`src/utils/freshness.ts`):
- Computes integration health status based on `lastUsedAt`, `lastTestedAt`, error rates
- Determines if integration is "stale", "dormant", "needs_retest", etc.

### Navigation Flow

App.tsx manages all routing via simple view state (`currentView` string):
- Single-page app with conditional rendering
- No React Router - views selected via sidebar
- Context preservation: `wizardContext` tracks campaign/direction when launching wizard from campaign detail

### Testing Philosophy

- Unit tests for utilities in `__tests__/` directories
- Test pure functions (tokenResolver, jsonPath, importParser, freshness)
- Use vitest for test runner
- Run single test: `npm test -- -t "test name pattern"`

## Important Patterns

**Adding new integration actions**:
1. Define action type in `appReducer.ts` `AppAction` union
2. Add case in `appReducer` switch statement
3. Dispatch from component via `const { dispatch } = useAppContext()`

**Integration validation flow**:
1. User configures integration in wizard/forms
2. Click "Test" → calls `simulateIntegrationTest()`
3. Creates `TestRun` with checklist items (pass/fail/warning)
4. Dispatch `RUN_TEST` action to update integration status and store test result

**Bulk import flow**:
1. Parse CSV/JSON → `ParsedImportRow[]`
2. Auto-map columns → `ColumnMapping[]`
3. Validate → `ImportValidationResult[]` (with errors/warnings)
4. Preview importable rows
5. Dispatch `BULK_IMPORT` action with normalized `Integration[]`

## Special Considerations

- **No regex**: Project follows strict no-regex policy. Use string methods (`includes()`, `startsWith()`, etc.) or libraries like Zod for validation.
- **LocalStorage only**: All persistence is client-side. No API calls, no backend.
- **Mock data**: Integrations don't actually ping endpoints. Test simulation is deterministic client-side logic.
- **Tailwind CSS**: Uses Tailwind v4 with `@tailwindcss/vite` plugin. Utility-first styling.
- **TypeScript 6.x**: Project uses latest TypeScript. All types defined in `src/models/appTypes.ts`.

## File Naming

- Components: PascalCase (e.g., `AddIntegrationWizard.tsx`)
- Utilities: camelCase (e.g., `tokenResolver.ts`)
- Types: PascalCase interfaces/types in `appTypes.ts`
