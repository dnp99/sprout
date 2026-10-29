# Group import and export

The group rail includes **Import / export** at `/groups/[id]/import`. Mobile
exposes the same entry in the top navigation without adding another bottom tab.
The responsive workspace reuses Personal's CSV presets/manual column mapping,
preflight, complete-row preview, receipt extraction, final confirmation,
completion state and export range picker. The confirmation uses a viewport-fixed,
labelled dialog so scrolling a long mobile preview cannot move acceptance off-screen. Personal imports keep their endpoint
and existing behavior. `useImport` accepts a destination adapter; `ExportPanel`
accepts an authorized group data source instead of counting private transactions.

## Selecting a payer

The current member is the initial payer. Choose any active member, or Shared
funds; this choice applies to the entire uploaded file, including income's
recipient. The importing member remains the author. Payer columns in an input
CSV never override that explicit choice. Import separate files for different
payers. The confirmation repeats the group and payer before writing.

Imports create original records only. No percentages or balance checkbox are
required; importing does not calculate shares or debt. Member-paid expenses can
be selected later in Split & Settle, where the current child/parent/group rules
apply. Shared funds and income create no settlement obligations. Invalid split
preferences do not block recording or importing originals.

## Supported records and categories

Files support up to 5,000 data rows and 8 MB of CSV. Server-authoritative presets
and bounded custom mappings share `src/lib/import/request.ts` with Personal.
Preflight and save use the same group eligibility helper. Invalid dates,
zero/out-of-range amounts, oversized descriptions/notes and unsupported kinds
are skipped with counts and row reasons before confirmation. A file with no
eligible rows cannot be saved.

Only expenses and income are imported. Transfers and card payments are not
household spending. Reimbursements require their original group expense, so
they are skipped instead of becoming unlinked refunds or income. Add merchant
refunds through the existing linked-refund form and member payments through
Split & settle. Check bank credits' mapped transaction types during review.

Category resolution first matches active group category names, then preset
category mappings. Optional AI receives only group category names and unmatched
merchants; it never reads or creates personal merchant rules. No personal
transactions, bank accounts, income sources or capture reconciliation are used.
Unmatched categories remain unassigned. Income-source columns do not create
group income labels; the group mapper omits that personal-only field.

## Atomic saves and duplicate handling

`POST /api/groups/[id]/import` checks session and same-origin requests and bounds
the actual request stream. It validates CSV/mapping/options, reads only an
authorized group, and checks revision/archive state before optional AI work.
AI runs outside the financial write lock. The commit transaction rechecks
membership, revision, archive and active payer under the
normal user-before-group lock order.

Entries, an import activity event, the mutation receipt and
revision update commit atomically. Batches do not partially save. Mutation IDs
make network retries safe; changing a payload under the same key fails. A stale
group returns 409, refreshes its data and retains the draft for explicit review.
The shared workspace disables controls during saving; navigation and unload
guards cover in-flight imports. Unmounted workspaces do not refresh another
group or personal state after a late response.

Deterministic entry UUIDs include group, selected payer and the shared pipeline's
source row fingerprint (date, merchant, signed cents, account and occurrence).
Overlapping statements imported by another member for that same payer skip
existing rows, including edited/voided rows. They never overwrite corrections.
Repeated identical purchases within one file have separate occurrence IDs.
Selecting another payer or changing source account identity defines different
records, so reuse the same payer/source for repeated statements. Manual entries
are not automatically matched. No new database columns or migrations are needed.

## Export

The common range controls offer this month, 90 days, this year and all time.
The count uses the complete authorized reporting ledger rather than a visible
page. `GET /api/groups/[id]/export?format=transactions&range=all` exports posted
transactions as a Sprout-template CSV with signed decimal amounts and extra
payer, author and notes columns. Refunds are labelled Reimbursement and therefore
require manual linking when imported again. Payer selection still applies to
the whole import; an export is not a full state-restoration format.

**Download full group audit CSV** retains the existing full export of entries,
voids, saved shares, repayments and reversal metadata. The endpoint defaults to
`format=audit&range=all` for existing links; range filtering is available for both
formats. Exports enforce active membership, protect text cells against spreadsheet
formulas, and never include invitation secrets or private personal records.
Archived groups can export but cannot import.

## Verification

Pure tests cover eligibility parity, duplicate fingerprints, mapping validation
and CSV escaping. `node scripts/test-groups-db.mjs` also runs the group import
integration suite in its harness-owned temporary database, covering attribution,
shares/balances, retries, duplicate preservation, custom splits, shared funds,
foreign/removed members, archive/revision guards, concurrency and export isolation.


### Category split resolution

CSV and receipt imports resolve each record's category after mapping/optional
AI. Allocation is deferred to explicit [Split & Settle](split-and-settle.md),
which persists separate calculation snapshots without changing the originals.

Transactions also links directly to this import workspace and can export only
its selected records. Cross-group copying preserves the originals, uses an
explicit destination payer and creates uncalculated destination records; see
[group-bulk-actions.md](group-bulk-actions.md).

Group category exports use Parent / Child paths. Imports accept both paths and
unique short names. The later Split calculation resolves child, parent, then group rules.
See [group-category-hierarchy.md](group-category-hierarchy.md).
