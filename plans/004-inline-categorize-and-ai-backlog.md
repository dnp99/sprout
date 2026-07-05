# 004 — Inline categorize + re-run AI on the backlog

**Status:** 📝 Planned · **Created:** 2026-07-05

## Goal

After a large import (a real 1,700-row Monarch export landed), many transactions
are **uncategorized** — the static map + cached merchant rules didn't cover them,
and either AI was off or the merchant was novel. Two complementary ways to clear
that backlog:

1. **Inline categorize** — from the Transactions table (and the mobile txn
   detail), click a row's category and assign one, without leaving the page.
   Optionally cache the choice as a **merchant rule** so the same merchant
   auto-resolves on the next import _and_ the AI backlog run.
2. **Re-run AI on the backlog** — a one-click action that runs the existing
   Haiku fallback over the transactions that are _already imported_ and still
   uncategorized (no re-import), caching each result as a merchant rule.

Together: the AI pass clears most of the backlog in bulk; inline categorize is
the precise manual cleanup for the rest and for corrections.

## Context (what already exists)

- **Uncategorized view** — the `uncategorized` `TxnFilter` chip (web Transactions
  + mobile Search) already lists expenses with `categoryId === null` and shows a
  live count. This plan makes those rows _actionable_.
- **AI categorization** — [`docs/csv-import.md`](../docs/csv-import.md);
  `categorizeMerchants` (`claude-haiku-4-5`, structured output),
  `normalizeMerchant`, `loadMerchantRules` / `saveMerchantRules`, and the
  `merchant_rules` table all exist from plan 002 slice 6. The AI + caching logic
  currently lives inside `runImport`'s private `applyAiCategorization`.
- **Store** — the web app loads the full working set (up to 5000 rows) into
  `transactions`; `categories` is already in the store for a picker.

No new tables. `merchant_rules.source` already distinguishes `ai` vs `manual`.

## Slice 0 — shared refactor (prereq)

Extract the reusable core out of `runImport` so import and the backlog share one
implementation (hygiene rule — don't copy the AI+cache logic):

- New `src/lib/import/categorize.ts` (or extend `merchant-rules.ts`):
  `resolveMerchantCategories(userId, rows, categoryNames, { ai })` where `rows`
  is `{ id?, merchant }[]`. It applies cached rules, then (if `ai`) the Haiku
  fallback, caches new rules, and returns a `Map<pattern, categoryId>` plus a
  count. `runImport` calls it; the backlog route calls it.
- Keep it pure of HTTP; best-effort AI (missing key / error → no-op) as today.

## Slice 1 — Inline categorize

**Repository + API**

- `updateTransactionCategory(userId, txnId, categoryId | null)` in
  `src/lib/transactions/repository.ts` — scoped to the user (never cross-user).
- `PATCH /api/transactions/[id]` — session-authed; validates `categoryId`
  belongs to the user (or `null`); returns the updated transaction DTO.
- Optional body flag `applyToMerchant: true` → also upsert a `merchant_rules`
  row (`source: "manual"`) for the row's `normalizeMerchant(merchant)`, and
  bulk-update the user's other **uncategorized** rows with the same pattern.
  Returns how many rows changed.

**UI (web Transactions)**

- Make the Category cell a small picker (button → popover/`<select>`) listing the
  user's categories + "Uncategorized". On choose: `PATCH`, then update the row in
  the store (`categoryId` + `categoryName` + `emoji`) and refresh `summary`
  (category breakdown / spent-by-category change; the amount itself doesn't move).
- When `applyToMerchant` returns N>1, toast "Categorized N ‘MERCHANT’ transactions".

**UI (mobile)** — add the same picker to the transaction detail screen.

**Store** — a `setTransactionCategory(id, categoryId)` action that PATCHes and
patches local state; re-derive the uncategorized count from `transactions`.

## Slice 2 — Re-run AI on the backlog

**API**

- `POST /api/transactions/categorize-backlog` — session-authed:
  1. Load the user's uncategorized expense transactions (`categoryId IS NULL AND
     NOT exclude_from_budget`), capped (e.g. first N; report if truncated).
  2. `resolveMerchantCategories(userId, rows, categoryNames, { ai: true })`
     (slice 0) — cached rules first, then Haiku for the rest, caching results.
  3. Bulk-update each row's `categoryId` by its merchant pattern.
  4. Return `{ categorized, stillUncategorized, aiCalls }`.
- Guard on `ANTHROPIC_API_KEY` (503 + a message the UI shows), best-effort.

**UI**

- A button where the backlog is visible — the Transactions **Uncategorized**
  chip area and/or the Import result card: "✨ Categorize N uncategorized with
  AI". Spinner while running; on success `refresh()` and show the summary.
- Disable when the count is 0 or the key is unconfigured.

## Non-goals (deferred)

- Bulk multi-select manual categorization (checkbox rows). Inline + AI backlog
  cover the need first.
- Learning/ött re-training beyond the exact-merchant-pattern rule cache.
- Re-categorizing rows that already have a category (this targets the backlog);
  inline categorize handles corrections one at a time.

## Verification

- Unit-test `resolveMerchantCategories` (cached-first, AI-gap, no-key no-op) and
  the repository update (user scoping). Extend the API smoke checks: 401 without
  session, 200 categorizes, idempotent on a second run (nothing left to do).
- Manual: on the real 1,700-row set, run the AI backlog → uncategorized count
  drops; spot-check a few; inline-fix a remainder and confirm the count + Trends
  breakdown update live.

## Slices (small, logical commits)

1. **0 — refactor** `resolveMerchantCategories`; `runImport` uses it (no behavior
   change; tests green).
2. **1 — inline categorize**: repository + `PATCH` route + web picker + store
   action (+ optional apply-to-merchant), then mobile detail picker.
3. **2 — AI backlog**: `categorize-backlog` route + button + wiring.

Branch off fresh `main` (branch rule). No push until approved; `lint` + `test` +
`build` green first (verification rule). Update
[`docs/csv-import.md`](../docs/csv-import.md) (category resolution now has a
manual + backlog path) when the work lands.

## Open questions

- **Apply-to-merchant default** — opt-in checkbox vs. on by default? Lean opt-in
  (a per-row choice shouldn't silently rewrite history), but make it one click.
- **Backlog cap** — categorize all uncategorized in one call, or page it? Start
  with a generous cap and report truncation; the per-merchant cache means a
  second run finishes the tail cheaply.
- **Manual vs AI precedence** — a `manual` rule should win over an `ai` rule for
  the same pattern. `saveMerchantRules` upserts on `(user_id, pattern)`; ensure a
  manual write isn't overwritten by a later AI run (e.g. don't AI-touch patterns
  that already have a manual rule).
