# Mobile transaction layout

Personal and Group composers share `TransactionEntryFields` and the shell in
`TransactionEntryShell`. On phones/tablets below 1024px the dialog fills the
visual viewport above the native keyboard, with Close, title/destination and
Save in a non-scrolling header. Save is associated with the form by its `form`
attribute, so native validation and existing adapters still own submission.
There is no mobile Save footer competing with the keyboard. Desktop uses the same compact amount field and collapsed More details inside
a centered modal, with separate footer actions.

Mobile amount entry is a visible, normal-sized native numeric field using the
same integer-cent typing model. The giant display, optional custom keypad and
Next-merchant button are removed on mobile. Desktop also uses a normal-sized
amount field with Calculator beside its label. Calculator is an explicit optional
control. Merchant stays directly below amount; compact type controls and a
Category/Date row follow. Payer remains directly available in Groups. Personal
business/source controls, Note and recurring/supporting fields collapse under
More details on both mobile and desktop. Hidden optional fields retain
their draft values. Category/date tracks and native inputs have shrinking width
constraints to prevent horizontal iOS overflow.

The form has one independent vertical scroller with native touch/wheel/keyboard
scrolling. It uses `visualViewport` height/offset from PWA presentation and
reveals the focused input on keyboard viewport changes. Header actions do not
cover fields. This geometry is identical across palettes and uses semantic
colors. Native iPhone/PWA keyboard behavior still requires device verification;
short browser viewport tests approximate the available layout, not iOS input.

Connected mobile transaction lists use neutral theme card surfaces and thin semantic border dividers. Selected and recently edited states retain their existing highlights. Rows use their normal full-width inset; there is no permanent trailing lane for the floating Add action. Dividers use a restrained semantic border/card colour mix. The floating action retains its existing visibility behaviour. Desktop layout is unchanged; all mobile appearance variants use the same geometry and their own semantic colours.

Regression coverage checks mobile Save in the header, native form association, optional fields, and desktop footer behavior. Full lint, unit tests and production build validate shared form integration. Native iOS keyboard/date-control rendering still requires device verification.


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
focusing Merchant synchronously within the key gesture. Native keyboard Next/Enter
advances to Merchant where the keyboard provides that key; the former separate
mobile Next-merchant button is removed. Users can also tap Merchant directly.
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
amount-to-merchant focus handoff, tablet keypad dismissal, mobile header/desktop footer placement
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

## Production phone browsing refinement

Both ledger context labels remain visible in an equal-width phone switch.
Multiple Group destinations use the group name itself as the chooser trigger.
Personal month-scoped browsing now applies the selected month to its rows and
totals as well as its count; business custom-period browsing retains its period.
The compact 44px selection toolbar keeps its existing selection and Actions
behavior. Connected rows use neutral semantic card surfaces; selected rows retain
primary-soft, while recent edits use status metadata. Group metadata shows the
leaf category, a protected short date, and “Paid by Name”; split status and edited
status sit below the merchant. Personal exclusion badges also sit below the
merchant. Shared summaries protect dates from long category/note truncation.

Transaction-page Add is now a primary 44px header action in both mobile ledgers,
rather than a floating button covering row actions. Overview retains its floating
entry point. The existing composer callbacks and disabled guards are unchanged.

Date scope is explicit: Personal mobile defaults to the header month. Choosing
All dates in Filters opts out of that month restriction, and an explicit day or
range uses its own bounds. Choosing a header month returns to month scope.
Filtered/range counts say “matching transactions” rather than claiming a subset
of an unrelated monthly total. Selection remains independent of filtering.

Local verification (November 5, 2026): lint and production build pass; 752 unit
tests pass (49 skipped). Personal and Group phone previews show unobstructed row
actions and compact count controls. Computed search input and placeholder fonts
match in all six appearance combinations (14px/400 in the fine-pointer preview);
actual touch input remains 16px via the coarse-pointer rule. Native iPhone
rendering and keyboard behavior still require device verification.

## Desktop Group selection header

Personal and Group selection share `DesktopSelectionToolbar`: checked count,
compact domain action, More, and a borderless icon-led Clear action. Group
exposes Set category directly and Select matching records inside More. Its
header reserves intrinsic height if controls wrap; the generic 44px laptop
header height must not clip a larger selection UI into record rows. Actions
opens a focused chooser, then replaces it with the relevant date/category/copy
editor. Desktop void reasons live only in the Delete confirmation dialog,
including small selections. Existing versioned selection and mutation adapters
remain authoritative. Mobile selection behavior is unchanged.

Local regression validation: two selected Group records produce a 53px header
with the record viewport starting exactly at its bottom (no overlap), across
all six theme combinations and at 1024px laptop width. Actions → Change date
opens exactly one dialog without applying a mutation or dropping selection.
Full suite: 753 tests pass (49 skipped); lint and production build pass.

The shared toolbar owns both ledgers’ control sizing, selected-count checkmark,
spacing, More trigger and Clear presentation. Ledger-specific actions and
confirmation flows remain in their adapters. Both header surfaces use the same
semantic primary-soft role.

Shared-toolbar verification: Personal and Group desktop headers both measure
44px, with 36px action controls. Checked three selected rows in each ledger;
Group More exposes matching selection/export/copy/date/category/delete, while
Personal More retains its existing contextual behavior. Group's visible primary
action is Set category; Personal's mixed-selection action remains Exclude.

Personal desktop More uses a full-width, labeled red Delete menu item rather
than placing a square icon-only action inside a wide menu. Delete always opens
its in-app confirmation. Neither opening the menu nor cancelling deletes data.

## Bounded mobile page scrolling

The mobile shell now scrolls the page inside one visual-viewport region while
the tab bar remains its non-scrolling sibling. Existing transaction field
scrolling stays inside the editor, with the background locked and focus restored
without moving it. Personal editors preserve their Home/search/category origin;
Activity incrementally renders rows while selection/totals retain all results.
See [mobile PWA experience](mobile-pwa-experience.md) for navigation, keyboard,
performance and platform verification details. Desktop behavior is unchanged.

## Desktop browsing toolbar order

Both desktop transaction workspaces place Search transactions and its Filter
trigger first, followed by Split & settle (Groups only), Categorize with AI and
the primary Add transaction action. DOM order matches visual/tab order. Personal
retains its existing AI availability rules; no settlement feature is added to
Personal. Mobile controls, actions and ordering stay unchanged. The shared
search region grows into available width and wraps at its existing minimum.
