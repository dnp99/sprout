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
selections. Switching groups remounts the report by group ID to clear prior-group filters.

`CashFlowChart` and `SpendingBarChart` accept an opt-in `expanded` presentation.
Only Group enables it: 160px plots, shared metadata-sized axes, visible line
points and bounded inline tooltip feedback. The spending chart adds a native
point selector so daily bars need not be precise touch targets. Personal's
existing default chart presentation and report components are unchanged.

## Mobile identity and detailed analysis

Trends opts into the shared compact account identity: Trends, a bounded Group
badge/chooser and the avatar. The separate mobile page heading is suppressed;
desktop retains its section heading/sidebar and the shared context switch stays
in place. Other pages keep their existing account header behavior.

Detailed spending insights is collapsed initially on mobile and expanded on
desktop. Its chart/ring, category/payer rows and unmatched-period rows share
`useSpendingInsightModel` with Overview. `SpendingInsightFilterFields` and
`SpendingInsightRows` centralize reset, filter choices, selection and comparison
row semantics. Group initially shows five rows per list with View all access.
The displayed cutoff comes from the comparison engine's `cutoffDate`, rather
than an independently guessed display range. Yearly scope identifies its ending
month; it does not pretend the yearly calculation has a daily cutoff.

Payer/category/comparison drafts in the mobile filter sheet apply together.
Reset changes the draft; dismissing it preserves active filters. Desktop fields
apply immediately. Group month/year/ending-month pickers opt into
`ReportPickerSurface`, which reuses Modal for bottom-sheet positioning, focus
trapping, Escape, mobile Back and safe-area handling. The same picker contents
remain ordinary popovers on desktop. Personal picker defaults are unchanged.

## Validation and implementation map

Group's Month / 6 months / 12 months / YTD selector fills the available mobile
content width, matching the report-mode control. Desktop retains intrinsic
control width. Cash Flow expense lines use a dashed pattern in the expanded
presentation, and Group chart marks/legends use the existing chart-brand token
so pale primary surfaces do not substitute for chart ink. Single-period detail
fallbacks retain their Spending label instead of claiming a cumulative baseline.
A stale monthly tooltip key is ignored after drilling into daily points.

Automated checks cover signed refund/void/date-boundary scope, missing versus
empty report history, payer/category intersections, comparison-only categories,
focused-month isolation, six-month CSV contents, Bar/Line switching, sparse and
empty data, list disclosure, sheet draft Apply/Reset/Cancel, period confirmation,
compact header identity and unchanged Personal compact-chart defaults.

Chrome rendered the actual Group report components with synthetic data in a
standalone fixture using the project's processed styles and locale provider.
The matrix covers 320/375/390/430/1024/1440px, all six palette/mode combinations,
both report modes and normal/sparse/empty/large-value data (288 cases). It checks
no page overflow, two/four-column KPIs, 44px report-control heights, full mobile
period width, finite amounts and no Personal store writes. Interactive checks
cover bottom-sheet bounds, period Apply, monthly drill-down, combined payer and
category Apply, Escape dismissal and Bar/Line switching. Desktop and mobile
screenshots were inspected. This fixture substitutes only data/store and account
settings; it does not establish authenticated full-shell routing or physical
installed iOS/Android PWA, keyboard and safe-area behavior. Those remain device
acceptance checks; the existing shared navigation/switcher routes are preserved.
The private dataset behind the brief's amounts was unavailable.

| Area | Changed files |
| --- | --- |
| Group report composition | `src/components/groups/GroupSpendingInsights.tsx`, `GroupMobileTrends.tsx`, `GroupSpendingReport.tsx`, `GroupCashFlowReport.tsx`, `GroupReportCards.tsx`, `GroupDetailedSpendingInsights.tsx` |
| Header integration | `src/components/groups/GroupApp.tsx`, `GroupAccountHeader.tsx`, `GroupHeaderReportControls.tsx`, `src/components/shared/AccountHeader.tsx` |
| Shared reporting presentation | `src/components/shared/CashFlowChart.tsx`, `SpendingBarChart.tsx`, `OverviewSpendingInsights.tsx`, `ReportDateControl.tsx`, `ReportPeriodControl.tsx`, `ReportPickerSurface.tsx`, `SpendingInsightFilterFields.tsx`, `SpendingInsightRows.tsx`, `useSpendingInsightModel.ts` |
| Source and scope | `src/lib/groups/trend-source.ts`, `src/lib/overview-insights.ts` (additive cutoff metadata only) |
| Styling and translations | `src/app/group-trends.css`, `src/app/root-document.tsx`, all four `src/messages/*.json` catalogs |
| Regression coverage | Colocated `trend-source`, `GroupReports`, `GroupDetailedSpendingInsights`, `ReportCharts`, `ReportPeriodControl` and `AccountHeader` tests |
| Documentation | This document, `docs/design-system.md`, `plans/033-group-trends-redesign.md` |
