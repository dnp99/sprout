# Unified menus and everyday calendar

Implement the inspected Together reference in the existing Next.js application.
All value selectors share an accessible themed popover: Cozy uses circular
monochrome entity icons in a named grid; Vibrant uses compact bordered rows.
Keep controlled values, validation, disabled options, keyboard use and labels.

Add a shared Monday-first everyday ledger calendar to Personal and Group
Overview on phone and desktop. Preserve month/week, period navigation, date
selection, daily net spending/income, Today/History, edit and date-prefilled Add.
Cozy follows Together's soft cells and inset agenda; Vibrant uses restrained
borders, smaller radii and stronger alignment. Existing recurring completion,
reconciliation and budgets remain available.

Calendar money uses integer cents. Personal exclusions do not affect totals;
reimbursements/refunds reduce spending rather than becoming income. Group
calendar data must cover the complete calendar range, independent of the paged
transaction table, with existing membership checks. No schema migration needed.

## Implemented

Shared value selectors, themed menu surfaces and Personal/Group everyday
calendars are implemented. Current behavior is documented in
[menus-and-calendar.md](../docs/menus-and-calendar.md). Browser checks cover
Cozy light/dark, Vibrant light, desktop and 390px phone layouts, date-prefilled
Add, category changes, history and month/week. Lint, production build and 378
unit tests pass (17 environment-gated tests remain skipped).
