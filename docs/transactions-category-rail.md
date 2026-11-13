# Transactions category rail and sheet

Personal and Group Transactions share `TransactionFilterRail` and
`CategoryFilterPanel`. Desktop keeps its existing ledger-specific rail width.
Below the existing 1024px boundary, a category chip opens the same browser in a
sheet. Category entry forms and their picker layout remain unchanged.

## Filters and counts

Ledger adapters supply authorized categories, scoped direct-assignment counts,
the selected ID(s), total count and exact-selection callbacks. All categories
clears only the category dimension; dates, amount, query and other filters remain.
Personal income mode supplies income sources instead. Advanced Personal
multi-category filters retain their existing semantics and all selected rows are
identified; selecting a rail row replaces them with that exact category.

`categoryFilterView` adds direct counts to each ancestor to describe branch
counts. A branch click only expands or collapses. Its first selectable child is
“[Parent] only”, with the direct count and exact-category callback. Children select
their exact category. Aggregate counts are never used as filtering criteria.
The existing direct counting logic and APIs were already consistent; no counting
API or financial aggregation was changed. Group archived ancestors are retained
when a visible counted/selected child needs its hierarchy. Selected archived
categories remain available at zero; unavailable IDs receive an explicit chip
label and can be cleared without manufacturing category data.

Mobile Personal uses the same existing scoped-filter engine in two passes: all
non-category/source constraints, then category/source selection. The first pass
also supplies chip/sheet counts, avoiding counts narrowed by the active category.
Group retains its existing non-category search scope and full-history fallback.

## Hierarchy and state

`categoryFilterIndex` indexes nodes and builds guarded ancestry/full paths.
`useCategoryDisclosure` stores only manual expansion/collapse. Selection reveals
its ancestors unless manually collapsed. A new selection (including categories
arriving later) clears conflicting collapse overrides for its new ancestors.
Collapsed branches containing a selected category display a circle-dot and a
localized accessible description, not a selected-row checkmark.

Search normalizes Unicode and matches case-insensitive full category paths.
Ancestors remain visible and matching paths reveal their branches temporarily.
Matching a parent includes its descendants because their paths contain its name.
Search does not alter counts, selected filters or manual disclosure state; clearing
it restores manual state subject to the current selection. No-match searches keep
All categories available.

The optional Hide empty categories checkbox lives in the compact preferences
popover. It defaults off and uses browser session storage, shared across ledgers
without sharing category IDs. Zero rows are hidden unless selected or needed as
ancestors; direct parent-only zero actions are hidden unless selected. Search
ignores hiding. Blocked browser storage gracefully leaves normal visibility.

Month navigation keeps the Group workspace mounted by group ID, preserving rail
state and scroll position. Reviewed bulk selections and transient record details
still reset on month changes, as they did under the former month-based remount.
Group switches remount by group ID. Personal and Group own separate rail instances;
category/source dimensions have separate keys. Closing/reopening the sidebar or
sheet preserves manual state and the query within that mounted workspace.

## Layout and accessibility

The header, 36px search field and All categories control are fixed flex children.
Only the remaining tree area scrolls. Connector lines, child icons and reserved
leaf-chevron space are removed. Rows have at least 44px height; children use quiet
regular labels with a small inset and full-width targets. Native title tooltips
follow existing rail conventions and full paths remain accessible names.

Selectable rows use `aria-pressed`, a semantic soft fill and a checkmark.
Expandable rows use one native button with `aria-expanded` and `aria-controls`.
A separate accessible description identifies a hidden active descendant. Insets
keep keyboard focus visible inside the scroller. Shared branch-trigger additions
are optional, preserving entry-picker geometry and behavior.

The sheet reuses `transaction-filter-overlay` viewport/safe-area styles and
`useModalFocus` (focus trapping/restoration, scroll lock and mobile back layer).
Leaf, parent-only and All selections apply immediately and close; expansion and
search keep it open. There is no Apply button. The portal inherits ledger context.

## Verification

- Full Vitest run: 900 passed, 50 skipped. After the final preferences Escape
  refinement, all 37 focused rail/hierarchy/Group ledger/entry-picker tests passed.
  The broader targeted run also covered existing Personal/Group filtering tests.
- ESLint, ES compatibility, all four locale catalogs (1551 keys), standalone
  TypeScript and the final production build passed.
- Final local Chrome matrix: 40 cases across Personal/Group,
  320/390/768/1024/1440px and Elegant/Vibrant light/dark. Real shared components
  and production CSS used fictional props and a table-width placeholder. Expanded,
  selected/collapsed and search states were captured and inspected. Checks covered
  bounded tree height, fixed reset/header placement, 36px search, 44px row targets,
  no horizontal overflow, immediate sheet selection/focus restoration, hide-empty
  visibility, preference-menu bounds, Escape and collapsed-rail width.
- Native phone keyboard/safe-area behavior, assistive technology and signed-in
  backend flows were not exercised. Existing modal and viewport primitives are
  reused; no endpoint, permission, schema or dependency changes were introduced.
