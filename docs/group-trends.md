# Group Trends reporting

Both report layers consume `groupTrendSource`, which adapts the complete
authorized `reportEntries` history. Paginated `entries` never stand in for a
loading report. Voided records are removed, refunds retain their signed cents,
income stays income, and payer identity comes from the entry's payer rather than
its author or split shares. Category names retain their full hierarchy.

## Summary and comparison scopes

`buildTrendsReport` includes the complete selected month or multi-month window,
including future-dated entries already recorded. `buildOverviewInsights` uses
same-progress comparisons: the live month stops at today (UTC); an older month
uses its final day. Explicit day selection supplies an exact cutoff. Its payer,
category and comparison-preset filters are independent of the summary.
Both engines net signed refunds and skip income/excluded records for spending.
No Group-specific exclusion flag is invented by the adapter.

Consequently the two totals can intentionally differ for a live month with
future-dated entries, different filters, or different reporting windows. A
synthetic regression reproduces 181,371 cents for the full month and 152,519
cents through November 11 by including a 28,852-cent expense on November 20.
That demonstrates a code-supported explanation for the brief's screenshot
amounts; it does not establish that those private records contain that expense.
The underlying screenshot dataset was not supplied. Historical unfiltered
full-month totals must agree, including refunds and boundary dates.

Cash Flow retains a six-month chart window and a separately focused month for
its KPIs and breakdowns; Spending's period selector must not aggregate it.

## Responsive report hierarchy

Group Trends now mounts one responsive report tree on both surfaces. The mode
selector precedes secondary reporting controls, a uniform two/four-column KPI
row, a full-width 160px plot and supporting analytics. Spending reuses
`buildTrendsReport` for category, frequent-merchant and top-mover rows. Long lists
initially show five rows, with every row available through View all. Money stays
integer cents until the shared formatter; net deficits use danger ink.

Cash Flow reuses `useCashFlow` without its optional aggregate-period override.
It retains focused-month KPIs, six-month chart/CSV data, Bar/Line selection,
pace projections and income/expense breakdowns (category/source, merchant and
fixed/flexible grouping). Limited history adds a focused-month income/expense
comparison without inventing transactions. Spending periods never change this
six-month contract. Hidden mode panels stay mounted to retain breakdown/filter
selections. Switching groups remounts the enclosing Group app as before.

`CashFlowChart` and `SpendingBarChart` accept an opt-in `expanded` presentation.
Only Group enables it: 160px plots, shared metadata-sized axes, visible line
points and bounded inline tooltip feedback. The spending chart adds a native
point selector so daily bars need not be precise touch targets. Personal's
existing default chart presentation and report components are unchanged.
