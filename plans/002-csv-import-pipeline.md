# 002 — Generic CSV import pipeline

**Status:** 🏗️ Slices 1–5 done (import usable in-app) · slice 6 (AI) remains ·
**Created:** 2026-07-05 · **Updated:** 2026-07-05

## Progress

- ✅ **1. Schema** — `accounts` + transaction import columns + partial unique
  index (`0002` migration). ✅ **2. Import lib** — read-csv, amount/date parse,
  classify, dedupe, `buildImportRows` (26 tests) + Monarch preset. ✅ **3. Script**
  — `npm run db:import -- <csv> [--map] [--email]`: account upsert, category
  resolution, idempotent upsert on `external_id`. ✅ **4. Budget wiring** —
  summary/spent exclude `exclude_from_budget` rows. ✅ **5. API + UI** —
  `runImport()` shared by script + `POST /api/import`; web **Import** screen
  (upload, Monarch preset auto-detect or custom column mapping across all 3 amount
  modes, live preview, summary). Saved profiles still TODO.
- ⏳ **6. AI categorization** remains (needs an Anthropic API key + a
  `merchant_rules` cache table).

Verified end to end: re-running a Monarch export upserts (no duplicates);
transfers/card payments classified + kept out of budget; accounts created.

---

## Goal

Let a user import **any** bank/budget-tool CSV export into Sprout **repeatably** —
re-running the same or an overlapping export must not create duplicates — with
internal money moves (transfers, card/loan payments) kept **out of budget
totals** so safe-to-spend and savings math stays correct.

The importer is **format-agnostic**: the user maps their CSV's columns to Sprout
fields. **Monarch is shipped as a built-in preset**, not the whole feature. This
turns Sprout from a seed-only demo into something that can hold real financial
history and be refreshed each month from a fresh export.

## Why generic (and what a real export taught us)

A dry run against a real 18-month **Monarch** export (1,702 transactions across a
chequing account, a Mastercard, an Amex, and a mortgage) surfaced problems that
are true of **most** bank CSVs, not just Monarch's:

1. **Overlapping re-exports duplicate rows.** Exports are usually cumulative;
   pulling one monthly re-includes prior transactions. Without a natural key,
   import is a one-shot, not a repeatable sync.
2. **Internal moves distort the budget.** Transfers, credit-card payments, and
   reclassified "bill payment" rows inflated "spending" by thousands and dragged
   a true ~15% savings rate down to a misleading ~0.6%. The model has no way to
   say "this row is not consumption."
3. **Everything is multi-account.** Real transactions belong to accounts, and a
   Balances CSV (per-account balance over time) has nowhere to land.
4. **Source categories don't match Sprout's.** ~30 foreign categories need to be
   preserved and mapped — ideally re-mappable without re-importing.
5. **Column shapes vary by source.** Different exports name columns differently
   and represent amounts differently (one signed column vs. debit/credit vs.
   inflow/outflow). Hardcoding one layout doesn't scale — hence the mapping layer.

## Non-goals (deferred)

- **Goals and Bills tables.** Not needed by import; don't let them block it.
- **Live bank/API sync.** File (CSV) import only.
- **Multi-currency.** Assume a single `users.currency`; store cents as-is.

## Schema changes

All money stays **signed integer cents** (AGENT.md money rule). Follow the
migration runbook: edit `src/db/schema.ts`, then `npm run db:generate` +
`npm run db:migrate` (never hand-write migrations, never `drizzle-kit push`).
Update `docs/er-diagram.md` afterwards (docs rule).

### New table: `accounts`

```
accounts
  id (PK, uuid)
  user_id (FK -> users, ON DELETE CASCADE)
  name              text   -- "Chequing (...2607)", "World Elite Mastercard"
  type              text   -- "depository" | "credit" | "loan" | "investment"
  mask              text?  -- last 4 digits, nullable
  institution       text?
  current_balance_cents integer?
  sort_order        integer default 0
  created_at, updated_at
```

### Optional table: `account_balances` (for a Balances CSV)

```
account_balances
  id (PK, uuid)
  account_id (FK -> accounts, ON DELETE CASCADE)
  balance_cents     integer
  as_of             date
  unique (account_id, as_of)
```

Land only if we want balance-history/net-worth; transaction import doesn't depend
on it.

### `transactions` — additive columns

```
account_id      uuid?  FK -> accounts (ON DELETE SET NULL)
external_id     text?                                        -- dedupe key
kind            text default 'expense'                       -- 'expense'|'income'|'transfer'|'payment'
exclude_from_budget boolean default false                    -- internal moves = true
source_category text?                                        -- raw source category, preserved
source_account  text?                                        -- raw source account string
imported_at     timestamptz?                                 -- set on import, null for manual entry

unique (user_id, external_id)   -- partial: WHERE external_id IS NOT NULL
```

- **`external_id`** — deterministic per source row so re-imports upsert. Hash of
  `occurred_at (date) + merchant + amount_cents + source_account` (+ an
  occurrence counter, see open questions). Manual rows leave it `NULL`.
- **`kind` + `exclude_from_budget`** — budget/spent/savings math filters to
  `kind in ('expense','income') AND exclude_from_budget = false`. Fix for #2.
- **`source_category` / `source_account`** — keep raw strings so category mapping
  re-runs without re-importing.

## Column mapping (the generic core)

