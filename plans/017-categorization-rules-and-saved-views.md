# 017 — Categorization rules & saved views

**Status:** Done · **Created:** 2026-07-22 · **Completed:** 2026-08-14

Implementation is shipped in the current application. The rules manager and
session-authenticated CRUD endpoints are live on web and mobile; manual rules
are protected from AI/import overwrites. Transactions now support date,
amount, and multi-category filtering, and saved views persist the filter set
server-side. Follow-up polish may extend the shared store slice, but the
acceptance criteria for this plan are complete.

## Outcome

Two related upgrades that make categorization *stick* and turn the reworked
Transactions screen into a reusable workspace:

- **Part A — Manage your own categorization rules.** Let users view, create,
  edit, and delete merchant→category rules ("Uber → Transport"), so future
  transactions auto-file themselves, and optionally apply a rule to matching
  transactions right away.
- **Part B — Advanced filters & saved views.** Add date-range / amount-range /
  multi-category filters to Transactions, and let users **save a named filter
  combination** ("Dining, last quarter") and recall it in one click.

Rules act on data *as it arrives*; saved views change *how you slice* what's
already there. Together they reduce the uncategorized pile and make the
search + filter-pills + table layout a real tool.

## What already exists to build on

- **Rule storage + engine:** [`merchant_rules`](../src/db/schema.ts) already has
  `pattern` (a normalized merchant key), `categoryId`, and a `source` column
  that already distinguishes **`"ai" | "manual"`**, unique per `(user, pattern)`.
  [`merchant-rules.ts`](../src/lib/import/merchant-rules.ts) exposes
  `loadMerchantRules` / `saveMerchantRules` / `normalizeMerchant`, and rules are
  auto-applied on import ([`run.ts`](../src/lib/import/run.ts)) and in
  [`categorizeBacklog`](../src/lib/transactions/backlog.ts).
- **Reactive rule creation already works:**
  [`EditTransactionForm`](../src/components/shared/EditTransactionForm.tsx) has an
  `applyToMerchant` toggle that, on save, writes a rule and updates the other
  same-merchant transactions. So Part A is a **management surface + proactive
  creation**, not new plumbing.
- **Filtering:** [`filterTransactions`](../src/lib/search.ts) supports
  query / type / single-category / month. The Transactions toolbar (search bar +
  type pills + table) and `bulkCategorize` are in place.

## Part A — Categorization rules

### Product decisions

- **Match semantics unchanged:** a rule matches on the **normalized merchant**
  (`normalizeMerchant`) — no regex or wildcards in v1. A rule is "merchant
  normalizes to X → category". This keeps the manage UI consistent with how AI
  and import rules already behave.
- **Manual is authoritative:** `source: "manual"` rules are user-owned and are
  never overwritten by the AI pass; the AI fallback only fills *unruled*
  merchants. (Confirm/adjust the AI write path so it doesn't clobber a manual
  rule.)
- **Readable labels:** add a nullable **`label`** column to `merchant_rules`
  (the merchant text as the user typed / last saw it) so the manage list reads
  "Uber", not the normalized "UBER". AI/import rules backfill `label` from a
  representative transaction; migration required.
- **Retro-apply:** creating or editing a rule offers "apply to N matching
  transactions now" — reuse the same same-merchant bulk update the edit form
  already performs (`bulkCategorize` by matched ids). Opt-in, with the count
  shown first.
- **Delete = remove the rule** (existing transactions keep their category).
- **Where:** a **Rules** panel in Settings (web + mobile), alongside the new
  Security panel — list, edit category inline, delete, and an "Add rule" form
  (type a merchant, pick a category).

### Architecture

- **`src/lib/rules/`** (or extend `merchant-rules.ts`): `listRules(userId)`,
  `upsertRule({ userId, merchant, categoryId })` (normalizes → pattern, stores
  `label`, `source: "manual"`), `deleteRule(userId, id)`, and
  `applyRuleToExisting(userId, pattern, categoryId)` (bulk update matching
  uncategorized/known rows). Pure `normalizeMerchant` stays the match key.
- **`/api/rules`** route(s): `GET` (list), `POST` (create + optional apply),
  `PATCH /:id` (recategorize), `DELETE /:id`. Session-authed, thin over the repo.
- **Store + UI:** a `rules` slice (list/create/update/delete/apply) and a shared
  `RulesPanel` used by web Settings and a mobile `RulesScreen`.

### Slices

- **A1 — data + API:** `label` column (migration), rules repository + CRUD/apply
  endpoints, ensure the AI pass respects manual rules; unit + route tests.
- **A2 — manage UI:** `RulesPanel` (web) + `RulesScreen` (mobile), add/edit/
  delete, retro-apply with a count, i18n (en-CA + fr-CA).

## Part B — Advanced filters & saved views

### Product decisions

- **New filter dimensions** on `filterTransactions` (pure, unit-tested):
  `dateFrom` / `dateTo` (ISO; an explicit range overrides the month stepper),
  `amountMin` / `amountMax` (cents), and `categoryIds` (multi-select superseding
  the single category). Existing behavior is the default when these are unset.
