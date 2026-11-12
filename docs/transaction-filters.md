# Transaction filters

Personal and Group Transactions share `TransactionFilterControl`,
`TransactionFilterEditor`, `TransactionFilterOverlay`, and applied-filter chips.
Search remains live. Advanced controls open in a fixed, trigger-anchored 400px
popover at the shared desktop breakpoint (1024px), or a bottom sheet below it.
Opening never inserts a panel into the results layout.

## Applied state and drafts

The ledger adapter owns applied values. Opening mounts a local `FilterDraft`;
Apply validates and commits once, then closes. Close, outside click, Escape and
mobile Back discard it. Reset changes only the draft until Apply. Removing a
chip or using Clear filters commits immediately. Changes to applied values while
open remount the draft so sidebar selection and table sorting cannot silently
conflict with an old draft.

Personal retains its existing Zustand fields, separate phone sort owner, business
scope, income-source selection and saved views. Desktop `webTxnType` owns the
primary All/Expenses/Income selection; `webTxnQuickType` owns the exclusive
Refunds/Uncategorized/Excluded view. Older saved views and drill-downs that used
an advanced `type` remain readable. New saved views include `quickType`.
Personal amount strings remain canonical period decimals in applied state;
French editing uses comma decimals. Amount parsing yields integer cents.

Group retains its own `GroupLedgerFilters` and payer semantics: an empty payer
means everyone, `shared` means shared funds, and member IDs mean actual payers.
The optional `quick` filter is serialized and validated alongside existing
filters, separately from the primary `kind`. Legacy refund/uncategorized kinds
remain supported. No Personal control reads or writes Group filters. Switching
between groups retains the existing Group workspace state ownership.

## Meaning and synchronization

Refunds preserve each ledger's existing classification, including Personal's
reimbursement distinction. Quick filters remain mutually exclusive and intersect
with the primary type and category. An incompatible combination can correctly
return no matches. Personal keeps multiple categories ORed together; Group keeps
one category. Category IDs, labels, parent/child selection and matching semantics
are unchanged. Sidebar and editor write the same category state.

Sort controls read/write the table's existing key and direction, including both
directions for merchant/category (and Group payer). Applying unrelated edits
retains the current sort. Phone sorting uses the existing four presets.

All dates, month, day and custom inclusive date bounds remain available through
`SearchDateScope`. Explicit bounds replace the ordinary month scope. Without
bounds, the existing ledger scope applies: desktop Personal defaults to all dates,
mobile Personal retains its current month/all-dates flag, and Group defaults to
the selected month. The editor states its effective scope. Reset/Clear do not
change the month selector or primary type. Search remains independent of Reset.
Business period behavior and Group search's all-date scope remain intact.

Bounds reject negative amounts, exponent notation, excessive precision,
non-numeric values, unsafe limits, inverted min/max, and inverted dates. Blank
bounds are unrestricted; zero is an active bound. Existing filtering functions
still own matching, ordering, financial totals and authorized data scoping.
Group pagination and Personal list/scroll resets retain their existing owners.

## Overlay and accessibility

Quick filters reuse the shared `Toggle`; value dropdowns reuse `Select`.
The overlay reuses `useModalFocus` for focus trapping, Escape, focus restoration,
scroll locking and mobile Back. It carries the trigger's ledger context into its
portal. `Select` portals remain inside the dialog; its first Escape closes the
listbox rather than discarding the entire draft. Desktop positioning clamps to
the viewport and recalculates on resize/scroll. Mobile uses the app's visual
viewport variables, a 90% height cap, bottom safe area, an independent content
scroller and a persistent footer. `useTransactionFieldVisibility` reveals focused
fields after keyboard/visual-viewport changes. Controls have 44px targets,
semantic colors and visible focus; no new animation is introduced.

## Regression coverage

Unit/component tests cover localized cents validation, reset isolation, chip
removal, draft Apply/discard, focus return, nested Select dismissal, Group quick
filter serialization/intersections, selection retention, and existing ledger
search behavior. Chrome fixture checks passed for 48 combinations: Personal/Group, all three
appearances, light/dark, and 320/393/430/1280px widths. Checks used emitted
production CSS and the real shared components, with fictional options and no
authenticated account. They verified bounded overlays, internal scrolling,
persistent footers, unchanged results geometry, nested Select Escape and focus
return, with no browser errors. Real account end-to-end flows and installed
iOS/Android keyboard/PWA behavior still require device acceptance testing.

## Files in this change

- `docs/transaction-filters.md`
- `src/app/root-document.tsx`
- `src/app/transaction-filters.css`
- `src/components/groups/GroupLedger.test.tsx`
- `src/components/groups/GroupLedger.tsx`
- `src/components/groups/GroupSearch.tsx`
- `src/components/groups/GroupTransactionFilters.tsx`
- `src/components/mobile/ActivityFilters.tsx`
- `src/components/mobile/screens/Activity.tsx`
- `src/components/shared/PersonalCalendar.tsx`
- `src/components/shared/SearchDialog.test.tsx`
- `src/components/shared/SearchDialog.tsx`
- `src/components/shared/TransactionFilterChips.ts`
- `src/components/shared/TransactionFilterControl.test.tsx`
- `src/components/shared/TransactionFilterControl.tsx`
- `src/components/shared/TransactionFilterEditor.tsx`
- `src/components/shared/TransactionFilterOverlay.tsx`
- `src/components/web/SavedViews.tsx`
- `src/components/web/TransactionFilters.test.tsx`
- `src/components/web/TransactionFilters.tsx`
- `src/components/web/views/Transactions.tsx`
- `src/lib/groups/search.test.ts`
- `src/lib/groups/search.ts`
- `src/lib/transactions/filter-draft.test.ts`
- `src/lib/transactions/filter-draft.ts`
- `src/lib/views/types.ts`
- `src/messages/en-CA.json`
- `src/messages/fr-CA.json`
- `src/messages/zh-Hans.json`
- `src/messages/zh-Hant.json`
- `src/state/business-view.ts`
- `src/state/initial.ts`
- `src/state/transaction-filters.test.ts`
- `src/state/transaction-filters.ts`
- `src/state/types.ts`

## Scroll discoverability

`FilterScrollHint` shows a downward chevron and localized “More filters below”
message between the scroll region and the persistent actions whenever unseen
fields remain below. A subtle card-colored edge fade reinforces continuation
without hiding controls. It disappears at the bottom and is absent when all
fields fit. Scroll/resize observation tracks the viewport and inner content,
including date fields, validation and keyboard-driven size changes. The hint
is shared across Personal/Group and desktop/mobile, uses semantic tokens, has
no animation or focus target, and does not alter filter state.

Mobile sheets also restrict browser panning to the vertical axis while retaining
pinch zoom. The field viewport cannot scroll horizontally, intrinsic control
widths can shrink, and long category/quick-filter labels wrap. Horizontal
overscroll does not chain into the sheet/background. These constraints are
scoped to the filter UI; nested Select portals remain outside its clipped field
viewport and retain their keyboard/touch behavior.
