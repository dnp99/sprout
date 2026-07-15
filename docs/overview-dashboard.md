# Overview Dashboard

Sprout's Overview is meant to answer two questions quickly:

- what setup is still blocking a useful budget workflow
- how current spending compares with a meaningful baseline

## Get started

The first-run checklist is a derived card shown on mobile Home and web
Overview.

- it stays visible after the core setup is complete so Home / Overview keep a
  stable top section
- the checklist body automatically collapses after the required setup is
  complete; users can reopen it to reach optional setup
- it shows a progress ring based on completed items vs total items
- each row deep-links into the setup flow it represents

The current checklist uses:

- set monthly budget
- add first transaction
- set up recurring bills or income
- pick a savings goal

Budget and first transaction remain the required items because they unlock the
core budget and reporting surfaces. Once they are done, the card shifts from
`Get started` to a softer completed-state message and collapses its task list
instead of disappearing.

## Spending comparison

Overview now uses a cumulative comparison chart instead of the old small
6-month spark chart.

The chart is intentionally lighter-weight than the dedicated Trends page:

- one selector
- one current-period series
- one comparison baseline when it has meaningful spending
- one top-line answer about whether spending is up or down

### Presets

- `This month vs. last month`
- `This month vs. average month`
- `This year vs. last year`

### Comparison rules

The shared derivation lives in
[`src/lib/overview-comparison.ts`](../src/lib/overview-comparison.ts).

- expense-only: income and `excludeFromBudget` rows are ignored
- month comparisons are cumulative by day of month
- the current month is compared against the other baseline at the same
  day-of-month, so a partial month is not compared against a finished month
- the yearly view compares this year against last year at the same month of the
  year, not against the prior year's full December total
- when the selected comparison baseline has no spending through the matching
  point, Overview switches to individual daily/monthly spend bars and says that
  there is no baseline to compare rather than rendering a misleading zero line

This keeps the Overview chart honest while still making it quick to read.

## Month summary

Home / Overview lead with a single calmer month-summary card rather than a loud
solid hero plus a separate KPI strip.

- the primary read is still `safeToSpendCents` (`Left this month`)
- supporting context stays in the same card: spent vs budget progress, then
  `Spent`, `Net`, and `Income`
- `Net` is the monthly cash-flow figure (`income - spent`), so it may be
  positive or negative; it is intentionally not labeled `Saved`
- mobile and web use the same information hierarchy, with spacing scaled per
  surface rather than different summary concepts
