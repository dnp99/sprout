# Group ledger bulk actions

Group Transactions exposes **Import records** (the existing CSV/receipt review
workspace) and **Select records**. CSV import already creates many group entries
in one reviewed request, with a selected payer; see
[group-import-export.md](group-import-export.md).

## Selection and mobile controls

Rows become individually selectable. **Select this page** adds the current page;
**Select matching records** adds records from the complete authorized filtered
ledger, not only its paginated rows. Selection survives paging, clears when
search/payer/scope changes, and resets when changing group or month. A batch is
limited to 200 records; the cap is stated alongside the selection controls.
The captured entry versions do not advance during background refreshes.

A wrapping sticky action bar shows the selected count, Clear selection, Export,
Copy to another group, Change date, Change category and Delete. Mutation forms
use the shared accessible dialog and 44px targets. While a request runs, group
navigation and conflicting controls are disabled. Failures retain selection and
show the server message; conflicts refresh the source group for review.

## Operations

- **Export selected:** downloads a CSV containing exactly the selected posted
  entries, using the same signed-money/category/payer/author format as group
  import/export. Archived groups can still export. No repayments or unselected
  entries are included.
- **Change date/category:** updates all selected rows atomically, preserves
  author/payer/saved shares and increments entry versions. Existing three-day
  edit highlighting applies unless disabled. Calculated financial records queue
  optional split review, preserving their previous snapshot until explicitly included. Any active member can edit, matching individual
  group editing. Categories must be active and belong to the group; clearing
  category is supported. Category default changes do not recalculate shares.
- **Delete selected:** uses the existing soft-void model, retaining entry/share
  rows and audit history while removing them from posted totals and balances.
  Each entry must belong to the acting author, or the actor must be group owner.
  A reason is required and the dialog is the explicit confirmation.
- **Copy:** retains source entries and creates new destination entries. The
  actor must be an active member of both unarchived groups. The form loads the
  destination group and asks for one active destination payer (or shared funds)
  for the entire batch. The destination
  actor is the new author. Categories match active destination categories by
  normalized, case-insensitive name; unmatched names become Uncategorized.
  Copies start uncalculated and do not create debt until explicitly split. Source membership
  IDs, debts, original entry IDs and original creation timestamps are not reused.
  Income has no shares or settlement impact.

## Linked refunds

Deleting an original expense requires selecting all its posted refunds; a refund
can be voided independently. Changing category requires selecting the original
expense and every posted refund together. Date changes validate the final state:
refunds must remain on or after their original expense's date, including when
moving the complete family to a new date.

Copying a refund requires selecting its original expense. New IDs reconnect the
refund to the copied expense. Its category, settlement setting and split derive
from that new expense; exact cents use the existing refund allocator with
previously copied refunds deducted. Invalid dates, excess refunds or invalid
used destination defaults reject the entire batch.

## API and consistency

`POST /api/groups/:id/bulk` uses the existing session, same-origin and request-size
checks. Its closed action vocabulary is export/delete/date/category/copy.
Payloads contain a mutation UUID, source revision and explicit `{id, version}`
selection. Copy additionally carries destination group/revision, payer ID and
settlement option. IDs, versions, bounded batch size, date and delete reason are
validated before entering the repository.

The repository locks the acting user first, then involved groups in UUID order,
matching account deletion and preventing opposite-direction copy deadlocks.
Membership is revalidated in both groups. Every selected entry must be posted,
belong to the source group and match its captured version. Source revision and,
for copy, destination revision must match the reviewed snapshots. Read-only export
uses shared locks and does not create financial or mutation-receipt writes.

Writes, activity events, source/destination revision changes and mutation receipt
commit in one transaction. Any validation or database failure rolls everything
back. Retrying the exact mutation returns its receipt before revision checks;
reusing its key for a different payload is rejected. The client retains the exact
UUID/revision after network failures, so retrying copy cannot duplicate a committed
batch. A failed refresh after a successful write never retries that write.

Bulk activity events record before/after edits or void reasons. Copy-in logs new
entry IDs; copy-out records only the count, avoiding disclosure of destination
names or finances to source-only members. Personal financial tables are never
read or written by these actions. No schema migration is required.

Pure tests cover selection validation, limits, final refund state and destination
copy planning. The isolated PostgreSQL harness also checks atomicity, permission
boundaries, revision conflicts, copied shares, idempotency and personal isolation.
