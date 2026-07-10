# 010 — Recurring monthly status view

**Status:** Proposed · **Created:** 2026-07-10

## Outcome

Upgrade Sprout's Bills / recurring experience from a flat editable list into a
monthly, status-aware view that answers the real question users have:

> What recurring money has already happened this month, and what is still
> coming?

The target leap is not "prettier rows." It is a real monthly model with:

- month navigation
- income and expense progress for the selected month
- `Upcoming` vs `Complete` grouping
- per-row paid / received state
- eventual calendar view

without introducing bank accounts or account-sync concepts that do not fit
Sprout.

## Goal

Today the web Bills view in
[`src/components/web/views/Bills.tsx`](../src/components/web/views/Bills.tsx)
is basic:

- two stat cards (`Income / mo`, `Out / mo`)
- a flat `All recurring` list
- pause toggle + edit modal

The mobile Bills view in
[`src/components/mobile/screens/Bills.tsx`](../src/components/mobile/screens/Bills.tsx)
is also not month-aware. It shows:

- one `Due this month` card
- `Upcoming`
- `Subscriptions`
- a separate manage-recurring jump

Both surfaces treat recurring items as static schedule rows. They do **not**
answer:

- what is already paid / received this month
- what is still upcoming this month
- how much recurring income has arrived vs remains
- how much recurring outflow is already paid vs remains

The goal is to add that monthly/stateful behavior while staying privacy-first:
no bank sync, no accounts table, no "payment account" column.

## Product decisions

These decisions are locked into the plan unless product direction changes:

### 1. No payment-account / card-sync columns

Sprout does not have bank connections or account objects today, and that is part
of its privacy-first shape. We explicitly **omit**:

- payment account columns
- credit-card-specific surfaces
- bill-sync CTAs
- bank-account reconciliation UIs

Rows stay Sprout-native:

- emoji
- name
- cadence
- due / paid timing
- category
- amount
- paid / received state
- edit / more menu

### 2. Paid detection is derived in v1

We will derive `paid` / `received` by matching recurring items against real
transactions in the selected month.

That means:

- **no schema change in v1**
- no `recurringId` on transactions yet
- no manual `mark as paid` yet

This keeps Phase 1 fast and aligned with the current data model.

### 3. Calendar view is Phase 2

The value unlock is the monthly list view. Calendar is useful, but secondary.
Phase 1 ships the list view first. Calendar follows after the derivation logic is
proven.

## Current behavior

### Existing derivation

Recurring schedule helpers already exist in
[`src/lib/bills.ts`](../src/lib/bills.ts):

- `nextDueDate`
- `daysUntil`
- `dueLabel`
- `deriveUpcomingBills`
- `monthlyBillsTotalCents`
- `recurringFrequencyLabel`

These are cadence-aware after plan 006, but they only derive **schedule**. They
do not reconcile against actual transactions.

### Existing recurring model

[`RecurringItem`](../src/lib/types.ts) already has the fields we need for
schedule derivation:

- `amountCents`
- `cadence`
- `dayOfMonth`
- `dayOfWeek`
- `monthOfYear`
- `paused`
- `isIncome`
- `categoryId`

[`Transaction`](../src/lib/types.ts) already gives enough v1 signals for fuzzy
matching:

- `merchant`
- `amountCents`
- `occurredAt`
- `isIncome`
- `excludeFromBudget`
- `categoryId`

No recurring-transaction link exists today.

### Web gap

[`Bills.tsx`](../src/components/web/views/Bills.tsx) currently computes only
`recurringTotals(recurring)` and renders the raw rows. There is:

- no selected month
- no status grouping
- no progress bars
- no `paid` indicator

### Mobile gap

[`src/components/mobile/screens/Bills.tsx`](../src/components/mobile/screens/Bills.tsx)
derives `Upcoming` and a simple `Subscriptions` grouping, but also has:

- no selected month
- no `Complete`
- no paid / received indicators
- no shared monthly reconciliation logic with web

## Proposed UX

### Primary tabs

- `Monthly`
- `All recurring`

`Monthly` is the new default once items exist. `All recurring` remains the
schedule-management view.

### Monthly header

For the monthly tab:

- selected month label (`July 2026`)
- month nav (`‹`, `›`, `Today`)
- view mode toggle:
  - `List`
  - `Calendar` (Phase 2)

### Progress summary

Replace the current static stats with two month-aware progress cards:

- `Income`
  - `$X received`
  - `$Y remaining`
- `Expenses`
  - `$A paid`
  - `$B remaining`

These are derived from the reconciliation result for the selected month, not
from raw recurring totals alone.

### Grouped monthly list

List view structure:

- `Upcoming`
- `Complete`

Each section shows:

- rows
- section totals (`Income +$…`, `Expenses $…`)

Rows should include:

- emoji
- name
- cadence / schedule label
- due date or relative timing (`Jul 1`, `9 days ago`, `in 3 days`)
- category label when present
- amount
- `✓ Paid` / `✓ Received` state when matched
- edit / overflow action

### All recurring tab

Keep a simpler management tab for:

- reviewing all recurring definitions
- pausing
- editing
- adding new recurring items

This preserves the current "schedule admin" job while letting `Monthly` become
the real cash-flow view.

## The new capability everything depends on

### Reconciliation lib

Add a pure, unit-tested monthly reconciliation helper, likely under
`src/lib/recurring/` rather than growing `bills.ts` into a large mixed-purpose
file.

Recommended shape:

```ts
reconcileRecurring(items, transactions, month): RecurringMonthSummary
```

Where the result provides enough data for:

