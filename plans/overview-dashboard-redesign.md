# Overview dashboard redesign

Scope: Personal and Group Overview on mobile, tablet and desktop. Keep the existing
navigation, composers, permissions and financial engines.

1. Share metric cards, a content-driven dashboard grid, compact budgets, merchant
   lists and an insights preview. Keep ledger adapters and applied state separate.
2. Opt the existing calendar into independent calendar/recent-record cards while
   retaining its week/month, selected-day and Today/Recent behavior.
3. Personal uses the shared ledger month, current-month API/budget-hero guidance
   and existing totals/current pool when browsing other months. Group uses its
   selected-month summary and saved budget. Label scopes explicitly.
4. Preserve Personal's advanced Overview analysis through an optional section in
   Trends; Group's detailed Trends analysis already exists. Explore actions only
   navigate, retaining each report's period ownership.
5. Use compact Overview mobile identity (superseding the earlier Home greeting),
   preserve desktop period controls, and reserve space for floating add actions.
6. Validate state isolation, missing budgets, refund contributions, calendar scope,
   navigation, all themes and required phone/tablet/desktop widths. Document limits.

Follow-up: [independent Overview columns](overview-independent-columns.md) replaces
row-aligned Calendar/Recent and Budget/Frequent sections. It preserves mobile DOM
order, a single shared calendar controller and half-width preview readability.
