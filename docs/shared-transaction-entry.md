# Shared transaction entry

Personal and Group transaction entry use the same `TransactionDialog`,
`TransactionEntryForm` and `TransactionEntryFields` components. Both responsive
surfaces and both visual themes share width, spacing, labels, field boundaries,
required asterisks and inline error styling, calculator placement, date/category grid, notes and sticky
Save actions. The Personal mobile flow is now a dialog over its originating
ledger, matching Group entry; closing returns to the original Personal screen.

The numbered `Keypad` starts hidden beneath the amount in both modes. Its
Show/Hide control preserves the draft. Keypad digits, double-zero and backspace
use the same `appendAmountKey` cents logic as physical keyboard entry. While the
custom keypad is shown, `AmountEntry` uses `inputMode="none"` to avoid competing
native phone keyboards; hiding it restores numeric input mode. The shared body
scrolls on short viewports and the Save footer stays within the form. Merchant
label/calculator share a row and the input remains full-width below.

## Domain adapters

`AddForm` is the Personal adapter. It connects common fields to the Personal
store and adds optional income source, business and existing recurring controls.
Personal notes now use `addNote`, pass to the existing API note field, keep the
existing 280-character limit, and clear on successful save or reset.
`PersonalTransactionDialog` supplies validation, saving and close behavior to
both desktop AddModal and mobile Add.

Group `EntryForm` keeps its local draft, payer/recipient selector, refund
inheritance, split review, change reason and void/refund actions. It supplies
these extras to the same renderer; group notes retain their 1000-character
limit. `GroupApp` uses the same transaction dialog for new/edit/refund records.
The modal header shows a compact person icon with Personal or a group icon with
the group name beneath the title. This destination stays outside the scrolling
form for new, edit and refund flows; no destination sentence appears in the body.
Long group names truncate with the full name available on hover.
The amount display has no visible label,
while its input keeps its accessible Amount label and required semantics.
No category, payer, refund, split or permission logic moves into presentation.

Manual required amount/category rules remain in
[manual-transaction-validation.md](manual-transaction-validation.md). Personal
merchant/source text retains its existing requirement; Group descriptions
remain optional. Each adapter retains its save/API path and state isolation.
No schema or migration is needed; existing records are unchanged.

## Required-field feedback

Category shows `*` beside its visible label; Amount remains visually unlabeled.
There is no explanatory
required-fields sentence. Shared field state uses the common required validation
policy to mark invalid amount interactions, category blur, or a form submission
attempt. Initial autofocus does not mark a blank amount invalid. Errors use
`aria-invalid`, linked inline messages and the semantic danger token for a red
outline, including focused fields in Cozy/Vibrant and light/dark modes. Valid
corrections clear the state immediately. Select forwards invalid state to its
visible combobox trigger as well as its native select.

Personal's required merchant and the prefilled transaction date use the same
inline invalid treatment when cleared. Group merchant descriptions remain
optional. Native validation popovers are suppressed in favor of these themed
errors; native constraints and server validation continue to enforce validity.

## Responsive dialog geometry

Phone and tablet widths below 1280px share the compact 400px-max dialog and
full-width Save action. Desktop at 1280px and above uses a 560px-max dialog:
the amount is compact and left-aligned, date/category retain two columns, and Save
is a right-aligned action. Desktop has no numbered keypad or keypad toggle;
phone/tablet keep the optional hidden-by-default keypad. Resizing to desktop
restores numeric keyboard input even if the compact keypad was open. The
header/destination and Save remain visible while long content scrolls. Both
layouts render the same fields, draft state and validation; no parallel forms
or device-specific business rules are introduced. Close and other dialog
buttons use themed keyboard focus outlines, with system outlines in forced
colors. `transaction-dialog.css` owns responsive geometry for both appearances
and ledgers; other modal widths remain unchanged.

The amount input nominates itself as the modal's initial focus target. The focus
boundary honors this after mounting instead of moving focus to Close, so typing
works immediately in both viewport layouts. Other dialogs retain their existing
first-control focus fallback and opener focus restoration.
