# Category management

Personal and group ledgers start from `DEFAULT_CATEGORIES` and share the same
identity fields, icon picker, colour control and organizer. Their category IDs
and financial data stay independent: changing one ledger does not synchronize
another ledger. All active group members can manage group categories.

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
Group tree writes use the group revision and active-membership checks. A concurrent change
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

## Shared default tree

New personal accounts and new groups receive 20 root categories and 60 children,
with independent generated IDs, sibling order and zero allocated budgets. The
shared definition is `src/lib/auth/defaultCategories.ts`; both initializers use
`buildDefaultCategories`. Names remain the confirmed English labels. Category
symbols are persisted identity keys rendered by `EntitySymbol` as Lucide icons;
Car / Tickets uses a warning icon (traffic fines), while Fun / Tickets and
Travel / Tickets use ticket icons. Category accents remain per-category values.

| Parent | Children |
| --- | --- |
| Housing | Rent, Mortgage, Condo & Management Fees, Home Insurance, Repairs & Maintenance, Furniture & Appliances, Utilities |
| Phone | None |
| Wi-Fi | None |
| Groceries | Food, Snacks & Drinks, Household Consumables |
| Dining | Dining Out, Takeout & Delivery, Coffee & Tea |
| Transportation | Public Transit, Taxis & Rideshare, Bike |
| Car | Fuel & Charging, Parking, Tolls, Maintenance & Repairs, Car Insurance, Purchase & Leasing, Rental, Tickets |
| Shopping | Fashion, Beauty & Personal Care, Electronics |
| Healthcare | Medical Visits, Medication, Therapy, Health Insurance, Medical exams |
| Fitness & Sports | None |
| Fun | Movies & Shows, Gaming, Hobbies, Tickets |
| Education | Books & Materials, Courses & Training, Exams & Certifications, Tuition |
| Travel | Transportation, Accommodation, Travel Dining, Tickets, Visas & Travel Insurance |
| Relationship | Family Support, Gifts, Hosting & Treating Others |
| Children & Pets | Childcare Supplies, Childcare & Education, Pet Supplies, Veterinary Care |
| Apps & Subs | Subscriptions, Apps & Tools, Cloud Storage |
| Financial | Bank Fees, Taxes, Documents & Administrative Fees |
| Work & Office | Office Supplies, Work Equipment |
| Service | None |
| Other Expenses | None |

### Existing ledgers

Settings → Categories → Organize categories → Add default categories stages an
additive preview in the shared organizer. Save applies it to the current ledger;
Undo or closing without saving leaves persisted categories unchanged. Existing
IDs, transaction links, budgets, category colors and custom categories remain.
Recognized default icons are refreshed. Legacy starter roots Bills & rent,
Dining out and Transport are renamed to Housing, Dining and Transportation if
the corresponding new root does not already exist. Other categories are never
deleted or moved. Repeating the operation does not add duplicates. The existing
100-active-category limit still applies; exceeding it reports an error before
changing the preview. There is no automatic production backfill or schema change.

### Repeated child names

Names must be unique among siblings, and full paths must be unambiguous across
the ledger. Different parents may have children named Tickets. CSV import and AI
categorization use full paths to distinguish them; an ambiguous short child name
is not resolved by exact name matching. A root label remains a valid root match
(e.g. Transportation); the Travel child must use Travel / Transportation.
Personal and Group exports preserve parent paths so imports can round-trip.
Preset mappings accept both the new and legacy starter root names.

Deleting a parent first checks the promoted child names. If promotion would
collide with an existing root/path, move or rename that child before deleting
the parent; the deletion fails before changing any records.
