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

The transaction list pages 50 matching records. Search matches merchant/name
and notes case-insensitively across the complete authorized ledger before
pagination; payer and date scope combine with search. Selected month is the
default date scope; All dates includes history outside the shell month. Shared
funds and former members can be selected as payers. Changing any filter resets
to page one; result count and pagination describe matches. On phones, entry
actions sit below the description so names and dates retain readable space. Filters never alter
monthly summaries, calendar data, reports, balances or authorization. Query text
is capped at 120 characters; requests use q, payer and scope=month|all on the
existing GET endpoint. Group changes discard payer filters from the old group.

Monthly spending/share totals and all-time balances are computed from the
complete ledger on the server, independent of the transaction page or filters.
Repayments and the latest 100 activity events appear separately. Server aggregation
and search currently read the complete group ledger; large-history SQL aggregation
is a future optimization.

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
- Shared-funds expenses count as household spending and create no member debt.
  Member-paid original records create debt only after explicit Split.
- Positive member balance means owed money; negative means owes money. An
  expense credits its payer and debits participant shares. Transfer suggestions
  net all history, including former members; they do not move money.
- The owner saves group/category percentages in Split & Settle. Changed active
  membership invalidates incompatible rules; recording/importing originals
  remains available, while Split requires valid rules for selected records.
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
settlement-enabled refund must identify its recipient. All active members can record linked refunds; the original record author is
preserved when existing entries are edited. Expense financial
changes that would affect linked refunds require voiding those refunds first.

## Membership, permissions, and retention

Group member display names follow the current name in Account settings on the
next group refresh. Payer/author labels, split and repayment selectors, member
lists, reports and both CSV exports share the same authorized member resolver.
Names saved when joining remain fallback labels only; a profile rename changes
no membership IDs, transaction ownership, allocation shares, balances or financial
revision. Deleted/detached accounts keep their anonymized Former member label.

All active members can read the entire shared history and export it. Members
add records and may edit any shared record after a client confirmation. Edited
records are highlighted for three days using the server update timestamp. Members
may void their own records. The owner manages categories,
budgets, invitations, split defaults, archival, ownership, and members; voiding
another author's record remains owner-only and requires an audit reason. Voided entries keep history.

Invitations contain 24 random bytes encoded as 48 hex characters, expire after
seven days, are single use and revocable, and store only SHA-256 token hashes.
Invitation attempts are limited to 30 per hour per authenticated account in the
database. There are at most 100 active members, 100 categories per group, and
50 groups owned by an account. No invitation secrets go into activity or
idempotency receipts. After generating an invite, Send invite link opens the
native device share chooser where supported; otherwise it copies the link for
pasting into a message. Separate Copy invite code and Copy invite link actions
show success/failure feedback. The read-only code can also be selected manually.
Cancelling the native chooser does not report an error or silently copy a secret.
Codes remain local to this one-time response; sharing never creates a new invite.

The directory puts the join panel first on mobile, with a highlighted border,
full-width primary review/accept action, and the named group/history disclosure
before acceptance. Incoming links focus the invitation action. Editing the code
clears its preview; only explicit acceptance joins the group.

Retrying an invite creation after a lost response returns
its identifier only: generate a new invite if the code was lost.

Leaving/removal revokes access immediately while preserving historical shares
and debts. A removed/left member needs a specifically targeted reactivation
invite; an old general code cannot restore them. When an owner leaves, ownership transfers to the earliest-created remaining
active membership (ID breaks timestamp ties). If no eligible member remains,
the group is archived. Historical entries, shares and repayments are retained. Archival freezes financial writes, allowing reads/exports,
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
| `POST /api/groups/[id]/import` | Atomic group CSV import with selected payer and revision |
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

Generated migrations 0019–0022 add group tables, invite throttling, group split
defaults and category split overrides. Follow [database-migrations.md](database-migrations.md); no personal
rows are backfilled or copied. Disabling/hiding UI is a safe rollback strategy;
never drop group tables containing user data as a rollback shortcut.

## Local fusion increment (2026-10-27)

Daily Overview no longer displays share/debt tiles, and transaction rows no
longer expose participant allocation amounts. Settlement details remain in the
settlements surface. Editing keeps the original author and records before/after
audit detail without requiring a correction reason. Voiding permissions are
unchanged. Split persistence is now separate from original entry writes; see
[Split & Settle](split-and-settle.md). Remaining fusion work is tracked in plans/023-together-fusion.md.

Group write origin checks use the request Host authority and URL protocol, so
Next.js internal localhost normalization does not reject browser requests to
127.0.0.1. Protocol and port must match; missing/cross origins remain rejected.
Forwarded host headers do not authorize a different origin.

Shared record merchant/description is optional for income, expenses and refunds.
Blank descriptions remain empty in storage; transaction rows show the localized
record type as a display fallback. Amount and date remain required.

On return from a group route, URL-to-personal-state hydration suppresses the
outbound navigation effect for that commit. React effects still hold the old
section snapshot until the next render; pushing it would race the incoming URL
and cause repeated navigation between personal sections.

Context switching preserves the functional section (personal /categories maps
to group /budget). A multi-group chooser carries ?section through group selection.
Group Goals and other unimplemented tools display an explicit unavailable
state, never personal figures or a silent overview fallback.

## Overview calendar

