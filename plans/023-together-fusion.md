# Together / Sprout fusion

User-approved direction, discussed 2026-10-26–27. This is planned behavior, not
a claim that all capabilities already exist. Keep existing data and UI style;
UI redesign and detailed budget enhancements are deferred. Do not deploy/push.

## Implemented local increment

- All active members may edit any shared record, with confirmation and a
  three-day highlight; original authorship and audit history remain intact.
- Daily overview/list omit debt and allocation amounts.
- Owner exit promotes the earliest remaining membership; final exit archives.
- Integration coverage for cross-author edits, void restrictions and exit.

## Remaining required implementation

- Separate original records from explicit date-filtered multi-select splitting.
  Income/expense supported; overwrite selected calculations, preserve other
  results/history, show a small calculated badge. Recalculation preserves real
  repayments. Cancel splitting independently. Mark financial edits stale.
- Real repayments support partial/overpayment, with author/recipient/owner
  reversal confirmation and audit. No actual bank transfers.
- Restore voided records; author/owner only. Shared originals editable by all.
- Refunds optionally link an original: linked refunds inherit category/currency
  and split, enforce cumulative cap, use receipt date; standalone reimbursements
  reduce category spend and are not income. Preserve repayments after refunds.
- One-level subcategories; bank import normally chooses parent. Unique child
  exact-name matches ignore case and surrounding whitespace; ambiguous matches
  stay at parent. Manual corrections and explicit reusable merchant rules.
- Retain Sprout budget as baseline, parent/child allocations without double
  counting; independent monthly/annual plans, annual fixed costs and optional
  monthly provisioning/savings goals to be designed later.
- Group invitation policy owner-only/all-members; one-use seven-day revocable
  tokens, configurable member limit, owner removal. Exit preserves shared data;
  user can remove only their own history/cache. Last exit closes invitations.
- Retain CSV mapping/dedupe/AI optional classification plus Together local OCR.
  Suspected cross-source duplicates require review. Transfer/card payment import
  setting: ask/record/skip; retained transfers excluded from daily totals.
  Group import attribution follows actual payer/recipient/participants, never
  importer; no automatic splitting. Auditable batch undo checks dependencies.
- Full offline IndexedDB writes, sync queue, idempotency, visible offline/pending
  state, local export, explicit conflict review, revoked-access handling; no
  silent loss on logout/cache removal. App-open reconnect retries.
- Cross-ledger search names/notes/amount only, source badges and ledger scope,
  member payer/recipient filter/avatar shortcut, chronological sorting. Offline
  scope disclosed; full-history online queries rather than current-page search.
- Preserve Sprout charts plus Together pie; weekly/monthly/year/custom ranges,
  daily group reports contain actual cash flows only. Local pending totals
  disclosed. CSV separates records/splits/repayments; PNG monthly/year reports
  have period confirmation and optional member/split information.
- Preserve recurring reconciliation, personal savings/goals, optional roundups,
  Together investment/emergency accounts, valuations and linked cash movements
  without double counting. No automatic money movement.
- English/Chinese/French UI; names/notes remain original, no external translation.
- Per-record explicit currency, ledger default, daily symbols and detail/export
  codes. Mixed currencies never sum/offset/convert. Budgets/goals/investments
  currency-scoped; linked refunds require same currency. Support minor-unit
  precision by currency while preserving integer money throughout.
- Sprout auth baseline plus email OTP; verified identity migration, never match
  display names. Current Cloudflare Together is primary migration source; compare
  old Sites changes first. Preserve legacy settled status without inventing
  repayment dates or amounts. Account deletion must match approved auto-transfer
  and archive rules, retaining anonymized shared history.

## Acceptance

Use local retained databases; never reseed/reset existing records. New schemas
require generated Drizzle migrations and ER documentation. Verify each increment
with relevant tests and browser checks; validate offline/currency/split workflows
end to end before describing this as a complete fused app.
