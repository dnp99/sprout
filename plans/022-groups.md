# 022 — Groups: shared budgets, expenses, and repayments

**Status:** Done locally — implementation, generated migrations, and verification complete.
Standing documentation: [`docs/groups.md`](../docs/groups.md).
**Created:** 2026-10-25

## Outcome and confirmed decisions

People can keep a household budget and split expenses with other Sprout users.
A couple can see household spending, their individual shares, and who owes whom
without exposing or changing either person's personal finances.

Confirmed with the user:

- Support both shared household budgeting and expense splitting/repayments.
- Keep groups separate from personal finances for the first release.
- Either repayment counterparty can record an actual payment immediately; no
  recipient approval or pending-confirmation state. Balances update on save.
- Use the homebudget reference's Personal / Group navigation, group picker,
  payer choices, and invitation flow as product references.
- Implement with Sprout's architecture and design system. Both Vibrant and Cozy
  apply to personal and group screens; appearance stays a browser preference.

This document describes proposed work, not shipped functionality. No group
schema, routes, or financial behavior exist in Sprout yet.

## First usable release

- Create multiple groups; join through a revocable code or invitation link.
- Existing Sprout login/signup; owner and member roles.
- Group overview, transaction ledger, monthly/category budgets, Split & settle,
  member/settings screen, activity, and CSV exports.
- Manual expense and income entry, linked partial/full merchant refunds.
- One payer per expense, selected participants, equal or percentage splits.
- Exact per-member cents preview before saving.
- Member-funded expenses can create debts; expenses paid from shared funds or
  recorded without settlement still count toward the household budget.
- Actual repayment records with partial repayments, posted immediately by either
  counterparty and attributed to the person who recorded them.
- CAD only, calendar-month budgets, online operation, English and French labels.

Deferred: personal transaction linking/copying, personal import reconciliation,
shared bank connections, group CSV/receipt imports, Siri/WhatsApp capture,
offline queues, recurring group bills, shared savings goals, annual budgets,
shared income distribution, multiple payers per expense, exact-amount split
entry, category-specific split defaults, other currencies, and live sockets.
Shared goals were discussed as a possible later extension, not a requirement
for the first usable household budget.

## User experience

### Context and navigation

Desktop: place a Personal / Group switch and selected-group picker above the
existing sidebar navigation. No groups shows Create group and Join group.
Group navigation contains Overview, Transactions, Budget, Split & settle, and
Group settings/activity. Personal-only goals, businesses, connected apps, and
imports do not appear in the group navigation. Account settings remain reachable
from the user menu.

Mobile: the header opens an accessible context/group picker. Group tabs are
Overview, Transactions, Budget, Split & settle, and Group; the Add action always
names or clearly displays its target group. Preserve the existing personal tabs.
Group creation/joining uses mobile sheets or existing full-height form patterns;
all touch targets remain at least 44px.

Use real URLs: `/groups`, `/groups/[groupId]`, and child paths for
`transactions`, `budget`, `settlements`, and `settings`. A join landing page
preserves the invitation across login/signup and requires an explicit Join
before creating membership. Browser back/forward and resizing must retain the
same group and section. Invalid or revoked access shows an unavailable-group
state with a path back to Personal; never silently submit into another context.

Personal and group contexts keep separate selected months and filters. Closing
or switching context resets selection, drafts, and detail dialogs after warning
about unsaved input. URLs are authoritative for explicit deep links; an optional
remembered group is namespaced by signed-in user and cleared on logout.

### Overview and budgets

Show household monthly budget, net spending, remaining budget, income, your
allocated share, and your all-time net balance. Label the different time ranges:
a monthly share is not the same metric as an all-time amount owed.

Each month has its own total pool and per-category allocations. Copy previous
month is explicit; changing October must not rewrite September. Unset budget
shows onboarding rather than treating zero as unlimited spending. Category
allocations cannot exceed the pool without an explicit validation error.
Group income is displayed separately; it does not automatically increase the
planned budget pool or create obligations between members.

### Add/edit records

Use focused group forms composed from existing form controls, EntitySymbol,
category picker, money parsing/formatting, dialogs, and toasts.

- Expense: amount, merchant/title, group category, date, note, Paid by, selected
  participants, equal/custom percentages, and Include in settlement.
- Paid by: active member (defaults to the signed-in user) or Shared funds.
  Shared funds is a ledger label, not a linked bank account or extra member.
