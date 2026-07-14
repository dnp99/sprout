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
no bank sync, no account-facing reconciliation UI, and no "payment account"
column. Sprout does have imported-transaction account data; it is deliberately
out of scope for this recurring surface.

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

### 4. Monthly status is honest about unmatched occurrences

The view must not label a past-due, unmatched occurrence as `Upcoming`.
Phase 1 has three statuses:

- `Upcoming` — an unmatched occurrence whose due date is still ahead in the
  current month
- `Complete` — an occurrence matched to one transaction
- `Unmatched` — an occurrence with no confident match once its due date has
  passed, including every unmatched occurrence in a prior month

`Unmatched` copy should be neutral (for example, "No matching transaction") so
the UI does not claim a payment was missed when matching may simply have failed.
The progress summaries count only `Complete` occurrences as paid or received.

### 5. Bills shares the app month selection

Monthly Bills uses the existing global `viewMonthKey` so Transactions, Budget,
and Bills stay aligned to the same selected period. Extend the shared month
control with a `Today` action that resets this key to the current month. Bills
follows the existing rule that future months are unavailable in Phase 1.

### 6. Needs-review count is a Bills navigation badge

Unmatched recurring occurrences need an in-app attention signal, but do not yet
justify a global notification center. Phase 1 adds a terracotta count badge to:

- `Bills & recurring` in the desktop sidebar
- the `Bills` entry on the mobile Home screen (mobile keeps Trends as a tab)

The badge count is the number of current-month, past-due `Unmatched`
**occurrences**, not distinct recurring definitions; a weekly item can have
several occurrences to review. It does not count historical months a user is
only browsing. Selecting the Bills destination opens its Monthly tab and places
the `Needs review` section in view. The badge clears automatically when an
occurrence is matched, paused, rescheduled outside the selected month, or its
recurring definition is deleted.

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
- `Unmatched` (only when the selected month has past-due unmatched occurrences)

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
- `Upcoming`, `Complete`, and `Unmatched` rows
- per-section totals
- row-level `matchedTransactionId?`

### Matching strategy (v1)

For each recurring item:

1. Expand the due occurrence(s) for the selected month.
2. Search the user's transactions in that same month for the best candidate.

Expansion creates a distinct occurrence for every due date. This matters for
weekly recurring items, which can have four or five occurrences in one month.
Each occurrence gets a stable key such as `${recurringId}:${YYYY-MM-DD}` and is
rendered and totaled independently.

Suggested v1 heuristics:

- sign must match (`income` vs `expense`)
- absolute amount must match exactly in v1
- merchant / recurring name should be normalized before comparison
- use a bounded date window around the due date
- ignore `excludeFromBudget` transactions; they never satisfy an occurrence in
  v1
- a transaction can match at most one occurrence
- resolve multiple valid candidates deterministically: closest date first, then
  strongest normalized-name match, then transaction ID

### Confidence bias

The matcher should bias toward **false negative over false positive**.

If confidence is weak:

- do **not** mark the item paid
- classify it using its due-date status (`Upcoming` only before the due date;
  otherwise `Unmatched`)

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

Transactions load after the summary payload. Until `transactionsLoading` is
false, the monthly view must show a reconciliation loading state rather than
temporarily rendering every occurrence as unpaid or unmatched.

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
  unmatched: RecurringMonthRow[];
}

interface RecurringMonthRow {
  /** One recurring item may expand to several occurrences in a month. */
  occurrenceId: string;
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
  status: "upcoming" | "complete" | "unmatched";
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
- `Unmatched` grouping for past-due occurrences with no confident transaction match
- current-month `Needs review` count badge on desktop and mobile Bills navigation
- row-level paid / received state
- reconciliation loading state while transactions load
- web + mobile parity

### Phase 1 acceptance checks

- A weekly item expands to every matching weekday in the selected month, and
  each occurrence contributes its own amount to totals.
- A single transaction cannot complete more than one recurring occurrence.
- An exact amount with a weak or unrelated merchant match remains unmatched.
- An unmatched past-due item is never shown as upcoming.
- Paused items and excluded transactions do not affect monthly progress.
- Navigation counts only current-month, past-due unmatched occurrences and
  clears when those occurrences no longer need review.
- February and day-31 monthly/yearly schedules use the existing end-of-month
  clamping behavior.
- Web and mobile show identical counts, totals, and statuses for the same store
  inputs.

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
