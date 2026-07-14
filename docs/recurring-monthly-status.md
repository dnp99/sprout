# Recurring Monthly Status

Bills has two views of the same recurring definitions:

- **Monthly** explains which scheduled occurrences have happened in one calendar
  month.
- **All recurring** is schedule management: add, edit, pause, and remove the
  definitions themselves.

The implementation is deliberately privacy-first. Sprout does not require bank
sync or a payment-account surface to render this status view.

## Reconciliation

`src/lib/recurring/reconcile.ts` expands active definitions into occurrences for
the selected UTC month. Monthly and yearly schedules use their anchored day
(clamped at the end of a short month); weekly schedules expand to every matching
weekday.

An occurrence is only completed when one loaded transaction is a confident
match:

- same income/expense direction
- exact absolute amount
- strong normalized merchant-name match
- within seven days before or three days after the due date
- not excluded from budget

Matching is one-to-one: one transaction cannot complete more than one
occurrence. The matcher intentionally prefers a false negative over a false
positive.

## Statuses

- **Upcoming:** unmatched and still due later in the current month.
- **Complete:** matched to one transaction.
- **Needs review:** past-due and unmatched. This is neutral evidence of no
  confident match, not proof that the bill was missed.

The progress cards count only complete occurrences as paid or received.
Transactions load after the summary payload, so both Monthly renderers hold a
loading state until reconciliation has transaction data.

## Calendar

`src/lib/recurring/calendar.ts` creates a fixed six-week UTC grid. The Calendar
mode in `src/components/shared/RecurringCalendarView.tsx` displays the same
reconciled occurrences as the List mode, with status-aware dots on mobile and
chips on desktop. Selecting a day opens a compact agenda whose rows use the
same edit route as the List view.

## Attention Badge

The desktop `Bills & recurring` sidebar item and the mobile Home-screen `Bills`
entry show a count only for current-month, past-due unmatched **occurrences**.
The count is hidden until transactions have loaded and clears automatically when
an occurrence gains a confident match or is removed from the active schedule.

## Future Work

There is no manual `Mark paid`, `Skip this occurrence`, or explicit
recurring-to-transaction link in the current model. Those belong to plan 010's
Phase 3, which will require a schema-backed exact-link model.