- Always show the participant allocations for an expense, including when they
  are attribution only. Shared funds forces settlement off. Member-paid records
  default settlement on; the user can turn it off for an agreed contribution.
- Income: positive group cash flow and recipient label; settlement off in v1.
- Refund: choose an original expense, amount/date, and recipient. Inherit its
  category, participant allocation policy, and settlement behavior.
- Show author separately from payer; selecting a payer does not grant another
  user's account access or change who created the record.

An active member sees all history of the group on joining. This is stated on the
join screen; inviting someone shares the group's existing ledger, not personal
transactions. This is a proposed product default to confirm before development.

## Accounting contract

All persisted money is signed integer cents, with the same safe bounds as the
Postgres integer columns. Reject fractional cents and overflow. Shared pure
helpers do calculations; only `formatMoney()` formats amounts.

| Record           | Household spending              | Income    | Member balance                                         |
| ---------------- | ------------------------------- | --------- | ------------------------------------------------------ |
| Expense          | Increases by full expense       | No        | Payer credited, shares debited if settlement enabled   |
| Income           | No                              | Increases | No obligations in v1                                   |
| Merchant refund  | Reduces spending on refund date | No        | Reverses allocated obligations when enabled            |
| Member repayment | No                              | No        | Sender credited, recipient debited immediately on save |

Positive member balance means owed money; negative means owes money.
For settlement-enabled expenses, credit the payer by the expense magnitude and
debit participants by their shares. For refunds, debit the recipient by the
refund magnitude and credit participants by their refunded shares. Repayments
credit the sender and debit the receiver. Balances must always sum to zero.

Example: Deep pays $120, split equally with Jing. Household spending is $120,
each person's share is $60, Deep's balance is +$60, and Jing's is -$60. A recorded
$25 repayment from Jing to Deep leaves +$35 / -$35 and spending remains $120.
A later $20 merchant refund received by Deep reduces spending to $100 and
reverses $10 of each person's share, leaving +$25 / -$25.

### Allocations and history

- Percentages are integer basis points totaling 10,000; use largest remainder
  allocation with a stable membership-ID tie-breaker. Equal splits operate on
  equal weights directly, so three participants are not unfairly treated as
  permanent 33.33/33.33/33.34 percentages.
- Persist both the allocation policy and final cents. Reports sum saved cents;
  they never recompute old shares using current members or defaults.
- The expense payer may be excluded from the selected participants.
- Membership changes do not reset custom settings or touch old expenses.
  Equal defaults include current active members for new records. A custom
  percentage default becomes visibly invalid when its participant set changes;
  the owner must review it before using it again.
- Refund totals cannot exceed the original expense. Their participant cents
  cannot exceed the original shares cumulatively, including penny rounding.
- Refund date cannot precede expense date. Refunds use their own date in reports.
- Editing an expense with refunds must preserve those constraints atomically.
- Once a repayment is posted, retain it. Later expense edits create an audit
  trail and change the current balance; they never erase the payment or silently
  reset a settled flag. The edit preview shows the resulting balance changes.
- Suggested transfers net the entire group's current balances, including former
  members. They are suggestions, not payment execution, and need not preserve
  the original pairwise expense relationships.
- Recorded overpayments are allowed with explicit resulting-balance preview;
  a real payment can reverse who owes whom. Never discard a payment just because
  another expense changed between the actual payment and recording it.

## Proposed permissions and lifecycle

| Action                                        | Owner                               | Active member |
| --------------------------------------------- | ----------------------------------- | ------------- |
| Read ledger/budgets/balances, export          | Yes                                 | Yes           |
| Add records                                   | Yes                                 | Yes           |
| Edit/void own records and splits              | Yes                                 | Yes           |
| Edit/void another author's records            | Yes, with audit reason              | No            |
| Change group/category/budget/default settings | Yes                                 | No            |
| Generate/revoke invitations, remove members   | Yes                                 | No            |
| Leave                                         | Transfer ownership or archive first | Yes           |
| Transfer ownership, archive/reopen            | Yes                                 | No            |

These are proposed defaults. Owner corrections are broader than homebudget's
creator-only editing and must remain visible in the activity log.