- income received / remaining
- expenses paid / remaining
- `Upcoming` rows
- `Complete` rows
- per-section totals
- row-level `matchedTransactionId?`

### Matching strategy (v1)

For each recurring item:

1. Expand the due occurrence(s) for the selected month.
2. Search the user's transactions in that same month for the best candidate.

Suggested v1 heuristics:

- sign must match (`income` vs `expense`)
- amount should match exactly by default
- merchant / recurring name should be normalized before comparison
- use a bounded date window around the due date
- ignore `excludeFromBudget` transactions for expense progress by default unless
  product later decides internal transfers can satisfy certain recurring rows

### Confidence bias

The matcher should bias toward **false negative over false positive**.

If confidence is weak:

- do **not** mark the item paid
- leave it in `Upcoming`

That is better than incorrectly telling the user a bill is handled.

### Explainability

Because this is inferred behavior, the UI should signal that clearly with subtle
copy such as:

`Derived from your transactions this month`

We should avoid implying bank-grade certainty when v1 is heuristic.

## Technical approach

### 1. Keep `bills.ts` focused on schedule math

[`src/lib/bills.ts`](../src/lib/bills.ts) already owns cadence math and upcoming
due-date helpers. The new monthly status work should not turn it into a giant
file that handles schedule math, matching, grouping, formatting, and UI state.

Recommended split:

- `src/lib/bills.ts`
  - cadence / date helpers only
- `src/lib/recurring/reconcile.ts`
  - recurring-to-transaction matching
  - month summary derivation
- `src/lib/recurring/reconcile.test.ts`
  - matching edge cases

### 2. Derive from store data first

The store already exposes both `recurring` and `transactions` via summary data.
Phase 1 should derive the monthly status view entirely on the client from those
existing inputs.

No new API route is required for v1 unless performance or payload size becomes a
real problem.

### 3. Shared web/mobile derivation

The core monthly derivation must be shared. Web and mobile should not implement
different matching logic or section math.

That means:

- one shared lib
- two view renderers
- parity in totals and status behavior

### 4. Leave exact linking for later

If v1 proves useful, we can later add:

- `transactions.recurring_item_id`
- a manual `mark as paid`
- exact linkage from add/import/edit flows

But that is explicitly a later phase, not part of the first build.

## Proposed data shape

The exact type names can change, but the view model should look roughly like:

```ts
interface RecurringMonthSummary {
  monthLabel: string;
  income: { totalCents: number; completedCents: number; remainingCents: number };
  expenses: { totalCents: number; completedCents: number; remainingCents: number };
  upcoming: RecurringMonthRow[];
  complete: RecurringMonthRow[];
}

interface RecurringMonthRow {
  recurringId: string;
  matchedTransactionId?: string;
  name: string;
  emoji: string;
  amountCents: number;
  isIncome: boolean;
  cadenceLabel: string;
  categoryName?: string | null;
  dueDate: string;
  relativeLabel: string;
  status: "upcoming" | "complete";
}
```

This keeps the rendering layers dumb and makes the unit tests target one stable
shape.

## UI slices

### Phase 1 — monthly list view

Ship:

- `Monthly` / `All recurring` tabs
- month navigation
- received / remaining progress summaries
- `Upcoming` / `Complete` grouped list
- row-level paid / received state
- web + mobile parity

This is the core scope and should land first.

### Phase 2 — calendar view

Add a calendar mode for the selected month:

- due dates on the grid
- recurring-item dots / chips by day
- tap / click into the row details

Calendar should use the same reconciliation result, just rendered differently.

### Phase 3 — exact linkage

Optional future schema work:

- recurring-to-transaction explicit linking
- manual `mark as paid`
- stronger import / add flow integration

This phase improves correctness, but is not required for the monthly view to be
useful.

## New / touched files

Likely touched:

- `src/components/web/views/Bills.tsx`
- `src/components/mobile/screens/Bills.tsx`
- `src/components/ui/RecurringRow.tsx` or a new monthly-row component if the
  existing row becomes too overloaded
- `src/lib/bills.ts`
- `src/lib/types.ts`

Likely new:

- `src/lib/recurring/reconcile.ts`
- `src/lib/recurring/reconcile.test.ts`
- shared monthly-recurring UI helpers/components if needed

## Risks

### Matching ambiguity

Multiple transactions may plausibly match one recurring item in a month,
especially with generic names or repeated equal amounts.

Mitigation:

- deterministic ranking
- conservative matching
- strong tests for duplicate candidates

### Overloading the existing row component

[`RecurringRow`](../src/components/ui/RecurringRow.tsx) currently renders a
simple editable schedule row with a pause toggle. Trying to force it into both
"schedule editor row" and "monthly status row" may create a confused API.

Mitigation:

- keep `RecurringRow` for `All recurring`
- create a dedicated monthly status row component if needed

### Web/mobile drift

If the views each add local filters or custom grouping logic, they will diverge.

Mitigation:

- one shared derived view model
- tests around the shared lib, not the components

## Open questions

- Should the footer/header copy say `Paid`, `Received`, or switch dynamically by
  income vs expense?
- Should `All recurring` include its own filters (income / bills / paused), or
  stay intentionally simple in v1?
- How wide should the date-matching window be for v1?
- Do we want a visible "inferred from transactions" hint only on web, or on both
  web and mobile?

## Non-goals

- bank account aggregation
- card / account columns
- bank-sync CTAs
- exact recurring-to-transaction linkage in Phase 1
- manual `mark as paid` in Phase 1
- backend schema changes in Phase 1
