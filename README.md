# Self-Service PPCall Integration Studio

Self-Service PPCall Integration Studio is a mock self-service management environment for Pay-Per-Call publisher/supplier and buyer integrations. It demonstrates how campaign routing, normalized integration JSON, wizard flows, raw configuration, test simulation, bulk import, and AI-assisted setup can share the same front-end state model.

This is a local prototype only. It is not connected to real telecom carriers, SIP infrastructure, buyer APIs, publisher endpoints, authentication, billing, or production databases.

## Product Areas
- Dashboard and integration health
- Campaign list and campaign detail
- Publisher and buyer integration management
- Add Integration wizard
- Raw JSON editor for normalized integration objects
- Test console simulation
- Bulk CSV/JSON import
- AI assistant-style draft configuration
- Developer/API documentation
- Activity history

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
