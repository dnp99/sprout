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
Only Group enables it: 160px mobile / 140px desktop spending plots, shared metadata-sized axes, visible line
points and bounded inline tooltip feedback. The spending chart uses a bounded selected-bar detail instead of a redundant
point dropdown. Personal's
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
| Source and scope | `src/lib/groups/trend-source.ts`, `src/lib/groups/report-presentation.ts`, `src/lib/overview-insights.ts` (additive cutoff metadata only) |
| Styling and translations | `src/app/group-trends.css`, `src/app/root-document.tsx`, all four `src/messages/*.json` catalogs |
| Regression coverage | Colocated `trend-source`, `GroupReports`, `GroupDetailedSpendingInsights`, `ReportCharts`, `ReportPeriodControl` and `AccountHeader` tests |
| Documentation | This document, `docs/design-system.md`, `plans/033-group-trends-redesign.md` |


## Focused UX polish

Group's Spending chart has no extra day dropdown. Tapping/focusing a daily bar
selects it, outlines the mark, and retains a localized date/amount detail after
pointer leave. Before selection the detail gives a short tap instruction.
Monthly bars retain immediate month drill-down. Personal chart defaults remain
unchanged. Future metadata is derived from actual, non-excluded financial dates
using the reporting engines' UTC calendar-day convention. Stripes identify
points containing future-dated expense/refund entries; a monthly point can mix
past and future entries, which the legend explicitly discloses. Future income is
included in the future-entry scope count but never invents an expense bar.
No values, bucket calculations or Cash Flow projections are changed.

The summary shows a localized period and All transactions, with a separate
future-entry count only when needed. Comparison scopes name the localized
cutoff and comparison period; methodology lives in an accessible disclosure.
The collapsed mobile detail entry shows a short introduction and an explicit
primary Explore arrow action; filters and comparison scopes remain inside its
expanded area. Supporting rows use smaller vertical padding, secondary inline
percentages/visits and no repeated separators. View all remains available and
resets on a period/month change rather than on a mode switch.

The shared mobile frame really has a 440px cap. It does not constrain the
requested 320–430px phone widths, but can produce a narrow column in larger
emulated mobile viewports. Group Trends alone lifts that cap below 1024px;
existing content padding and desktop widths remain unchanged. Native/PWA safe
areas still require physical-device verification.


Polish validation: lint and the webpack production build/type check pass. The
full unit suite passes 847 tests (50 environment/integration skips). New tests
cover UTC future-day boundaries, excluded/income classification, persistent bar
selection and removal of the redundant dropdown. The component browser matrix
was repeated with future-dated records and 1,000-record data, all six themes,
both report modes and six widths. The 600px frame and selected future-bar states
were also checked. Physical Safari/PWA safe areas remain unverified.

## Detailed analysis cards and period ownership

Detailed analysis now has its own two-card layout: Spending distribution and
Cumulative spending comparison. Desktop cards align at the top without equal
heights; mobile stacks distribution/legend before comparison. At wide desktop
sizes the compact, scrollable legend sits beside the donut. Mobile shows five
rows with View all / Show less, including comparison-only rows. Negative credits
remain in that list and in the signed centre/headline total; they do not occupy
positive donut area.

The header names both periods. Monthly scope text identifies both same-progress
cutoffs, clamping shorter prior months; yearly scope identifies the ending month
in each year. Frequency, grouping, payer, category and month navigation occupy
one wrapping desktop toolbar. Reset appears only for non-default analytical
filters. Mobile keeps period navigation visible, shows an active-filter count,
and stages advanced choices in the existing safe-area sheet with Apply, Cancel
and conditional Reset.

The comparison month follows the main month while no independent date has been
chosen. An explicit detail month/day selection creates an independent analytical
anchor and never calls the main report's month callback. Follow main report
clears that override without changing payer/category/grouping/preset choices.
An exact-day filter from a previous linked month is ignored in display/counts
when it no longer applies. This separates different report windows without
maintaining a second anchor until the user requests one.

Group uses the existing semantic chart palette in stable identity order through
`groupInsightColors`. Ring slices and legend rows share exactly the same color
utility. Small gaps separate neighbouring segments, tiny shares show <1%, and
ring segments support hover, focus, Enter/Space and tap filtering. Empty/credit-
only distributions have a neutral ring and an explicit no-positive-spending
message. Personal defaults are unchanged.

The Group comparison uses cumulative values even when the comparison is zero.
`groupCumulativeComparison` changes only chart mode and its visible-point axis;
all signed cents and same-progress points remain the existing engine's output.
A solid selected line and dashed comparison line stay distinct, including when
they coincide. Opt-in localized feedback shows both amounts for a selected date
in a fixed, scrollable in-card area, defaulting to the cutoff point. Hit areas
are bounded to the plot, axes use compact localized dates, and keyboard focus
uses a semantic outline. The shared chart's Personal behavior remains default.

### Demo-total audit

A read-only audit of the isolated fictional preview confirms the supplied
example: November 1–11, 2026 totals 671,209 cents and October 1–11 totals 166,023
cents. Full October totals 362,421 cents. The November full-month total happens
to equal its through-November-11 total in this fixture (net difference zero).
The donut centre, category-row sum and cumulative endpoint all reconcile to
671,209 cents with default payer/category filters. No financial defect or
calculation change was needed. These are preview-fixture results, not a claim
about another account or database. UTC boundaries, exclusions, signed refunds
and actual payer identity remain governed by the same report engines.

Changed files for this refinement: `GroupDetailedSpendingInsights.tsx`, the new
`GroupInsightCharts.tsx`, shared `CategorySpendingRing.tsx`,
`SpendingInsightRows.tsx`, `SpendingInsightFilterFields.tsx`,
`ui/ComparisonAreaChart.tsx`, `lib/groups/report-presentation.ts`, scoped
`group-trends.css`, four translation catalogs and colocated regression tests.

Refinement validation: focused tests cover independent date navigation, default
Reset visibility, sheet Apply/Reset/Cancel, tiny-share metadata, stable palette
slots, cumulative zero baselines, visible-point scaling, same-progress labels
(including leap-year clamps), ring keyboard selection and bounded two-value
comparison feedback. Lint and the webpack production build/type check pass.
Expanded-detail Chrome fixtures cover 180 combinations of six widths, all six
palette/modes and normal/sparse/empty/large-value/1,000-record data. They assert
stacked/two-column card geometry, no page overflow, matching ring/legend colors,
multiple palette slots and centre/headline reconciliation. Screenshots were
inspected and keyboard/two-series feedback exercised. These fixtures do not
establish physical Safari/PWA safe-area behavior or an authenticated full-shell
navigation matrix; those remain device acceptance checks.
