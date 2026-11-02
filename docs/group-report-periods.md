# Group mobile report periods

Group mobile Trends (Cash flow and Spending), Budget and Goals share the
`ReportPeriodControl` in their title area. Cozy and Vibrant use the same controls
with their existing semantic palettes. Desktop and Personal keep their controls.

- Month selects a complete calendar month, never an individual day.
- 6 mo and 12 mo select a rolling window ending in the chosen month.
- YTD selects a year. The current year ends at the current calendar month;
  another year ends in December. All endpoints are inclusive whole months.
- Clicking the active segment reopens selection. Apply commits period and anchor
  together; Escape or outside dismissal leaves the report unchanged.

Group Spending uses the explicit anchor for every period. Cash flow uses the
same month keys for its chart, CSV, income/expense/net/savings summary and all
breakdowns. Selecting a cash-flow bar drills back to Month. Personal's existing
focused-month behavior remains unchanged. Payer/comparison analysis below the
Spending report retains its own labeled comparison controls.

Budget retains the existing summary and category form layout. Multi-month views
sum the actual saved budget and summary for each included month, including months
without saved plans and signed refunds. Aggregate values are read-only; Month
retains normal editing. Reads are aborted when their scope changes, and only
snapshots at the same group revision are combined. An authorization/read failure
or concurrent revision change produces an error rather than a partial total.

Goals keeps its cards and current progress values. The chosen range filters
goals by target month; undated goals stay visible. The displayed note makes clear
that saved amounts are current balances, not contributions made during the range.
There is no historical goal balance/contribution series in the current schema;
reporting those figures would require a separate data-model and migration slice.

Regression coverage lives in `ReportPeriodControl.test.tsx`,
`useCashFlow.test.tsx`, `period-report.test.ts`, and the existing cash-flow and
report domain suites. No schema migration or financial write is introduced.