Overview includes the shared everyday calendar. The snapshot's optional
`calendarEntries` field contains all non-voided entries in the visible month
grid (including adjacent week dates), independent of paged `entries`. Its
endpoint retains membership/role checks. The calendar opens existing entry
editing and prefills new entry dates; archived groups remain read-only. See
[menus-and-calendar.md](menus-and-calendar.md).

### Complete payer/category reporting

Snapshots include authorized non-voided reportEntries independently of paginated
ledger entries and calendarEntries. Overview/Trends adapt actual payer IDs and
signed amounts into the shared linked insights card, with category and payer
filters that intersect. Shared funds is a distinct payer bucket. See
[overview-insights.md](overview-insights.md). This changes reporting payloads,
not ledger accounting, balances, membership permissions or schema.

### Group entry and chooser

After the group list loads, plain /groups automatically opens the sole group,
retaining the requested functional section. Zero groups show create/join; two
or more show clickable group-name cards with explicit bold names. The rail's
Create / join group and All groups entry use ?manage=1, preserving access to the
directory even with a single group. Invitation URLs or pending invitation tokens
also suppress the shortcut, so joining another group is never bypassed.

## Group import / export workspace

Group navigation now includes the shared import/export workspace with an explicit
whole-file payer choice. CSV and reviewed receipt rows write only to the group;
posted transaction exports use the shared date ranges while full audit exports
retain shares, voids and repayments. See [group-import-export.md](group-import-export.md)
for eligibility, split snapshots, retry/deduplication rules and limits. This
supersedes the original v1 deferral of CSV/receipt imports.


## Category split defaults

The normalized category/default tables are configured in Split & Settle. The
compact percentage panel shows the group baseline plus effective category
exceptions; editing remains available for every parent/child category. Original
entry/import/copy forms contain no allocation controls. See
[split-and-settle.md](split-and-settle.md) for inheritance, review and calculations.
Migration 0022 introduced normalized rules, 0023 hierarchy, and 0024 independent
calculation snapshots. Preference changes alone never rewrite saved results.

## Category color controls

The group category editor presents a borderless circular color swatch beside a
round, unframed icon picker. The swatch opens the native color picker and keeps
a 44px keyboard-accessible touch target. Its draft starts from the category's
saved color when Edit is selected; a new category uses the current draft color
(or the group's first category accent initially). Changing color immediately
tints the draft icon. Save persists that accent for category icons across group
views. Cancel does not change the stored category color. Personal icon styling
is unaffected; group accents apply in both palettes and color modes.

## Ledger bulk actions

Transactions supports CSV/receipt import and versioned multi-row selection for
export, date/category edits, copying to another group and soft deletion. Saved
shares are preserved on metadata edits with optional review; copies use destination
identities and remain uncalculated until Split. Refund families, permissions and revisions are validated atomically.
See [group-bulk-actions.md](group-bulk-actions.md) for selection limits, copy
semantics and API/retry guarantees.

## Category hierarchy and merge drafts

Group categories support two levels and an owner-only drag/select organizer in
Settings. Level changes and merges into existing or newly drafted categories
stay local until Save/review and a separate final confirmation. Merging moves
record category references and conserves all monthly category allocations while
preserving money, payers and saved shares. See
[group-category-hierarchy.md](group-category-hierarchy.md) for graph validation,
refund/history handling, split inheritance and conflict behavior.

### Confirmation dialogs and scrolling forms

Group discard, edit, void, membership, ownership and archive confirmations use
`useGroupConfirmation` and the shared themed `ConfirmDialog`. They await the
member's choice before navigating or mutating data. Cancel, backdrop click and
Escape retain the draft. Focus starts on Cancel, stays within the confirmation,
and returns to its invoking control. Confirmations render above the editor in a
portal so scroll containers and backdrop filters cannot clip them. Context
switching also awaits the choice. Browser tab close/reload retains the browser's
standard unsaved-work safeguard.

The shared modal keeps its title and close button outside the scrollable body.
The body uses a dynamic viewport height limit, supports wheel, keyboard and touch
scrolling, and hides the native scrollbar using the app's `no-scrollbar` utility.
Both dialog surfaces use semantic tokens for Vibrant/Cozy and light/dark modes.

## Explicit Split workspace

Split & Settle now owns saved hierarchical percentage preferences and explicit
period/record calculations. Original saves no longer automatically allocate;
legacy shares remain readable. Optional edited-record review and independent
latest snapshots preserve old calculations when an edit is excluded. Category
parents, month/week/date selection, calculation badges, header date jumping and
the optional three-day highlight are described in [split-and-settle.md](split-and-settle.md).
This supersedes earlier sections describing automatic allocation on every save.

### Edited rows in the group ledger

Recently edited records use a softly tinted, rounded surface and a compact
“Edited” badge beside the merchant name. The badge and tint respect the existing
edited-highlight preference and expire after three days. Split status remains
visible beside the title. A keyboard-accessible Details disclosure holds the
recording member, recorded timestamp and latest edit timestamp, leaving the
payment date, payer and amount visible in the main row. The duration is not
shown in the row; the existing group activity history remains available in
settings. Semantic tokens keep this treatment consistent in both visual themes
and light/dark modes.

Category editing, organization and deletion are documented in
[category management](category-management.md). Shared Goals/Recurring screens and
independent household plans are described in
[shared ledger features](shared-ledger-features.md).
