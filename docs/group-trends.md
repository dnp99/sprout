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
