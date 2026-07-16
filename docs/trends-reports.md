# Trends & reports

Trends has two modes, chosen by a top-of-view toggle (see
[Cash flow](#cash-flow-mode-toggle) below): **Cash flow** (default —
income vs. expenses vs. net) and **Spending**, the period-aggregate report
described first here.

The **Spending** report is a **period-aggregate** view (from the "Budget App"
claude.ai/design handoff), not a single-month view. The user picks a reporting
period and every panel rolls up that whole window.

## Periods

`TrendPeriod` (in [`../src/lib/reports.ts`](../src/lib/reports.ts)) — stored in
the app store as `trendPeriod` (default `"6m"`):

| Value   | Toggle label (web / mobile) | Window                                      |
| ------- | --------------------------- | ------------------------------------------- |
| `month` | This month / Month          | The anchor month only                       |
| `6m`    | Last 6 months / 6 mo        | Trailing 6 calendar months                  |
| `12m`   | Last 12 months / 12 mo      | Trailing 12 months                          |
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
  equal window. For the single `month` period the chart switches to **daily**
  spend within the selected month; `6m`, `12m`, and `YTD` stay **monthly**. The
  chart also returns the exact localized prior `comparisonLabel`, plus a shared
  rounded currency axis (`yTicks` and `axisMaxCents`). Web and mobile render
  those values through `SpendingBarChart`, which keeps day/month ticks in a
  separate x-axis row and shows visible y-axis labels and gridlines. A live
  single-month report compares month-to-date spend with the previous month
  through the same day, exposed as `comparisonThroughDay`, rather than comparing
  a partial month against a completed one.

## Cash flow (mode toggle)

Trends has two modes, chosen by a `Cash flow` ⇄ `Spending` toggle at the top of
the view (`trendView` in the store, default **`cashflow`**). "Spending" is the
period-aggregate report above; "Cash flow" is the income-vs-expenses view from
plan [012](../plans/012-cash-flow-redesign.md).

Unlike the spending report, cash flow uses a **fixed trailing-6-month window**
(ending at the latest month with data) and does **not** share the period control.
A **focused-month stepper** (`‹ July 2026 ›`) replaces it in the desktop and
mobile headers. Tapping a chart bar uses the same shared `cashFlowMonthKey`.
The focused month drives the summary + breakdowns.

The numbers come from a pure view-model,
[`src/lib/cash-flow.ts`](../src/lib/cash-flow.ts) (colocated `cash-flow.test.ts`),
composed for the UI by the shared
[`useCashFlow`](../src/components/shared/useCashFlow.ts) hook so web + mobile render
identical figures. It reuses the same `excludeFromBudget` exclusion as everything
else, so cash flow ties out to the budget.

- **`monthlyCashFlow(txns, keys)`** → `{ key, label, incomeCents, expenseCents,
netCents }[]` — drives the chart (income up / expense down with a net line, or a
  two-line view; toggled `Bar` ⇄ `Line`, shared
  [`CashFlowChart`](../src/components/shared/CashFlowChart.tsx)).
- **`cashFlowSummary(month)`** → the four-up stat row: income, expenses, **total
  savings** (net, signed), **savings rate** (`net ÷ income`, whole-number %; `—`
  when income is 0). Goal contributions do **not** count as saved.
- **Breakdowns** for the selected month, each a share-of-total row list:
  - Income — `incomeByCategory` / `merchantBreakdown(…, true)` (`Category` |
    `Merchant`).
  - Expenses — `categoryBreakdown` / `merchantBreakdown(…, false)` / **`Group`**
    (`expenseByGroup`), where Group collapses spend into **Fixed vs Flexible**
    reusing 011's `isFixedCategory` classifier (recurring-backed + bills/rent
    fallback). Group is expense-only — income has no fixed/flexible sense.
- **`projectMonthPace(month, now)`** → a straight-line full-month **spend**
  estimate for the in-progress month (`actual × daysInMonth ÷ daysElapsed`),
  drawn as a dashed ghost on the current month's expense bar + a caption
  formatted as `Estimated month-end spending: $X · D/N days so far.` `null` for
  past months.
- **`cashFlowCsv` / `cashFlowCsvFilename`** → the `Export CSV` button downloads the
  6-month table (Month / Income / Expenses / Net) client-side via
  [`downloadTextFile`](../src/lib/download.ts) — no server round-trip.

## UI

- Shared [`TrendPeriodToggle`](../src/components/shared/TrendPeriodToggle.tsx) —
  `compact` for mobile (short labels, full width), full labels for the web header.
- Web: [`views/Trends.tsx`](../src/components/web/views/Trends.tsx); the toggle
  lives in the app-shell header (`WebApp`). Mobile:
  [`screens/Trends.tsx`](../src/components/mobile/screens/Trends.tsx), a pushed
  screen reached from Categories.