Repayments: either active counterparty can record an actual payment immediately,
including a payment they received. Require an explicit sender, recipient, amount,
and date; the signed-in actor must be one of the two counterparties. Posting
updates balances in the same transaction and records who entered the payment.
No recipient approval, pending state, or payment processing is involved. Other
members cannot record a payment between two people unless using the proposed
owner override below. All group members can see the repayment and its author.

The owner may record an actual repayment on behalf of members, including a
former member, with a required reason (proposed permission, still to review).
Posted payments are immutable. Either active counterparty can reverse an
incorrect payment with a reason; the owner may also reverse with an audit reason.
Keep the original and a linked reversal instead of deleting history. A reversal
is not new income or spending and cannot be applied twice. Enter a corrected
payment as a new record after reversal.

Protect network retries with idempotency keys. Two people independently entering
the same actual payment have different keys, so idempotency alone is insufficient:
show a potential-duplicate warning for matching sender, recipient, amount, and
date. Require explicit acknowledgement to post another matching active payment;
allow it because two legitimate identical repayments can occur. Perform this
check under the group lock, and include the current duplicate IDs in the
acknowledgement so a new concurrent match triggers review again.

Leaving/removing revokes access immediately, preserves historical allocations,
and does not forgive debts. Show the outstanding balance and consequences
before leaving/removing. Reactivation requires a new owner-issued invitation
explicitly authorizing that membership; ordinary old codes cannot undo removal.

Archive freezes writes but lets active members read/export the ledger; it has
no automatic 72-hour expiry. Owners may reopen. Hard group deletion and a data
purge policy are deferred. Account deletion must not cascade-delete shared
financial history: require an owner to transfer ownership or explicitly archive
first; detach/anonymize their retained membership and audit identity in the
account-deletion transaction. Update the deletion UI/docs to explain what is
retained before asking for confirmation. Other members' records remain intact.

## Invitation and access contract

- Authenticate with existing Sprout sessions; group membership is a separate
  server-side authorization check on every read and write.
- Owner creates a random high-entropy opaque token; store only its hash.
  The same token supports copyable links and paste-code joining.
- Proposed default: seven-day expiry, one successful membership activation per
  invite, revocable by owner. Joining is atomic and retry-safe; an existing
  active member gets the same membership rather than consuming another seat.
- Preview only the group name and minimal inviter information to an authenticated
  invite holder. Do not expose transactions or the member list before joining.
- Scrub consumed invitation tokens from the URL, avoid logging them or including
  them in analytics, rate-limit code attempts, and validate return paths.
- Check Origin/CSRF protections consistently with session-authenticated writes.
- Group IDs from URLs are never proof of access. Cross-group category/member/
  record references must fail even if the actor belongs to both groups.

## Storage design (proposed; no schema changes in this plan)

Add a group domain alongside the existing user-owned personal tables. Avoid
retrofitting nullable owner/group IDs into every personal domain for v1. Reuse
pure helpers and presentational primitives, not personal repository authorization.

| Table                      | Essential fields / invariants                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `groups`                   | UUID, name, CAD currency, owner membership ID, archived timestamp, financial revision, timestamps                                                                                                                       |
| `group_memberships`        | Stable UUID, group ID, nullable user ID, display name, role, status, joined/left timestamps; unique group/user for identified members                                                                                   |
| `group_invites`            | Group, token hash, inviter, expiry, revoked/used timestamps, optional reactivation membership ID                                                                                                                        |
| `group_categories`         | Group, name, emoji, accent, sort order, archived timestamp; history survives archival                                                                                                                                   |
| `group_budget_months`      | Group + YYYY-MM unique, planned pool cents, version                                                                                                                                                                     |
| `group_budget_allocations` | Budget month + category unique, nonnegative planned cents                                                                                                                                                               |
| `group_split_defaults`     | Group + member unique, basis points for optional custom default; equal is the initial mode                                                                                                                              |
| `group_entries`            | Group, expense/income/refund kind, signed amount, category, author membership, payer/recipient membership or shared-funds label, date, note, split policy, settlement flag, original expense ID, version, void metadata |
| `group_entry_shares`       | Entry + membership unique, allocated cents and basis-point policy where relevant; refund allocations stored explicitly                                                                                                  |
| `group_repayments`         | Group, sender/recipient memberships, positive amount, date, posted/reversed status, recorded-by membership, reversal reference, correction reason, version                                                              |
| `group_activity`           | Group, actor membership, action, entity, before/after financial changes, correction reason, timestamp                                                                                                                   |
| `group_mutations`          | Group, actor, idempotency key, payload hash, result reference; unique actor/key per group                                                                                                                               |

