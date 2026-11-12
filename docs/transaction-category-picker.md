# Transaction category drawer

Personal and Groups transaction entry share `TransactionCategoryPicker`. The
category field opens a right-aligned, viewport-height dialog (full width on
phones) rather than a narrow flat dropdown. On desktop, this same searchable hierarchy
uses a rounded popover anchored to the Category field, without a second scrim.
It opens below the full-width Category field, stays within the viewport, and caps its
height at 360px with internal scrolling. Resize/background scrolling dismisses
the popover. Mobile retains the right-side drawer.

The initial view lists parents only. Clicking anywhere on a parent row expands or collapses its children.
The first option inside each expanded branch, “Select [parent]”, selects the
parent itself. Leaf categories still select immediately. The currently selected child's parent starts
expanded. Categories whose parents are unavailable remain selectable at root.
Search matches full category paths so children can be found without expanding
parents, and results include parent context. Optional category fields retain an
uncategorized choice. Choosing a row updates only the category and closes the
drawer; closing without choosing leaves the draft untouched.

The drawer uses shared modal focus trapping, Escape handling and
focus restoration. It inherits ledger context through its portal and uses the
same theme tokens across appearances. It respects the visual viewport during
keyboard entry. Existing shared selects elsewhere are unchanged. The parent transaction editor
owns browser Back; the drawer closes through Close, Escape or selecting a row
without creating another route-history entry.

## Desktop transaction filter rail

The shared Personal/Groups desktop rail has a local search below its heading.
It searches option names/full paths (categories or income sources), reveals
matching children beneath their parent, and preserves the active table filter,
counts and manual expansion state. Clearing search restores the full list.
“All categories”/the equivalent all-sources action stays visible as a reset.
The former instruction subtitle is omitted and leaf rows reserve no disclosure
column, leaving more room for readable names. Mobile filters are unchanged.

Entry fields place Category on its own full-width row directly beneath Amount,
before Merchant/description and transaction type.
The next row holds Transaction date and the Group payer/recipient together;
Personal date uses the full row. More details follows. Group category options
retain parent IDs so expanding/searching uses the same hierarchy as Personal.
Popover Close keeps its focus indicator inset so the rounded shell cannot clip it.

The desktop rail search is 36px high and retains shared control typography.
Its concise hint is “Search categories…” (or the current dimension’s name).
Collapse/expand uses Lucide ChevronLeft/ChevronRight with existing localized
tooltips and accessible labels; surfaces and focus use semantic theme tokens.

The desktop rail heading and collapse chevron share a vertically centered flex
row; removing the subtitle must not leave the title aligned to the button’s top.

The current entry order is Amount → Category → Merchant/description →
Transaction date / Group payer → transaction type → More details. The type
control remains shared and keeps its existing options and behavior.

Category selection buttons fill their available row width, including indented
children and search results. Parents with children use the shared
`CategoryBranchTrigger` in both the entry picker and desktop transaction rail.
The icon, name, count and chevron all belong to one full-width expansion button
with a minimum 44px height; there is no narrow arrow-only expansion target.
Expanded branches include an explicit “Select [parent]” action followed by
children, preserving exact parent-category filtering and assignment. Expansion
never selects a category or closes the picker. Search results and leaf rows
retain immediate selection. Keyboard activation uses native buttons with
`aria-expanded`/`aria-controls`, semantic theme colors, and visible focus.
Personal and Group share this behavior in all appearances and responsive layouts.