A CSV is read into rows of `Record<string, string>` (header → cell). A **mapping**
declares how those columns become normalized transaction fields:

```ts
interface ImportMapping {
  name: string;                       // "Monarch", "Chase", "Custom"
  date:     { column: string; format?: string };   // e.g. "YYYY-MM-DD" | "MM/DD/YYYY"
  merchant: { column: string };
  amount:
    | { mode: "signed";   column: string; expensesArePositive?: boolean }
    | { mode: "debitCredit";   debitColumn: string; creditColumn: string }
    | { mode: "inflowOutflow"; inflowColumn: string; outflowColumn: string };
  category?: { column: string };      // -> source_category
  account?:  { column: string } | { fixedName: string };  // -> source_account / account
  notes?:    { column: string };
}
```

- **Amount** is normalized to **signed cents** regardless of source shape; the
  three modes cover the vast majority of bank exports. Sign convention is
  explicit (`expensesArePositive`) so we never guess wrong.
- **Presets** live in `src/lib/import/presets/` (`monarch.ts` first). A preset is
  just a saved `ImportMapping`. Auto-detect a preset when the CSV's header set
  matches; otherwise the user maps columns manually.
- **Saved profiles** (later): persist a user's mapping so recurring imports from
  the same source are one click. Table or JSON on the user row — decide later.

## Category mapping

Raw source category -> Sprout `categories.id`, cheapest layer first:

1. **Static map** (`src/lib/import/category-map.ts`): `Record<string,
   sproutCategoryKey>` for known source categories; unmapped falls through to the
   next layer. Ships with a Monarch map; extendable per preset.
2. **Merchant rules**: a `merchant_rules` table (`user_id`, `pattern` ->
   `categoryId`) for per-merchant assignment when the source category is missing
   or wrong (e.g. `"UBER EATS" -> dining`, `"SHELL" -> transport`).
3. **AI fallback** (last slice): merchants still uncategorized after 1–2 are
   classified by **Claude** from the merchant name into the user's Sprout
   categories, and the result is **cached as a merchant rule** so it's a
   one-time cost per merchant. Anything still unresolved imports as `NULL`
   (uncategorized) for a quick manual pass.

Because `source_category` is stored, re-mapping is a pure update — no re-import.

## Import pipeline

Pure steps in `src/lib/import/*` with colocated tests; files < ~500 lines
(hygiene rule).

```
read       (src/lib/import/read-csv.ts)      CSV text -> rows: Record<string,string>[]
apply-map  (src/lib/import/apply-mapping.ts) rows + ImportMapping -> normalized rows
             normalize amount -> signed cents (never float past here); parse date.
classify   derive kind + exclude_from_budget from source category.
dedupe     compute external_id; upsert on (user_id, external_id).
resolve    map source_category -> categoryId; upsert account by (user_id, name).
persist    batch insert/upsert via the transactions repository.
```

Presets and mappings feed `apply-map`; everything downstream is source-agnostic.

Expose it two ways:

- **Script:** `npm run db:import -- <path.csv> [--preset monarch | --map file.json]`
  (mirrors `db:seed`), for the one-off backfill against the **develop** branch.
- **API route (later):** `POST /api/import` (multipart CSV + mapping) for
  in-product import, with a small mapping UI. Validate server-side via
  `src/lib/transactions/validation.ts` before persisting (money rule #4).

Amount normalization and `external_id` hashing are the two spots that most need
unit tests — a silent bug there corrupts the whole import.

## Build slices (small, logical commits)

1. **Schema + migration** — `accounts`, transaction columns, ER-diagram update.
2. **Import lib** — read-csv + apply-mapping (all 3 amount modes) + classify +
   dedupe, with tests. No DB writes.
   - **2a. Monarch preset** — `presets/monarch.ts` + category map.
3. **Import script** — `db:import` (preset/map flags), account upsert; backfill
   the real Monarch export into develop.
4. **Budget wiring** — exclude internal moves from spent/summary math
   (`getBudgetSummary` / `listCategories` filter `exclude_from_budget = false`).
5. **(Later) API + UI** — upload route, column-mapping screen, saved profiles.
6. **AI categorization (last)** — Claude fallback for merchants unmatched by the
   static map + merchant rules; **cache each result as a merchant rule** (one-time
   cost per merchant); batch + rate-limit; **never block import on it** (runs
   async / best-effort, falls back to uncategorized). Read the `claude-api`
   reference before building; keep the prompt + model choice there.

Branch off fresh `main` (branch rule). No push until approved; `lint` + `test` +
`build` green first (verification rule).

## Open questions

- **Transfer pairing:** one `exclude_from_budget` row vs. a linked pair across two
  accounts? One-row is enough for correct budget math; pairing is only for a true
  double-entry ledger. Lean one-row.
- **Preset auto-detect:** match on exact header set, or fuzzy? Start exact; fall
  back to manual mapping.
- **Saved mapping storage:** a `import_profiles` table vs. JSON on the user. Defer
  until the UI slice.
- **Balances import:** land `account_balances` now or split to a net-worth
  follow-up? Leaning follow-up.
- **Dedupe collisions:** two genuinely identical charges same day (e.g. two $27.74
  Uber Eats) hash the same. Add a per-key occurrence counter to the hash input so
  real source-duplicates are preserved.
- **Existing seed:** keep `db:seed` for demos or replace with imported data? Keep
  both — seed for a clean demo user, import for the real user.
