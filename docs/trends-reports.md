# Trends & reports

The Trends view is a **period-aggregate report** (from the "Budget App"
claude.ai/design handoff), not a single-month view. The user picks a reporting
period and every panel rolls up that whole window.

## Periods

`TrendPeriod` (in [`../src/lib/reports.ts`](../src/lib/reports.ts)) — stored in
the app store as `trendPeriod` (default `"6m"`):

| Value   | Toggle label (web / mobile) | Window |
| ------- | --------------------------- | ------ |
| `month` | This month / Month          | The anchor month only |
| `6m`    | Last 6 months / 6 mo        | Trailing 6 calendar months |
| `12m`   | Last 12 months / 12 mo      | Trailing 12 months |
| `ytd`   | Year to date / YTD          | January of the anchor's year → anchor month |

The window is **anchored to the latest month with data** (not a live clock), so
it tracks the seeded dataset and stays testable. Clicking/tapping a bar in the
spending chart drills the report into that single month (sets `trendPeriod =
"month"` + `trendMonthKey`); switching the period toggle clears `trendMonthKey`.

## The report

`buildTrendsReport(transactions, period, anchorKey?)` returns everything the view
renders — pure, colocated tests in `reports.test.ts`. Internal moves
(`excludeFromBudget`) are excluded so totals match the budget math.

- **Summary stats:** `incomeCents`, `spendingCents`, `netCents`, `txnCount` over
  the window, plus `rangeLabel` (e.g. "Feb–Jul 2026") and `periodLabel`.
- **`byCategory`:** expense per category with its share (`pct`) of window spend.
- **`topMovers`:** per-category spend delta vs the **previous equal-length**
  window (negative = spent less = green; positive = terracotta).
- **`frequentSpots`:** most-visited merchants in the window (ranked by visit
  count — unlike the Home habit widget, no min-span filter).
- **`chart`:** a monthly spending series with total + `changePct` vs the prior
  equal window. For the single `month` period the chart still shows 6 months of
  context so it doesn't collapse to one bar; every other period's chart matches
  its window.

## UI

- Shared [`TrendPeriodToggle`](../src/components/shared/TrendPeriodToggle.tsx) —
  `compact` for mobile (short labels, full width), full labels for the web header.
- Web: [`views/Trends.tsx`](../src/components/web/views/Trends.tsx); the toggle
  lives in the app-shell header (`WebApp`). Mobile:
  [`screens/Trends.tsx`](../src/components/mobile/screens/Trends.tsx), a pushed
  screen reached from Categories.
