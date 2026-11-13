# Overview: independent card stacks

Approved scope: fix row-induced blank gaps in Personal and Group Overview. Keep
metrics full-width, all accounting/data ownership unchanged and existing card
surfaces, controls and transaction rows intact.

## Layout

- Wide content: Calendar → Budget → Frequent spots in the left column;
  Recent transactions → Spending insights preview in the right column.
- Narrow/tablet/mobile content: metrics → Calendar → Recent → Budget → Frequent
  spots → preview → existing contextual actions. DOM, screen-reader and keyboard
  order must match this single-column sequence.
- Columns stack independently with the existing 16px gap and natural heights.
  Space beneath the shorter overall column is valid; gaps caused by aligning
  individual rows across columns are not. No fixed heights, absolute-positioned
  cards, filler, CSS visual-only mobile reordering or masonry dependency.
- Use available content width, accounting for the app sidebar/mobile max width,
  to switch to two columns only when both calendar/card widths remain readable.
- Keep the preview readable at half width: allow its action to wrap and use
  container-aware category rows rather than viewport-driven three-column rows.

## Shared composition and state

1. Let the existing single `EverydayCalendar` controller expose its two rendered
   cards through an optional layout callback. Pass it through Personal/Group
   calendar adapters; leave other calendar consumers unchanged.
2. Have `OverviewDashboard` compose the callback's Calendar/Recent cards with its
   existing budget/merchant/preview slots in one shared responsive layout.
3. Keep calendar mode, selected date and Today/Recent state above the responsive
   composition, so moving presentational cards at a layout breakpoint does not
   reset those choices. Render exactly one copy of each card at every width.
4. Use responsive component composition so mobile's actual DOM reading order is
   correct, rather than moving duplicate interactive trees with CSS.

## Validation

- Add regression coverage for one-copy rendering, mobile DOM order and retained
  calendar/agenda state across wide/narrow composition changes.
- Run lint, TypeScript/build and relevant calendar/Overview tests.
- Inspect real components with production CSS in both ledgers, all appearances
  and modes, phone/tablet/desktop widths, Week/Month and empty/few/many records.
- Measure immediate stacking gaps, mode-independent calendar width, card overflow
  and bottom clearance. Exercise calendar/list selection and existing callbacks.
- Document implementation, validation and unavailable physical-device/backend
  checks. Do not push or create a PR unless newly requested.

## Completion

Implemented with `OverviewCardLayout` and the single calendar controller's
`renderCards` seam. Full suite: 911 passed / 50 skipped; lint, TypeScript and
production build passed. Production-CSS Chrome validation passed 224 layout
cases plus resize/state/navigation checks. Details and limitations are recorded
in `docs/overview-dashboard.md`. Changes remain local; no push or PR requested.
