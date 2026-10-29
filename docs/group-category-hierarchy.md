# Group category hierarchy and merges

Group Settings → Group categories → **Organize categories** supports two levels.
This first implementation applies to group categories; personal categories keep
their current model. Existing categories start as roots, with unchanged IDs.

## Draft editing and confirmation

Owners of an unarchived group can open the organizer. Drag a handle with a mouse
or touch pointer, or select a handle and activate a destination box with touch
or keyboard:

- **Top-level categories:** promotes a child to a root.
- **Subcategories of …:** moves the selected category under that root.
- **Merge into …:** consolidates the source into that surviving category.

The editor can create a new category in the draft. Existing roots or children
can then be merged into it, or become its children. A parent cannot be moved
under itself or one of its children. Promote that child first if it should be
the new parent. Moving a root with children under another root lifts its existing
children alongside it; no third level is silently created. Merging a parent
adopts its children under the surviving root (or the surviving child's parent).
Earlier merges are redirected if their draft destination is merged again.

Nothing is written while dragging, adding, moving, merging or undoing. Draft
changes list every created category, level change and merge. **Save and review
changes** validates the complete graph and opens a review state. Only the
separate **Confirm and apply changes** action sends the mutation. Back returns
to the draft. Closing a changed draft requires explicit discard confirmation.
Touch dragging uses a handle with pointer capture and edge auto-scroll; normal
category content remains scrollable. Every action is also available without
requiring a dragging gesture.

The organizer captures its original group revision. Background data or failed
save refreshes never silently advance that baseline. A conflict blocks saving
until the owner explicitly reloads categories and reviews a new draft. The API
checks both the ordinary mutation revision and the draft's expected revision.
Retries retain existing mutation-key idempotency.

## Persistence and financial invariants

`group_categories.parent_id` is a nullable self-reference. An index covers group
and parent; a check rejects self-parenting. Application validation under the
existing group write lock enforces same-group ownership, active roots, exactly
two levels, unique category names and unambiguous short-name/path aliases.
The complete draft must retain every active category or explicitly merge it.
There can be at most 100 active categories and 500 stored categories including
archived history. Existing category edit/archive controls remain available;
a parent with active children must have those children moved or archived first.
Restoring a child whose parent is archived promotes it to a root.

Promotion/demotion only changes the parent relationship. A merge:

1. Creates new destination categories as needed and saves the final graph.
2. Reassigns all source-category group entries, including linked refunds and
   voided history, to their surviving destination. Entry versions advance so
   stale individual/bulk editors cannot overwrite the migration.
3. Combines source and destination budget allocations for **every month**,
   conserving total allocated cents and each month's pool. Integer overflow
   rejects the whole transaction.
4. Archives source categories rather than deleting their historical identities.
5. Records the before/final category graph, merge map and affected entry count
   in the group activity trail, and advances the group revision once.

Money, payer/author IDs, refund links, saved share weights/cents and repayments
are unchanged. The transaction rolls back every category, ledger and budget
change on failure. Target category split rules win; source rules stay attached
to the archived source for history. New records use an explicit child rule,
then the parent's rule, then the group default. Saved entries are never re-split.

## Labels, imports and reports

Expense forms, bulk category selection, split settings, category settings and
budget rows show stable tree order and **Parent / Child** labels. Reports retain
one direct-category bucket per stable ID, displaying its full path; budget and
report totals do not double-count children as additional parent spending.
Moving a category does not transfer its own allocation to its parent.

CSV/audit export emits full paths. Group CSV/receipt import accepts both unique
short names and paths, and uses the same child → parent → group split resolution.
Cross-group copying first matches a full path, then a unique short name, otherwise
uses Uncategorized. Group category colors and draft icon previews are retained.

Migration 0023 was generated with Drizzle and adds the nullable parent field,
self-FK, index and self-parent check. There is no personal-category backfill or
cross-ledger data copy. Pure tests cover moves, merges, paths, cycles, incomplete
graphs and split inheritance. Component tests cover review/confirmation, undo
and stale-draft blocking; isolated database tests cover authorization, revisions,
financial conservation, budgets across months and retry receipts.

Run only the isolated hierarchy suite with
`node scripts/test-groups-db.mjs category-tree`; omitting the suite runs all group
integration checks. All modes create and drop their own test database.
