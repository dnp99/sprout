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

Sprout does not yet store an explicit budget-group field on categories. For now,
`Fixed` is inferred from active recurring expense coverage (for example rent or
other recurring bills linked to the category), plus a small bills/rent-style
fallback for common fixed-cost categories. All other categories are treated as
`Flexible`.

This is intentionally derived so the product can ship a better information
architecture without a schema change.

## Shared derivation

The shared view-model lives in
[`src/lib/budget-view.ts`](../src/lib/budget-view.ts). Web and mobile both use
it so the summary totals, group assignment, and row math stay consistent.

It combines:

- allocation math from [`src/lib/budget.ts`](../src/lib/budget.ts)
- month spend from [`src/lib/trends.ts`](../src/lib/trends.ts)
- recurring-aware fixed/flexible inference from loaded recurring items

## Editing

Editing still happens in the shared budget editor:

- desktop:
  [`src/components/web/EditBudgetModal.tsx`](../src/components/web/EditBudgetModal.tsx)
- mobile:
  [`src/components/mobile/screens/BudgetSetup.tsx`](../src/components/mobile/screens/BudgetSetup.tsx)

The tracking view is intentionally read-first; the editor remains the single
place for changing the total budget, category allocations, and category list.
On desktop, `Add category` is also promoted to a primary Budget-header action
that opens the shared category form directly; `Edit budget` remains a secondary
action for changing the total pool and per-category amounts.
