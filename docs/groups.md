# Groups

Groups are separate shared ledgers for household budgeting and expense splitting.
Personal transactions, bank accounts, imports, income labels, goals, merchant
rules, API tokens, and budgets remain private and unchanged. Groups use CAD and
calendar months. Vibrant/Cozy and System/Light/Dark apply to both contexts.

## Screens and navigation

The Personal / Groups switch opens `/groups`, where a user can create or join
multiple groups. `/groups/[id]` is Overview; `/transactions`, `/budget`,
`/settlements`, and `/settings` are group child paths. One responsive shell uses
sidebar navigation on desktop and bottom tabs on mobile. Group routes bypass
personal section synchronization and never replace personal store payloads.

On mobile, the group name is a plain, wrapping page heading above the month
controls. The group picker stays in the desktop rail; mobile users switch via
the quiet Manage groups navigation link. Personal / Groups uses a soft active
navigation tint so filled primary buttons remain identifiable as actions.

An invitation link preserves its code through login in session storage, then
scrubs it from the URL. Joining requires preview and explicit acceptance of
access to existing shared history. If browser storage is blocked, paste the
code again after signing in. Local account preferences do not change other
members' themes.

The transaction list pages 50 records of the selected month. Search and payer
filters apply to that visible page (the interface states this). Monthly
spending/share totals and all-time balances are computed from the complete
ledger on the server, independent of the page. Repayments and the latest 100
activity events appear separately. Server aggregation currently reads the
complete group ledger; large-history SQL aggregation is a future optimization.

## Budget and money rules

Entries use signed integer cents: expense negative, income/refund positive.
Repayments, budget allocations, and participant shares use positive magnitudes.
Every entered amount is bounded to the Postgres integer range and parsed with
the existing locale-aware parser. Only `formatMoney()` renders money.

- A monthly pool contains category allocations, whose sum cannot exceed it.
  Each YYYY-MM plan is independent. Copy previous month fills a draft; Save
  persists it. Income is reported separately and does not increase the pool.
- Expenses count in full toward household spending. Payer and author are
  different identities; a member may record an expense another member paid.
- Equal allocation uses equal integer weights, with deterministic largest-
  remainder allocation. Custom percentages use basis points totaling 10,000.
  Allocated cents and weights are stored, so defaults and membership changes
  never recalculate old shares.
- Shared-funds expenses and member contributions with settlement disabled count
  as spending/attributed shares but create no member debt.
- Positive member balance means owed money; negative means owes money. An
  expense credits its payer and debits participant shares. Transfer suggestions
  net all history, including former members; they do not move money.
- The owner can set equal or custom defaults for new expenses. A changed active
  membership invalidates a saved custom member set. New drafts fall back to
  equal shares and display a review notice until the owner updates defaults.
- Income creates no settlement obligation in v1. No shared income distribution,
  linked bank funds, personal transaction linking, or currency conversion exists.

## Repayments and merchant refunds

Either active counterparty can record an actual repayment immediately. There is
no pending/approval state. Posting credits the sender and debits the recipient,
without changing spending, income, or either person's private transactions.
Overpayments are allowed because actual payments can reverse who owes whom.

A network retry reuses its mutation ID. An independent second recording with
the same sender, recipient, date, and amount produces a duplicate warning.
Explicit acknowledgement includes the current matching IDs; a new concurrent
match forces another review. Two legitimate identical payments remain possible.

Posted payment amounts are immutable. Either counterparty or the owner can
reverse a payment with a reason. The original amount, participants, recorder,
and timestamp remain; `reversed_at`, `reversed_by`, `reversal_reason`, and an
audit event preserve the correction. Reversing twice fails. Enter a corrected
payment separately. The owner may record a payment on behalf of other/former
members only with an override reason.

Merchant refunds link to an original group expense, inherit its category and
settlement behavior, and reverse original participant shares. Refunds reduce
spending on their own dates; they are not income. Multiple partial refunds
cannot exceed the original amount or any member's original allocation. A
settlement-enabled refund must identify its recipient. Expense authors or the
owner can record refunds; owner overrides require a reason. Expense financial
changes that would affect linked refunds require voiding those refunds first.

## Membership, permissions, and retention

