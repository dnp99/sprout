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

### Recent transactions and selected-day agenda

The calendar opens its agenda on Recent transactions (formerly History), showing
records in the visible month/week newest-first. Selecting a day switches the
agenda to that date and changes the Selected day tab label to its formatted
date. Returning to the day tab preserves that selection rather than jumping
back to today. The day heading and totals always describe the selected date.
The same renderer supplies these semantics to Personal and Group calendars.

The day tab's initial label is now Today (superseding Selected day). Clicking a
different date replaces that label with the chosen date; selecting today restores
Today. Before any explicit day selection, the Today button selects the actual
current day, including navigation back from a historical month. Recent
transactions remains the initial agenda view.

The sidebar group chooser uses Select's group-picker variant: a trigger-width
popup of bold name rows, with no empty symbol slots or icon grid. Its portal
explicitly uses the Group peach palette instead of inheriting the document's
white card surface. Keyboard selection and accessible native/listbox semantics
are unchanged; other value selectors retain their existing layout.

### Compact vertical value menus

All Select menus now use vertical rows in both palettes, superseding the Cozy
icon grid. Empty icon placeholders are removed; real icons stay inline with
their label. Popups use a smaller 180px minimum (the group picker matches its
trigger), 5–6px outer padding and 44px minimum row targets. Positioning uses the
actual option-count footprint so short upward-opening menus sit next to their
trigger rather than leaving a gap. Long lists remain scrollable.

Cozy menu/trigger fills are mint-tinted in Personal and peach-tinted in Groups,
including portaled menus. Group names retain bold emphasis. No value, keyboard,
native form or selection semantics are changed.

Spending comparison choices read Monthly, Monthly avg. and Yearly; a short
description below the common controls preserves the exact baseline (previous
month, six-month average or previous year). These are label simplifications,
not new weekly/yearly accounting modes.
