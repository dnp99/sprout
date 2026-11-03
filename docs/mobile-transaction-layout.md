# Mobile transaction layout

Personal and Group transaction composers share `TransactionEntryForm` and `TransactionDialog`. The modal header stays outside the form. Fields and validation errors live in a dedicated, independently scrolling region; the Save action follows that region as a non-shrinking flex footer. The footer is never sticky within the fields. This prevents iOS keyboard-induced visual viewport changes from placing Save over unfinished fields. The shared modal continues to use the visual viewport height and offset supplied by PWA presentation handling.

Date and Category stack on phones and use two columns from the tablet breakpoint. Each track can shrink, and native date inputs have explicit intrinsic-width constraints to prevent iOS from overflowing into the neighbouring field. Amount autofocus and both native typing and the optional keypad remain unchanged.

Connected mobile transaction lists use neutral theme card surfaces and thin semantic border dividers. Selected and recently edited states retain their existing highlights. Rows use their normal full-width inset; there is no permanent trailing lane for the floating Add action. Dividers use a restrained semantic border/card colour mix. The floating action retains its existing visibility behaviour. Desktop layout is unchanged; all mobile appearance variants use the same geometry and their own semantic colours.

Regression coverage checks that Save remains outside the fields’ scroll region. Full lint, unit tests and production build validate shared form integration. Native iOS keyboard/date-control rendering still requires device verification.


## Compact browsing hierarchy

Mobile Personal and Group Transactions put secondary navigation into a shared More disclosure beside the header's month control. Personal exposes Import & export; Groups also exposes Split & settle. Desktop secondary navigation remains unchanged. Each action retains its ledger-specific route and the menu closes after activation or Escape/outside interaction. The header trigger uses an ellipsis with a small downward chevron (upward while expanded), a translated More tooltip and accessible name, declares its popup/expanded state and retains a minimum 44px touch target. No visible label is stacked beneath the icon.

Spent and Income share a summary line. The existing selection bar now accepts a month-count summary, replacing the former duplicated month and result-count rows. A matching count appears only when it differs from the selected month's count; active selection still shows the number selected. The list, filters, month context and cross-page selection remain unchanged.

Mobile list rows hide recording timestamps, which remain available in the Personal editor and Group record details. Group rows retain Paid by. Header/list gaps and segment spacing are tighter, with 44px controls retained. The styles apply only below the desktop breakpoint and consume existing semantic tokens. Cozy's Group context pill uses its warm panel token rather than a green selection fill.


## Compound search focus

The rounded `.ledger-search-field` owns the focus outline for the whole search control. The inner input has no separate outline or shadow, with a scoped selector strong enough to override Vibrant's global input focus rule. The outer boundary uses its 1px semantic border plus a touching 1px shadow, producing one continuous 2px edge without a gap; forced-colour mode uses a Highlight outline. This applies to both ledgers and viewports; unrelated input focus indicators remain unchanged.


The header-to-search interval is 12px in both ledgers, supplied by workspace top padding rather than stacked header padding, workspace padding and an empty toolbar. An empty mobile Group AI toolbar is removed from flex layout; an available AI action remains visible. Desktop spacing is unchanged.


## Personal mobile row actions and edit parity

Personal Activity rows now provide the same separate trailing ellipsis area as Group rows. The existing Personal row menu supplies Edit, Exclude from budget and Delete; Group retains its own Edit/Refund semantics. The row's main button and action button are siblings, so opening the menu cannot accidentally open the editor. Selection mode removes the menu and continues to toggle rows.

Opening a Personal transaction now leaves its ledger behind a `TransactionDialog`, matching Group editing. The shared `TransactionEntryForm` and `TransactionEntryFields` supply amount/keypad/calculator, merchant, type segments, date/category or income-source fields, note and a fixed Save footer. Personal's existing save adapter remains authoritative for signed cents, local occurrence dates, business assignment, income sources, reimbursements, exclusion and merchant-wide category rules. Delete and recording metadata remain available. The editor cannot dismiss while a save/delete is pending and never substitutes the first record for a missing selected ID. Desktop keeps its existing edit presentation and uses the same underlying save logic.


Transaction type filters precede the search row in both ledgers and both viewport sizes. Desktop search remains beside secondary and Add actions in its compact toolbar, directly below the type/business/payer filter row. Mobile shows its All/Expenses/Income segments before the full-width search field. DOM order matches visual and keyboard order.
