# src/components/campaigns/

Campaign list and detail views. Campaigns are logical groupings that hold publisher sources and buyer targets.

## Contents

- `CampaignList.tsx` — Index of all campaigns with summary metrics.
- `CampaignDetail.tsx` — Single-campaign view: attached integrations grouped by direction (`publisherSources`, `buyerTargets`), nested routing display, "Add Integration" entry point.

## Conventions

- **Launching the wizard from a campaign** sets `wizardContext` in `App.tsx` so the wizard pre-fills the campaign and direction. Don't bypass this — direct dispatches from these components would lose that context.
- **Nested routing**: integrations can live both at the top level and inside `campaign.config.publisherSources[]` / `buyerTargets[]`. Read these from the campaign, not by re-querying `integrations[]`, so the routing tree stays coherent.
- Aggregation (e.g. total calls per campaign, error rate) goes through selectors in `src/store/selectors.ts`.
- Deleting a campaign should not orphan integrations — that's a reducer concern; don't try to "clean up" from the component.