Membership identities outlive user accounts and reference financial records;
shared financial rows must not reference users with cascading deletion.
Create the group/initial owner membership/owner reference in one transaction.
Use a deferred owner FK or insert an initially nullable owner reference and fill
it before commit, with application invariants preventing an ownerless group.

Use composite keys/FKs where practical to enforce same-group references at the
DB layer as well as in repositories. Index memberships by user, entries by
group/date and category/date, and repayments by group/date and sender/recipient/date.
Archive categories rather than deleting them; permit old references on edits
but do not offer archived categories for new records. Void financial records
instead of deleting their allocation/audit history. Store dates as date-only
values; budget windows must not shift with a member's timezone.

## Server and client implementation

- Domains: `src/lib/groups/{repository,dto,validation}.ts`, plus focused
  membership, invitation, ledger, budget, repayment, and activity modules as
  needed. Keep files below roughly 500 lines and pure logic in colocated tested
  helpers (allocation, balances, refund capacities, permission policy).
- Thin routes under `/api/groups` and `/api/groups/[groupId]/...` for membership,
  invites, entries/refunds, budget months, repayments/reversals, summary,
  activity, and exports. Personal endpoints continue their existing behavior.
- A shared authorized group-context resolver passes actor and membership to
  repositories. Never accept author identity from the client.
- Financial/member mutations lock the group row, recheck membership/archive
  state and entity versions, write records/shares/activity/idempotency result,
  then advance financial revision in one DB transaction. Invite consumption and
  removal follow the same lock ordering to prevent race-based re-entry.
- Require mutation IDs for retried creates and reversals. Same key/payload
  returns the original result; reuse with different payload is rejected.
- Check optimistic entity versions for edits; return a conflict with a reload
  path instead of overwriting another member's change.
- Group-scoped summary and paginated ledger endpoints avoid downloading the
  entire household history. Compute balances over all relevant history, not
  just the current month, visible page, or a filtered transaction subset.
- Add a focused group slice to the existing Zustand store, with discriminated
  personal/group context. Do not overwrite `user`, personal transactions,
  summary, or personal budget pool to make group components work.
- Abort superseded requests and guard responses by user + group + request
  generation. Switching context, logout, removal, or archive must not let a
  slow previous response repaint the wrong ledger or leave writes enabled.
- Refresh on focus and successful mutations; poll visible group summary/revision
  approximately every 20–30 seconds while signed in, pausing while hidden.
  Do not replace active drafts; conflicts require explicit review. No sockets
  or authenticated offline financial caches in v1.
- Use shared selectors/formatters and extract reusable budget/report derivations
  instead of copying personal screens or the compressed homebudget source.
- Exports check current membership and include payer, author, allocations, and
  repayment status and recorded-by identity with spreadsheet-formula escaping.
  Distinguish original payments from reversals so exports cannot double count
  corrections. Never export invitation secrets.

## Delivery slices and acceptance gates

1. **Foundation and authorization:** generated additive schema, memberships,
   owner lifecycle, scoped repositories, invitation creation/preview/join/revoke,
   account-deletion integration. Tests prove cross-user/group isolation,
   one-time joins, removed-member behavior, and preservation of shared history.
2. **Context and shared ledger:** routes, switcher/picker, group state slice,
   group categories, expense/income forms and ledger, payer/participant choices,
   equal/custom allocation, conflict handling and activity. Test stale-response
   guards, retries, Penny allocation, shared funds, and context-safe submission.
3. **Household budget:** per-month total/category plans, copy previous month,
   overview and category breakdowns. Test month isolation, archive behavior,
   spending vs income, and whole-expense budget accounting.
4. **Split & settle:** all-time member balances, transfer suggestions, immediate
   partial repayments by either counterparty, correction/reversal flow, former-member
   balances, and linked refunds. Test conservation and concurrency end to end.
5. **Release completion:** exports, accessibility and translations, empty/error
   states, member-management UX, browser QA, docs and ER diagram updates. Verify
   both themes in light/dark on mobile/desktop, browser history, group switching,
   account switching, removed access, and two members editing concurrently.

