# Mobile transaction layout

Personal and Group transaction composers share `TransactionEntryForm` and `TransactionDialog`. The modal header stays outside the form. Fields and validation errors live in a dedicated, independently scrolling region. On mobile, Save is the last item inside that scrolling region, so it does not reserve scarce keyboard viewport space or cover the merchant field. Desktop keeps Save outside the fields as a non-shrinking flex footer. Neither layout uses a sticky footer within the fields. This prevents iOS keyboard-induced visual viewport changes from placing Save over unfinished fields. The shared modal continues to use the visual viewport height and offset supplied by PWA presentation handling.

Date and Category stack on phones and use two columns from the tablet breakpoint. Each track can shrink, and native date inputs have explicit intrinsic-width constraints to prevent iOS from overflowing into the neighbouring field. Amount autofocus and both native typing and the optional keypad remain unchanged.

The shared Personal/Group form scroll region uses the global `no-scrollbar` utility, matching the modal body. Scrollbars are hidden without disabling touch, wheel or keyboard scrolling; the header and Save footer remain outside the scrolling fields. This uses no colour overrides and applies across all themes.

Connected mobile transaction lists use neutral theme card surfaces and thin semantic border dividers. Selected and recently edited states retain their existing highlights. Rows use their normal full-width inset; there is no permanent trailing lane for the floating Add action. Dividers use a restrained semantic border/card colour mix. The floating action retains its existing visibility behaviour. Desktop layout is unchanged; all mobile appearance variants use the same geometry and their own semantic colours.

Regression coverage checks mobile Save inside the scroll region and desktop Save outside it. Full lint, unit tests and production build validate shared form integration. Native iOS keyboard/date-control rendering still requires device verification.


## Compact browsing hierarchy

Mobile Personal and Group Transactions put secondary navigation into a shared More disclosure beside the header's month control. Personal exposes Import & export; Groups also exposes Split & settle. Desktop secondary navigation remains unchanged. Each action retains its ledger-specific route and the menu closes after activation or Escape/outside interaction. The header trigger uses an ellipsis with a small downward chevron (upward while expanded), a translated More tooltip and accessible name, declares its popup/expanded state and retains a minimum 44px touch target. No visible label is stacked beneath the icon.

Spent and Income share a summary line. The existing selection bar now accepts a month-count summary, replacing the former duplicated month and result-count rows. A matching count appears only when it differs from the selected month's count; active selection still shows the number selected. The list, filters, month context and cross-page selection remain unchanged.

Mobile list rows hide recording timestamps, which remain available in the Personal editor and Group record details. Group rows retain Paid by. Header/list gaps and segment spacing are tighter, with 44px controls retained. The styles apply only below the desktop breakpoint and consume existing semantic tokens. Cozy's Group context pill uses its warm panel token rather than a green selection fill.


## Compound search focus

The rounded `.ledger-search-field` owns the focus outline for the whole search control. The inner input has no separate outline or shadow, with a scoped selector strong enough to override Vibrant's global input focus rule. The outer boundary uses its 1px semantic border plus a touching 1px shadow, producing one continuous 2px edge without a gap; forced-colour mode uses a Highlight outline. This applies to both ledgers and viewports; unrelated input focus indicators remain unchanged.


The header-to-search interval is 12px in both ledgers, supplied by workspace top padding rather than stacked header padding, workspace padding and an empty toolbar. An empty mobile Group AI toolbar is removed from flex layout; an available AI action remains visible. Desktop spacing is unchanged.


## Personal mobile row actions and edit parity

Personal Activity rows now provide the same separate trailing ellipsis area as Group rows. The existing Personal row menu supplies Edit, Exclude from budget and Delete; Group retains its own Edit/Refund semantics. The row's main button and action button are siblings, so opening the menu cannot accidentally open the editor. Selection mode removes the menu and continues to toggle rows.

Opening a Personal transaction now leaves its ledger behind a `TransactionDialog`, matching Group editing. The shared `TransactionEntryForm` and `TransactionEntryFields` supply amount/keypad/calculator, merchant, type segments, date/category or income-source fields, note and the responsive Save placement described above. Personal's existing save adapter remains authoritative for signed cents, local occurrence dates, business assignment, income sources, reimbursements, exclusion and merchant-wide category rules. Delete and recording metadata remain available. The editor cannot dismiss while a save/delete is pending and never substitutes the first record for a missing selected ID. Desktop keeps its existing edit presentation and uses the same underlying save logic.


Transaction type filters precede the search row in both ledgers and both viewport sizes. Desktop search remains beside secondary and Add actions in its compact toolbar, directly below the type/business/payer filter row. Mobile shows its All/Expenses/Income segments before the full-width search field. DOM order matches visual and keyboard order.

## Required-field guidance after amount entry

Invalid controls use a single continuous 2px semantic danger edge. The outline
is inset over the border instead of offset outside it, avoiding doubled red
strokes in both focused and unfocused states across themes and ledgers.

A positive transaction amount starts required-field guidance immediately, including
keyboard, keypad and calculator entry. Empty required merchant, date and category
controls show the existing semantic danger outline and their associated accessible
errors before the user leaves the field or tries Save. Completed controls clear
their own error immediately. Optional merchant/category fields remain neutral;
this does not introduce new requirements for refunds or existing records.
Untouched zero-amount drafts stay quiet despite initial autofocus. Existing
field-blur and submit-attempt validation still applies.

The desktop Personal editor uses the same danger boundary for its existing
required amount, merchant and date controls. The invalid-field selector is scoped
to transaction forms and outranks normal theme focus rings, so focus cannot hide
an error. Geometry and light/dark theme-specific danger tokens are preserved.

