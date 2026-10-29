# Split & Settle

The group settlements workspace separates original records, saved percentage
preferences, replaceable calculation results, and actual repayments. Creating, importing, copying
or editing an original no longer automatically allocates it. Personal ledgers
are unchanged.

## Workspace and preferences

Group Settings no longer contains percentage settings. The Split workspace has
a left percentage panel on desktop, stacked above the calculator on mobile.
It always shows the group baseline and only shows category rows whose effective
percentages differ from their immediate parent's effective percentages. It does
not show inheritance-source labels. The editor still offers every category.

Group owners save preferences on the server, including zero-percent shares.
Two members initially share equally; larger groups use deterministic integer
basis points summing to 10000. Existing custom defaults are retained. A child
rule overrides its parent; a parent rule overrides the group baseline. Resetting
a category removes its explicit override. Equal-valued explicit overrides may
be hidden in the summary, but remain explicit until reset in the editor.
Membership changes require repairing incompatible saved percentage rules before
calculating affected records. Former members retain historical calculated shares.

Group categories support one child level, configured in Group Settings. Parent
references must be to an active top-level category in the same group; cycles,
self-reference and a third level are rejected. Category display names include
the parent where needed. Existing categories remain top-level.

## Periods and calculations

Select one or more calendar months, Monday–Sunday weeks (showing exact dates),
or an inclusive custom date range. Nonadjacent months do not include intervening
months. Calculations use the full authorized report ledger, never only a paged
transaction list. Choose which eligible member-paid expenses/refunds to include;
income and shared funds do not create settlement obligations.

The preview shows selected member shares separately from projected all-time
settlement balances, which include other saved calculations and actual payments.
Applying replaces the latest result for each included record; repeated or
intersecting ranges cannot add a second copy of its debt. Unselected calculations
and repayments remain unchanged. Originals retain their author, amount, category,
payer, date and version. A small accessible icon marks saved calculations.

Linked refunds and their original expense are one calculation unit, including
family members outside the selected period. The workspace discloses these
extra rows and applies inclusion/exclusion to the family together. Refund shares
use remaining original member capacities in chronological/ID order, preserving
cumulative caps and every cent. Financial edits retain the original refund cap
and date-order validation.

## Edited calculated records

Editing amount, category, payer, date or settlement eligibility offers **Include
this edit in the next split**, initially checked. Saving never changes the old
calculation or real repayments. Checked edits have a non-blocking review icon;
unchecked edits retain the result and are marked excluded without a reminder.

At a later Split containing a pending record, choose Include or Keep previous
result. The latter acknowledges this edit, retains the old financial snapshot,
and excludes it from automatic future range recalculations. An explicit Include
can bring it back. Another financial edit creates a new review decision. Mere
merchant/note edits do not reset that decision. Linked families cannot bypass
pending or excluded reviews by selecting another family member.

Acknowledgement and allocation replacement happen under the existing group lock,
revision conflict checks and idempotency receipt. The server checks record
versions and same-group members/categories. Audit events keep before/after
calculation snapshots; only the latest result contributes to balances.

Existing legacy `group_entry_shares` remain a read-compatible calculation until
an explicit Split replaces them. Before editing a legacy calculated record,
the old financial state is materialized into `group_split_results`, preventing
an edit from changing the amount or payer behind an acknowledged old result.
CSV exports include saved shares, the calculation snapshot and review state so
an original amount and a retained old calculation are distinguishable.

## Navigation and display preferences

The group header retains previous/next month arrows. Clicking its central month
label opens the shared date calendar with month/year selection; choosing a day
in Transactions filters that exact date across the full report ledger, and Show
full month clears it. Month selection/arrow navigation clears the day filter.
Other group screens jump to the chosen month without changing their scope to a
day. Both visual themes share this behavior.

Edited group records highlight for three days by default. **Highlight edited
records for 3 days** is available in group and personal Settings. This is a
browser preference (`sprout-edited-highlight`, `off` to disable), restored by the
store provider; storage failures do not block use. Turning it off hides both
the edit background and recent-edit caption, independently of split review icons.

## Storage and verification

Generated migration `0024_faithful_makkari` adds `group_split_results` after the
existing 0022 category-rule and 0023 hierarchy migrations; no originals or legacy
shares are rewritten or deleted. See [ER diagram](er-diagram.md).

Unit tests cover rule compression/inheritance, exact totals, zero shares,
independent snapshots, repeated calculation, refund rounding and inclusive
calendar boundaries. PostgreSQL integration tests exercise server persistence,
permissions, revision conflicts, acknowledgements, and preservation of financial
history. Run `node scripts/test-groups-db.mjs` for the isolated database suite.

## Entry ordering and recorded time

Both ledgers expose the existing immutable `created_at` as ISO `createdAt`.
Default date ordering uses reporting day descending, then creation timestamp
descending, then stable ID. Backdating a new entry places it first within its
chosen day, and editing an existing entry does not bump its position. Personal
server pagination applies this ordering before its limit; date-sort controls
and the shared calendar agenda use the same comparator. Explicit merchant,
category or amount sorts still follow their selected key.

Group rows, personal table/mobile rows and calendar agendas show creation time
as secondary 10px `text-subtle` metadata, separate from the reporting date. The
timestamp uses the device's local time and selected app language; a tooltip
contains the full timestamp. Legacy in-memory rows without creation metadata
omit it rather than inventing a recorded time. Personal month headers also use
the shared central calendar; exact-day transaction selection uses the existing
date filters, while full-month selection and arrows clear them.

The entry form contains no percentage, participant or include-in-settlement
controls. Member-paid records become candidates in the Split workspace; saving
them alone does not perform a split. The edit-only next-split review option is
shown only when a previously calculated financial record changes.


Bulk category/date edits and confirmed category merges use the same snapshot
review helper as the entry editor. Previous debt stays unchanged; these edits
queue optional review. Normalized category percentage tables remain shared with
the category organizer rather than introducing duplicate rule storage.
