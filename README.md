# Self-Service PPCall Integration Studio

Self-Service PPCall Integration Studio is a mock self-service management environment for Pay-Per-Call publisher/supplier and buyer integrations. It demonstrates how campaign routing, normalized integration JSON, wizard flows, raw configuration, test simulation, bulk import, and AI-assisted setup can share the same front-end state model.

This is a local prototype only. It is not connected to real telecom carriers, SIP infrastructure, buyer APIs, publisher endpoints, authentication, billing, or production databases.

## Product Areas
- Dashboard and integration health
- Campaign list and campaign detail
- Publisher and buyer integration management
- Add Integration wizard (including Direct Number and Direct SIP targets)
- Raw JSON editor for normalized integration objects
- Test console simulation
- Bulk CSV/JSON import
- AI assistant-style draft configuration
- Developer/API documentation
- Activity history

## Buyer Target Modes

Buyer integrations come in two distinct flavors:

- **Direct Targets** route calls to a fixed number or SIP destination. They do **not** make HTTP requests and do **not** require JSON request/response parsing. Configuration centers on destination, call handling (connection timeout, recordings, dial IVR), schedule, caps, duplicate rules, revenue recovery, shareable tags, and predictive routing.
  - *Direct Number Target* — call routes to a `+E164` phone number.
  - *Direct SIP Target* — call routes to a `sip:user@host` URI, optionally with custom SIP headers.
- **RTB / Webhook / Generic API Targets** make a real HTTP request per call and parse the buyer's response. They require URL, method, request body / query params, response parsing (accepted path, destination path, bid path, etc.).

The studio surfaces this distinction in the Add Integration wizard, the buyer configuration form, the test console (direct targets check destination, schedule, caps; RTB targets check request/response parsing), and the CSV import schema.

All imported or AI-generated buyer integrations are saved as `draft` or `needs_testing`. Activation requires a passing stored test, regardless of how the integration was created.

## Getting Started

Install dependencies:
```bash
npm install
```

Start the local development server:
```bash
npm run dev
```

Build and lint:
```bash
npm run build
npm run lint
```

State is seeded from mock data and persisted in browser `localStorage`. Use a fresh browser profile or clear local storage if you want to return to the seeded data.
