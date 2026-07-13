# 012 — Cash flow view

**Status:** Proposed · **Created:** 2026-07-11 · **Decisions locked:** 2026-07-11

## Outcome

Give Sprout a real **cash-flow** view — income vs. expenses vs. net over time,
plus a savings rate — instead of today's spending-only Trends screen. The
question it answers:

> Am I saving or dipping into savings, how has that trended, and what's driving
> each side this month?

Like 010/011, this stays privacy-first: everything is derived from the user's own
transactions. No bank aggregation, no new schema.

## Goal

Today the Trends screen
([`src/components/web/views/Trends.tsx`](../src/components/web/views/Trends.tsx))
is **spending-only**:

- one-color monthly **spend** bars (no income, no net)
- a single "Spending · <period>" total with a change %
- a top-5 **category** spend breakdown

It never shows income alongside expenses, the **net** (saved / overspent), or a
**savings rate** — the core of a cash-flow view (and what the Monarch reference
leads with). This plan adds that without a second analytics surface to maintain.

## Product decisions

### 1. Cash flow evolves Trends, it is not a new nav item

Sprout's left nav is already full (Overview, Transactions, Budget, Trends, Goals,
Bills, Import, Settings). Rather than add a ninth item, **Trends becomes the
cash-flow home**: a chart-mode toggle (`Cash flow` ⇄ `Spending`) at the top, with
Cash flow as the default. This keeps one analytics screen, shared web/mobile.
The default range is the **last 6 months** (matching today's Trends).

### 2. Income and expense both come from transactions

`monthTotals(transactions, monthKey)` already returns
`{ incomeCents, spentCents }` per month (excluding `excludeFromBudget` rows).
Net = income − spent; savings rate = `net / income` (clamped, 0 when income is 0).
No schema, no new source of truth.

### 3. Category / Merchant breakdowns in v1; "Group" later

The reference offers Category / Group / Merchant toggles. Sprout has categories
(`categoryBreakdown`) and merchants (`topRecurringMerchants`) but **no category
"group" model** yet. v1 ships **Category** and **Merchant**; "Group" is deferred
and should reuse whatever fixed/flexible grouping 011 introduces, not invent a
parallel one.

## Current behavior

Useful building blocks already exist:

- [`monthTotals`](../src/lib/trends.ts) → income + spent for one month.
- [`periodMonthKeys` / `monthlySpendForKeys`](../src/lib/reports.ts) → the month
  windows behind the `month | 6m | 12m | ytd` period control.
- [`categoryBreakdown`](../src/lib/trends.ts) and
  [`topRecurringMerchants`](../src/lib/trends.ts) → breakdown rows.
- [`buildTrendsReport`](../src/lib/reports.ts) → the current spending report shape
  the Trends view consumes.

The gap is purely that none of these are composed into an **income + expense +
net** series or a savings-rate stat.

## Proposed UX

### Header

- Title `Cash flow` + a mode toggle (`Cash flow` / `Spending`) so the existing
  spending report stays reachable.
- Reuse the existing period control (`month | 6m | 12m | ytd`) — mapped to the
  reference's Monthly / Quarterly / Yearly framing later.

### The chart

- Per month: an **income** bar (up, `text-green` fill) and an **expense** bar
  (down, `bg-primary`/`primary-dark` fill), with a **net line** overlaid.
- Current month highlighted; projected/partial current month drawn dashed (as the
  reference does) once we have a pace estimate — otherwise just highlighted.
- Click a month to drill in (reuse the existing bar-drill interaction).

### Month summary stats

A four-up stat row for the selected month:

- **Income** (green), **Expenses** (primary), **Total savings** (net, signed),
  **Savings rate** (%).

### By category / merchant

Two breakdown blocks — **Income** and **Expenses** — each with a
`Category | Merchant` toggle and a share-of-total bar per row (percent + amount),
mirroring the reference's stacked rows but in Sprout's lighter card style.

## Technical approach

### Shared view-model: `src/lib/cash-flow.ts` (pure, unit-tested)

Derives everything the view needs from transactions + a period:

- `monthlyCashFlow(transactions, keys)` → `{ key, label, incomeCents,
  expenseCents, netCents }[]` (composes `monthTotals` over `periodMonthKeys`).
- `cashFlowSummary(...)` for the selected month → income, expense, net, savings
  rate.
- `incomeByCategory(...)` (a positive-side sibling of `categoryBreakdown`, which
  today only sums spend) + reuse `categoryBreakdown` / `topRecurringMerchants`
  for the expense/merchant sides.

Keeping this pure mirrors 010's reconciliation lib and 011's `budget-view.ts`, so
web and mobile render identical numbers.

### Web / mobile

- **Web:** extend [`Trends.tsx`](../src/components/web/views/Trends.tsx) with the
  mode toggle + a `CashFlow` sub-view (chart, stat row, breakdowns). Keep files
  under the ~500-line ceiling — extract the chart and breakdown into small
  components under `components/web/views/` or `components/ui/`.
- **Mobile:** mirror in [`Trends`](../src/components/mobile/screens/Trends.tsx):
  stacked summary stats, a compact income/expense chart, then the breakdowns.

## UI slices

- **Phase 1** — `cash-flow.ts` view-model + tests; Trends mode toggle; the
  income/expense/net chart; the four-up summary; Category breakdowns (income +
  expense). Web and mobile.
- **Phase 2** — Merchant breakdown toggle; Quarterly/Yearly aggregation; a
  bar/line chart-type toggle; dashed current-month pace projection.
- **Phase 3** — "Group" breakdown once 011's grouping model lands; optional
  CSV/share export of the cash-flow table.

## New / touched files

- **New:** `src/lib/cash-flow.ts` + `src/lib/cash-flow.test.ts`.
- **Touched:** `src/components/web/views/Trends.tsx` (mode toggle + cash-flow
  sub-view), `src/components/mobile/screens/Trends.tsx`, and small extracted chart
  / breakdown components. `docs/trends-reports.md` updated to describe the
  cash-flow model.

## Risks

- **Chart density on mobile** — up/down bars + a net line is a lot at phone width;
  the mobile version may drop the net line for a simpler income/expense pair.
- **Mode toggle vs. two screens** — folding cash flow into Trends risks a busy
  header; keep the toggle minimal and default to Cash flow.
- **Savings-rate edge cases** — zero/near-zero income months must not divide by
  zero or show wild percentages; clamp and show `—` when income is 0.

## Decisions (locked 2026-07-11)

- **Placement** — a mode toggle **within Trends** (Cash flow default), not a new
  nav item.
- **Default range** — the **last 6 months** (matches today's Trends).
- **Savings rate** — **net income only**: `(income − expenses) / income`, clamped;
  `—` when income is 0. Goal contributions do **not** count as saved (keeps the
  stat consistent with the net line; revisit if 011's Contributions land).
- **Excluded rows** — transfers / `excludeFromBudget` rows stay **excluded**,
  consistent with `monthTotals` and the budget, so cash flow ties out to the rest
  of the app.

## Non-goals

- bank / account aggregation or sync
- a separate second analytics screen to maintain
- category "Group" breakdown in Phase 1 (waits on 011)
- backend schema changes