All active members can read the entire shared history and export it. Members
add records and edit/void their own records. The owner manages categories,
budgets, invitations, split defaults, archival, ownership, and members; correcting
another author's record requires an audit reason. Voided entries keep history.

Invitations contain 24 random bytes encoded as 48 hex characters, expire after
seven days, are single use and revocable, and store only SHA-256 token hashes.
Invitation attempts are limited to 30 per hour per authenticated account in the
database. There are at most 100 active members, 100 categories per group, and
50 groups owned by an account. No invitation secrets go into activity or
idempotency receipts. Retrying an invite creation after a lost response returns
its identifier only: generate a new invite if the code was lost.

Leaving/removal revokes access immediately while preserving historical shares
and debts. A removed/left member needs a specifically targeted reactivation
invite; an old general code cannot restore them. Owners must transfer ownership
before leaving. Archival freezes financial writes, allowing reads/exports,
owner transfer, and owner reopening. There is no automatic 72-hour deletion.

Account deletion locks the account and its groups, blocks an active owner until
they transfer or archive, and then detaches/anonymizes memberships before deleting
personal data. Shared entries, allocation identities, repayments, and activity
remain available to the other members. Archived groups whose owner deleted their
account stay read-only. The deletion dialog and privacy/data pages disclose this.

## Implementation and concurrency

`src/db/group-schema.ts`, re-exported from `schema.ts`, defines the additive
household schema. Owner role is held on the stable membership row with a partial
unique index enforcing at most one active owner. Application transactions create
and transfer ownership without exposing an ownerless active group.

Domain modules under `src/lib/groups/` handle validation, accounting, membership,
ledger operations, DTOs, exports and request boundaries. Routes are thin:

| Endpoint                                    | Behavior                                               |
| ------------------------------------------- | ------------------------------------------------------ |
| `GET /api/groups`                           | Current user's active memberships                      |
| `POST /api/groups`                          | Create, invitation preview, or join                    |
| `GET /api/groups/[id]?month=YYYY-MM&page=0` | Authorized group snapshot                              |
| `POST /api/groups/[id]`                     | Validated operation + mutation ID + group revision     |
| `GET /api/groups/[id]/export`               | Authorized CSV of entries, saved shares and repayments |

Every group read/write checks current session and active membership. All foreign
categories, members and entries are resolved within that group. Writes check
Origin and body limits. Writes lock user then group; reads hold a shared group
lock. Mutations recheck membership, archive state, optimistic revision, and
idempotency receipts under that lock, then commit records/shares/activity and
a revision increment atomically. Owner transfer demotes before promoting to
respect the partial unique index. Account deletion uses the same lock order.

`src/state/groups.ts` contributes a focused slice to the existing Zustand store.
It holds group data separately from personal payloads, aborts superseded reads,
checks request generation/account identity, and clears household caches on
logout/context teardown. Network failures retain mutation identities for retries.
The shell polls visible passive screens every 25 seconds and refreshes on focus;
editable screens and open dialogs pause polling to retain their draft revision.
A conflict preserves input and reloads data for review before retry. Offline
writes/caching and sockets are not supported.

The group picker resets draft context on group navigation. Entry dialogs warn
before explicit navigation or page unload. Other form drafts live in their
screen component and are discarded when navigating away. Group dates are stored
as date-only values; client defaults use the device's local date. Shared
MonthSelector, EntitySymbol, money helpers, toasts, and semantic tokens keep the
feature consistent with the rest of Sprout.

## Tests and migrations

`npm test` covers pure accounting, validation, HTTP guards and client races.
Run the PostgreSQL integration suite separately:

```sh
node scripts/test-groups-db.mjs
```

The harness uses the configured development connection to create a uniquely
named temporary database, applies generated migrations there, runs the group
integration tests, then drops only that harness-owned database. It requires
permission to create databases and network access; it never runs fixtures on
the existing application database. The tests reject any DB name outside the
`sprout_groups_test_<timestamp>` pattern. Test pools use four connections to
exercise concurrent members; production keeps its existing single connection.

Generated migrations 0019–0021 add group tables, invite throttling and split
defaults. Follow [database-migrations.md](database-migrations.md); no personal
rows are backfilled or copied. Disabling/hiding UI is a safe rollback strategy;
never drop group tables containing user data as a rollback shortcut.
