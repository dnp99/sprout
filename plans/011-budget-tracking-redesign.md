# 011 — Budget tracking redesign

**Status:** In progress · **Created:** 2026-07-10

## Outcome

Move Sprout's Budget screen from a category-allocation editor into a proper
month-aware tracking view built around `budget / spent / left`, while keeping
Sprout's lighter visual system and privacy-first simplicity.

## Goal

The current Budget screens are clean, but they read mostly as setup surfaces:

- a monthly budget card
- a long flat list of category allocations
- one global edit action plus row-level edit controls

What they do not do strongly enough is connect the plan to the month:

- how much of the budget is allocated
- how much was spent in the selected month
- what is left by category
- which categories behave more like fixed costs vs flexible spending

This redesign keeps Sprout simple, but changes the information architecture so
the screen reads as a monthly budgeting workspace instead of only a settings
panel.

## Product direction

- Keep the existing month selector.
- Keep one primary edit action (`Edit allocations` / `Edit budget` flow).
- Group categories into `Fixed` and `Flexible`.
- Derive `Fixed` from recurring-backed categories first, with a bills/rent
  fallback while there is no explicit budget-group model.
- Show summary metrics for:
  - monthly budget
  - allocated
  - spent this month
  - left to allocate
  - left to spend
- Use per-category rows that read as:
  - `$600 budget · $124 spent · $476 left`

## Implementation

### Shared view-model

Add a pure helper:

- `src/lib/budget-view.ts`

It derives:

- month-aware summary totals
- fixed / flexible grouping
- per-category planned / spent / left rows

This keeps web and mobile aligned.

### Desktop

Update:

- `src/components/web/views/Categories.tsx`
- `src/components/web/WebApp.tsx`

Shape:

- left summary card
- right grouped category cards
- collapsible group headers
- row click still drills into transactions
- global header CTA becomes `Edit allocations`

### Mobile

Update:

- `src/components/mobile/screens/Categories.tsx`

Shape:

- summary card first
- grouped sections below
- sticky bottom `Edit budget` CTA
- row tap opens category detail

## Notes

- No schema change in v1.
- No explicit fixed/flexible field yet.
- No account-style budget columns or spreadsheet density.
- The existing edit sheet/modal remains the source of truth for allocation
  editing.
