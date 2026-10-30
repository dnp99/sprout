# Shared ledger features

Both desktop rails use `sidebarItemClass` for navigation sizing, weight, spacing
and selection, and `useSidebarCollapsed` for the same persisted compact mode.
The group rail retains a group selector and the additional Split & Settle item.
The functional sections include Overview, Transactions, Budget, Trends, Goals,
Recurring, Import / Export and Settings. Account preferences remain accessible
from both contexts; household membership controls belong to Group Settings.

## Goals and recurring bills

The group Goals and Recurring routes render the real personal `Goals`/`Bills`
components rather than placeholders. `LedgerFeatureContext` supplies explicit
ledger data/actions to these screens, `EditGoalForm`, `EditRecurringForm` and
`RoundupSweepCard`. Outside a group provider, they use personal Zustand state.
Group actions always use the existing authenticated group mutation path with
revision checks, archive checks, group locking, audit history and retry receipts.
Personal and group financial stores never share rows or category identities.

Group goals support name, icon, accent, target/saved cents, target date, deletion
and one round-up destination. A group round-up sweep marks contributing group
expenses under the group write lock, preventing double collection. It changes
only savings progress and the collection marker, not expense amounts or splits.

Recurring schedules support income/expense, monthly/weekly/yearly cadence,
calendar anchors, category, pause/resume, editing and deletion. Monthly list and
calendar views reuse the personal reconciliation logic. Completing an unmatched
occurrence creates one exact linked household entry attributed to the member
recording payment. Repeated completion of that schedule/day reuses the live
entry. An invalid schedule date or foreign schedule/category is rejected. A
voided completion may be recorded again; deleting a schedule retains its entries.
The entry has no split calculation until the user runs Split & Settle.

Group data is stored in `group_goals`, `group_recurring_items`, and optional
`group_entries.recurring_item_id` / `roundup_swept_at`. These additions are generated
migration 0026. Group tables cascade only with their group, independent of a
member account. Existing personal tables and APIs retain their user scope.

Shared goal/recurring money forms use the locale-aware integer-cents helpers.
Archived group screens disable interactions and the server rejects writes.
