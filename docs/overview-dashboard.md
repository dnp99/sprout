# Overview Dashboard

Sprout's Overview is meant to answer two questions quickly:

- what setup is still blocking a useful budget workflow
- how current spending compares with a meaningful baseline

## Get started

The first-run checklist is a derived card shown on mobile Home and web
Overview.

- it hides itself once every `required` item is complete
- it shows a progress ring based on completed items vs total items
- each row deep-links into the setup flow it represents

The current checklist uses:

- set monthly budget
- add first transaction
- set up recurring bills or income
- pick a savings goal

Budget and first transaction remain the required items because they unlock the
core budget and reporting surfaces.

## Spending comparison

Overview now uses a cumulative comparison chart instead of the old small
6-month spark chart.

The chart is intentionally lighter-weight than the dedicated Trends page:

- one selector
- one current-period series
- one comparison baseline
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

This keeps the Overview chart honest while still making it quick to read.