Verified the amount-triggered 2px danger outline in rendered Cozy, Elegant and
Vibrant forms in light and dark modes, including focused category selection and
clearing after a valid choice. Checked Personal mobile and Group desktop entry
without saving demo records. Regression tests cover keyboard/keypad/calculator
entry, per-field correction, optional-field exemptions and both Personal editor
layouts.

## Required-field keyboard handoff

Amount entry advertises the native Next action and handles Enter on mobile and web by
focusing Merchant synchronously within the key/tap gesture. The visible
“Next: merchant” action provides the same path when the native numeric keyboard
has no return key, and closes Sprout's optional keypad before opening text entry.
A zero amount remains focused for correction. Merchant Enter/Next opens the category
picker after revealing its trigger in the form scroller; a blank required merchant
keeps focus for correction. If the required date is empty, Merchant advances to
Date first, and Date Enter advances to Category once completed. Disabled/unavailable
category controls are skipped. Composition-confirming Enter is left to the input
method. These transitions prevent premature form submission on both surfaces. This never forces the keyboard back open after an intentional blur.

The transaction scroller follows focused inputs on focus and visual-viewport
resize/scroll events. It scrolls only its own content, after viewport CSS updates,
with a small clearance around the field; it does not pan the page. Listeners and
pending animation frames are removed when the editor closes. Tests cover the
amount-to-merchant focus handoff, keypad dismissal, mobile/desktop footer placement
and focused-field visibility during a simulated keyboard resize. Native iOS/PWA
keyboard interaction still needs confirmation on an actual device.

## Compact mobile totals and results

Personal and Group mobile ledgers share `MobileTransactionTotals` and
`MobileTransactionCount`: two equal columns with muted labels above totals,
then one count beside Select. The month remains in the month selector. Filtered
results read “3 of 8 transactions”; selection mode retains its selected count.
Desktop summaries remain unchanged. All colors use semantic theme tokens.

Totals and the result action row share a compact wrapper with no inter-row
layout gap or extra vertical padding. Select retains its 44px minimum target.

## Mobile bulk actions

Personal and Group mobile selection controls expose a compact Actions disclosure
beside Done only when records are selected. The action form opens in an overlay
above the list without reserving layout space or shifting records on selection.
The panel scrolls within 45dvh; Escape closes it and returns focus to Actions.
Desktop bulk-action placement remains unchanged.

## Selection across searches

Personal and Group selections persist across search, type and category filters
on mobile and desktop. Search remains available during mobile selection. Select
all adds matching rows to existing selections; Done/Clear and successful bulk
mutations clear explicitly. Hidden selected rows remain included in bulk actions
and are disclosed as “N hidden by filters” beside the selected total. Personal
category/source availability derives from all selected source records, not just
the filtered rows. Business/group context boundaries retain their scope resets;
Group reviewed versions remain unchanged through filtering and refreshes.

## Contextual mobile list header

The shared month selector on mobile and desktop uses a semantic muted surface with a
transparent resting border instead of the primary outline. Existing rounded
corners, 44px targets, hover/pressed feedback and keyboard-only inset focus ring
remain. Both ledgers, all workspaces and all color themes share this treatment
in light and dark mode.

The result count and selection controls share a stable 64px-minimum list header
with a semantic hairline border and 14px rounded corners matching the record
table. Its card surface and horizontal padding apply in both states; menus stay
unclipped. Totals remain above it. During selection
the card-backed header sticks to the top of the ledger scroll area; it is a
sibling of the list, so a short summary wrapper cannot constrain sticky travel.
Actions uses a centered Lucide chevron with the same 44px control height as
Select all and Done. The overlay remains outside normal layout. Both mobile
ledgers share this header; desktop presentation is unchanged.

Mobile Group Transactions allows overflow through its unbounded page-content
ancestor so sticky positioning follows document scrolling. Desktop keeps its
bounded independent scroll layout.

## Mobile greeting context

The account greeting includes a muted, icon-labeled Personal or Group identity
beneath the name. Group headers show the current group name there and expose
the existing route-based group chooser when multiple groups are available.
All mobile and desktop Group section titles show only the section name,
including Overview, Transactions, Budget/Goals, Trends, Import, and Settings.
Desktop retains the current group name and route chooser in the sidebar. Account settings remain on the avatar.

## Desktop title identity icons

Personal and Group desktop brand rows both reserve 4px bottom padding before
the 16px context-switch gap, keeping the switch at the same vertical position
when changing ledgers, including collapsed rails.

Desktop page headings prepend an 18px muted UserRound (Personal) or Users
(Group) icon. The shared icon provides a localized screen-reader mode label,
uses semantic muted ink, and is hidden on mobile, where greeting identity stays
explicit. Section titles and header height are unchanged.

Group desktop Trends places its reporting-period date picker in the main page
header. Spending insights portals its existing stateful control into that slot,
so yearly comparison presets and exact-day cutoffs remain tied to the report
without a duplicate picker inside the card. Mobile retains its header period
control. Transaction and Budget/Goals date controls are unchanged.

The expanded desktop Group sidebar places its group picker directly below the
Personal/Groups switch and above section navigation. It retains route-based
switching, disabled state and the All groups entry; mobile and collapsed rails
keep their existing controls.

The expanded desktop group picker uses the sidebar's semantic soft fill and
rail ink with a transparent resting border, rather than a white card. Hover
uses rail hover; keyboard focus remains visible. Portaled options retain their
separate card palette. Geometry and mobile group switching are unchanged.
