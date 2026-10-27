# Themed selectors and everyday calendar

Implementation is entirely in Sprout. Together is a read-only design reference;
its code, data and saved settings are not migration targets for modification.

## Value selectors

`src/components/ui/Select.tsx` replaces native visible select popups throughout
Personal/Group, forms, filters, import mapping and reports. Existing option
values and change handlers remain unchanged; a visually hidden native select
preserves form values, required validation and a real change event target.
The visible trigger is a combobox with a labeled listbox, selected state,
keyboard arrows, Home/End, initial-letter selection, Enter/Space, Escape,
pointer-away dismissal, disabled options and focus restoration after selection.
Menus portal above dialogs/tables to avoid clipping, reposition above when space
is tight, and close on outside scrolling/resizing. Ledger context is carried to
the portal so the correct Personal/Group variables still apply.

Cozy renders choices in a three-column grid with circular monochrome icons,
names and a selected check, following the inspected Together category menu.
Vibrant uses restrained bordered popovers with compact aligned icon/text rows.
Entity options carry `data-icon` identity metadata without embedding emoji in
text. Action menus retain their appropriate row layout and share theme surfaces.
Theme rules live in `src/app/controls.css`, imported after global tokens.
The category Add form and bulk assignment use the same visual language; icon
palette buttons become circular in Cozy. Light/dark are CSS-token variants.

## Everyday ledger calendar

`EverydayCalendar` is shared by desktop/mobile Personal Overview and Group
Overview. It retains Together's Monday-first month/week grid, adjacent dates,
daily amounts, current-day badge, selected date, period arrows, Today/History
agenda, record editing, full-ledger link and a date-prefilled Add action. A week
can cross a month/year boundary; navigation loads the newly selected month.
Cozy uses soft rounded cells, pill controls and an inset agenda. Vibrant uses
hairline boundaries, smaller radii and a more structured layout. Existing
recurring calendar/reconciliation remains a separate scheduled-bills feature.

Personal reads the full loaded ledger. Excluded records remain inspectable but
contribute zero to spending/income; reimbursements reduce spending. Group reads
`calendarEntries` from its membership-checked snapshot for the complete visible
calendar date range, independently of the transaction table's 50-row page.
Voided group entries are omitted; refunds reduce spending and member repayments
are not household spending. Archived groups expose no Add or edit mutations.
All totals use signed integer cents and the shared money formatter.

Calendar arithmetic uses date-only UTC-noon keys and UTC date labels, matching
ledger reporting buckets rather than shifting imported midnight dates locally.
The highlighted current day uses the device's local calendar date. English and
French labels are maintained in the existing message catalogs. No database
schema or stored entity identity changes are required.

Tests cover month/leap-year/week boundaries, DST/year shifts, refund and income
accounting, selector pointer change events, disabled choices and keyboard use.
