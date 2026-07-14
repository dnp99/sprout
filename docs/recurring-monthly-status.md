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

An occurrence is completed by either an exact manual link or a confident
derived match. Exact links take priority, then Sprout uses this conservative
fallback:

- same income/expense direction
- exact absolute amount
- strong normalized merchant-name match
- within seven days before or three days after the due date
- not excluded from budget

Matching is one-to-one: one transaction cannot complete more than one
occurrence. The fallback matcher intentionally prefers a false negative over a
false positive.

## Exact completion

`transactions.recurring_item_id` is a nullable foreign key to
`recurring_items`. It is used only when a transaction explicitly completes a
recurring occurrence; deleting the recurring definition clears the link rather
than deleting transaction history.

Past-due `Needs review` rows in both List and Calendar expose `Mark paid` (or
`Mark received` for income). It creates a normal manual transaction on the
occurrence due date with that exact link, so it appears in Transactions and
contributes to existing budget reporting. Repeating the action returns the
existing linked transaction for that schedule and calendar day rather than
creating a duplicate.

The owner-scoped endpoint is `POST /api/recurring/:id/mark-paid` with a
`{ "dueDate": "YYYY-MM-DD" }` body. It accepts only a real occurrence from the
schedule, not an arbitrary date.

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

`Skip this occurrence` and import/edit-time link selection are intentionally
still deferred. The exact link makes those future flows possible without
changing reconciliation semantics again.
