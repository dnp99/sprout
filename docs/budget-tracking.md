# Budget Tracking

Sprout's Budget screens are month-aware tracking views, not just allocation
editors.

## What the screen shows

For the selected month, Budget surfaces:

- the user's total monthly budget (`budgetPoolCents`)
- how much has been allocated across categories
- how much has been spent in that month
- how much is left to allocate
- how much is left to spend

Each category row is shown as:

- planned budget
- actual month spend
- remaining amount (or over-budget state)

Selecting a category opens a category-detail drill-down on both surfaces rather
than redirecting to the Transactions section. The detail pairs spend-versus-
budget progress with the category's transactions and supports editing the
category or opening an individual transaction. Mobile presents this as a
transient screen; desktop keeps it inside Budget with a back action and scopes
the list to the currently selected Budget month.

## Grouping

Budget rows are grouped into:

- `Fixed`
- `Flexible`

Each category can explicitly be set to `Fixed` or `Flexible` in the category
editor. That choice is stored and drives both Budget and Cash Flow groupings.

Existing categories retain the previous inference until edited: `Fixed` comes
from active recurring expense coverage (for example rent or another recurring
bill linked to the category), plus a small bills/rent-style fallback. All other
legacy categories are treated as `Flexible`. The editor calls this state
**Automatic** so a user can keep the legacy behavior or choose a fixed value.

## Shared derivation

The shared view-model lives in
[`src/lib/budget-view.ts`](../src/lib/budget-view.ts). Web and mobile both use
it so the summary totals, group assignment, and row math stay consistent.

It combines:

- allocation math from [`src/lib/budget.ts`](../src/lib/budget.ts)
- month spend from [`src/lib/trends.ts`](../src/lib/trends.ts)
- an explicit category preference, with recurring-aware inference as the
  backward-compatible fallback

## Editing

Editing still happens in the shared budget editor:

- desktop:
  [`src/components/web/EditBudgetModal.tsx`](../src/components/web/EditBudgetModal.tsx)
- mobile:
  [`src/components/mobile/screens/BudgetSetup.tsx`](../src/components/mobile/screens/BudgetSetup.tsx)

The tracking view is intentionally read-first; the editor remains the single
place for changing the total budget, category allocations, category group, and category list.
On desktop, `Add category` is also promoted to a primary Budget-header action
that opens the shared category form directly; `Edit budget` remains a secondary
action for changing the total pool and per-category amounts.