- **Filters popover** in the Transactions toolbar (and mobile Search): the type
  pills stay; a "Filters" button opens date/amount/category controls. Active
  non-default filters show a count badge.
- **Saved views = a serialized filter set** (`{ type, categoryIds, query,
  dateFrom, dateTo, amountMin, amountMax, sort }`). **Server-persisted** from the
  start (multi-device, like everything else): a `saved_views` table
  (`user_id` cascade, `name`, `filters` jsonb, `createdAt`). Recall sets the
  store filters; rename/delete inline. (Considered localStorage-only for v1 but
  chose sync to match the product.)

### Architecture

- Extend `FilterOptions` + `filterTransactions`; the store's transaction-filter
  fields grow with the new dimensions (keep them in one place so web + mobile
  share).
- **`src/lib/views/`** + **`/api/views`** (`GET`/`POST`/`PATCH`/`DELETE`), thin
  over a repo; a `views` store slice.
- **UI:** a "Saved" control in the toolbar — save the current filters as a named
  view, and a list to recall/rename/delete. A `SavedViews` + `FiltersPopover`
  component, shared where practical.

### Slices

- **B1 — advanced filters:** extend `filterTransactions` + store fields + the
  Filters popover (web + mobile). Pure-logic tests for every new dimension. **No
  migration.**
- **B2 — saved views:** `saved_views` table (migration), CRUD endpoints, the
  Saved control (save/recall/rename/delete), i18n.

## Build order

A1 → A2 (rules; one small migration) delivers the higher-leverage win first,
then B1 (no migration) → B2 (saved views; migration). A and B are independent;
either half can ship alone.

## Test matrix

- **Rules:** create normalizes the merchant to the expected pattern; unique
  `(user, pattern)` upsert (re-adding updates, not duplicates); manual rule
  survives an AI pass; retro-apply updates exactly the matching rows and no
  others; delete leaves existing transactions untouched.
- **Filters:** each new dimension in isolation and combined — date range
  (inclusive bounds), amount range (cents, negative expenses), multi-category,
  and interaction with the month stepper (range overrides month). Empty/unset =
  today's behavior.
- **Saved views:** save captures the exact active filter set; recall reproduces
  it; rename/delete; per-user isolation; unknown/legacy filter keys are ignored
  gracefully.

## Acceptance criteria

- Users can see, add, edit, and delete their own categorization rules from
  Settings, and optionally apply one to existing matching transactions.
- Manual rules are never overwritten by AI categorization.
- Transactions can be filtered by date range, amount range, and multiple
  categories; the controls are shared by web and mobile.
- A named saved view captures the current filters and recalls them in one click,
  synced across devices.
- New endpoints are session-authed and thin over unit-tested helpers; catalogs
  stay in sync; no regressions to import/backlog rule application.

## Out of scope

- Regex / wildcard / amount- or account-based rules (merchant-normalized only).
- Rule priority/ordering or conflicting-rule resolution beyond "one rule per
  normalized merchant".
- Shared/team saved views, scheduled exports of a view, or view-based alerts.
- Reworking the AI categorization model itself (only the "don't clobber manual"
  guard).

## Expected files

```text
src/db/schema.ts (+ migration)            merchant_rules.label; saved_views table
src/lib/rules/repository.ts (+ test)      list/upsert/delete/applyToExisting
src/app/api/rules/route.ts (+ test)       list/create
src/app/api/rules/[id]/route.ts           patch/delete
src/lib/search.ts (+ test)                extended FilterOptions/filterTransactions
src/lib/views/repository.ts (+ test)      saved-view CRUD
src/app/api/views/route.ts (+ test)       list/create
src/app/api/views/[id]/route.ts           patch/delete
src/components/settings/RulesPanel.tsx    manage rules (web)
src/components/mobile/screens/RulesScreen.tsx
src/components/…/FiltersPopover.tsx       advanced filter controls (shared)
src/components/…/SavedViews.tsx           save/recall/rename/delete
src/components/web/views/Transactions.tsx toolbar: Filters + Saved controls
src/components/mobile/screens/…           mobile Search parity
src/state/store.tsx                       rules + views slices, extended filters
src/messages/en-CA.json, src/messages/fr-CA.json
docs/transactions.md (or extend an existing doc)
```

`db:generate` + `db:migrate` are needed for A1 (`label`) and B2 (`saved_views`);
B1 and the UI slices touch no schema. Never hand-write migrations — follow
[`docs/database-migrations.md`](../docs/database-migrations.md).

## Open questions

1. **Saved views: server vs. local?** Recommendation server-persisted (chosen
   above) for cross-device sync; localStorage is the cheaper fallback if we want
   B2 without a migration.
2. **Rule from a row:** the edit form already creates rules; do we also want a
   one-click "always categorize this merchant" action on a transaction row, or
   is the edit-form path enough for v1?
3. **Label backfill:** derive `merchant_rules.label` for existing AI/import rules
   lazily (on first list) or in the migration's data step?