Slices may be reviewed independently; the feature is not ready for broad release
until budgeting AND split/repayment flows pass their gates. An internal feature
flag can keep unfinished group navigation hidden during staged implementation.
Disabling that flag must hide entry points without deleting data or replacing
server-side authorization checks.

## Verification and migration discipline

- Use Vitest for pure allocation/balance/refund logic and permission/validation
  rules; cover 1-cent amounts, three-way splits, zero-share participants,
  membership changes, refunds after payment, multiple partial refunds, and
  overpayments/reversals. Test recording by sender and recipient, rejection of
  unrelated-member writes, retry idempotency, concurrent independent duplicate
  entry, and double reversal prevention. Confirm each ledger event conserves
  member balances.
- Route/repository integration tests must use a dedicated test DB/transaction
  harness, never the shared development/production DB. Exercise concurrent joins,
  duplicate mutations, stale edits, remove-vs-write, and refund-vs-edit races.
- Regression checks prove group operations leave personal rows, summaries,
  budgets, imports, API tokens, and connected apps untouched.
- Before a push: lint, tests, and production build, plus browser flows using two
  test members. A unit mock alone cannot prove locking or DB constraints.
- Follow `docs/database-migrations.md`: edit schema, run `npm run db:generate`,
  inspect generated SQL/snapshot, then `npm run db:migrate` against the intended
  environment. Never hand-write migrations or run `drizzle-kit push`. If the
  required database connection is unavailable, have the user run generation.
- No backfill of personal rows into groups. Existing accounts start with no
  groups. Roll out additively; preserve existing data during rollback.
- Update `docs/er-diagram.md` when the schema actually changes; add standing
  `docs/groups.md` as slices ship, plus design/state/navigation, account deletion,
  privacy, and export documentation. Keep this plan's progress separate from
  descriptions of shipped functionality.

## Recorded implementation choices

Confirmed scope is separate personal/group finances with budgets, splitting,
and immediate repayment recording by either counterparty.
The implementation uses the following defaults from this plan:

1. Owner/member roles, owner correction rights, and all-history access on join.
2. Shared-funds expenses and settlement-off contributions in the first release.
3. Audited owner overrides for repayments and counterparty correction/reversal
   rights. Immediate recording by either counterparty is already confirmed.
4. Seven-day single-use invitations, explicit reactivation after removal.
5. Calendar-month CAD-only budgets; goals/recurring/imports deferred.
6. Archive-and-export lifecycle instead of automatic deletion after 72 hours.

### Verification and implementation notes

- Regular suite: 365 tests passed; database integration cases are skipped there.
- Isolated PostgreSQL suite: 15 tests passed, including different members on
  independent connections, idempotent creation, invite races and account deletion.
- Production build, lint, ES compatibility, and catalog checks passed.
- Actual browser/API flows with two disposable accounts passed: create, invite,
  join, expense, monthly budget, repayment recorded by receiver and by sender,
  export, separate personal records, mobile/desktop, and both visual themes.
- Generated migrations 0019–0021 were applied to the configured development DB.
  No personal rows were backfilled, and tests ran in separate disposable DBs.
- Financial corrections preserve payment rows with reversal metadata and audit
  events rather than creating separate negative-payment rows. Expenses with
  linked refunds require reversing those refunds before financial edits.
- The server currently aggregates the complete group ledger; client transaction
  pages contain 50 rows and local search/member filters apply to that page.
  These explicit limits are documented in `docs/groups.md`.
- Existing store construction/provider/reconciliation were split into focused
  files to keep the store creator below 500 lines.

## Reference points

- Reference: `../homebudget/lib/ledger.ts` (allocation, balances, author/payer,
  refund handling, member removal), `app/api/ledger/route.ts` (join/auth/version
  checks), `app/ledger-app.tsx` (switcher, payer selection, group screens), and
  `tests/ledger.test.mjs` (accounting examples).
- Sprout: `src/db/schema.ts`, `src/lib/auth/account.ts`,
  `src/components/useRouteSync.ts`, `src/state/store.tsx`,
  `src/i18n/useFormatters.ts`, `src/components/ui/EntitySymbol.tsx`,
  `docs/state-management.md`, `docs/design-system.md`, and `docs/appearance.md`.

### Follow-up: group import/export

The initial CSV/receipt deferral is superseded by the implementation documented
in [group-import-export.md](../docs/group-import-export.md). It reuses the personal
workspace with group-only persistence, selected payer and saved split snapshots.
