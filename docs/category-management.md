# Category management

Personal and group ledgers start from `DEFAULT_CATEGORIES` and share the same
identity fields, icon picker, colour control and organizer. Their category IDs
and financial data stay independent: changing one ledger does not synchronize
another ledger. Group category changes remain owner-only.

Edit opens a focused dialog. Save applies immediately. Delete is separated at
the bottom, styled with the danger token, and explains that financial records
are retained as uncategorized. Category Archive/Restore controls are removed.
Group category deletion retains an archived identity internally so historical
split snapshots can still name the original category. Children are promoted to
the first level; recurring schedules lose the deleted assignment. Personal
category deletion uses its existing `ON DELETE SET NULL` relationships.

## Organization

`CategoryOrganizer` supplies both ledgers with sibling up/down controls,
two-level parent changes, drag/tap targets, merges and local Undo. A root moved
under another root lifts its children to siblings, preventing a third level.
All changes stay local until Save, with no second save/discard dialog.

When a changed parent affects existing financial records, the user must choose
“Move with the category” or “Make uncategorized”. The latter clears the category
assignment; it never deletes or changes the amount of a transaction. The server
checks decisions against the complete ledger. Reordering alone needs no record
choice. A merge moves records and recurring assignments to the surviving
category and conserves category budget allocations. It is described inline.

Personal tree writes lock the user row and compare a category-definition revision.
Group tree writes use the group revision and owner checks. A concurrent change
requires a reload; neither organizer silently adopts a new baseline. Identity
CRUD uses the same personal lock to serialize against tree edits.

`categories.parent_id` and `group_categories.sort_order` were added by generated
migration 0025. Personal/group hierarchy and ordering are therefore persistent.

## Confirmation boundary

Adding, editing and dismissing an ordinary transaction or category form needs no
secondary confirmation. One to five selected transaction deletions apply
directly. Six or more display a second confirmation, controlled by the shared
`requiresDeleteConfirmation` policy. Whole-group closure/leave still confirms.
Member removal and ownership transfer apply from their dedicated controls.
Authorization, conflict checks, audit reasons and error feedback remain active.

Group Settings has no Export CSV shortcut; export remains on Import / Export.
Archive/reopen and leave live in a separate bottom management panel. Leave uses
the existing membership flow; there is no new hard-delete household endpoint.
