# CSV import

Sprout imports **any** bank/budget-tool CSV export, **repeatably** — re-running
the same or an overlapping export upserts instead of creating duplicates.
Internal money moves (transfers, card/loan payments) are kept out of budget
totals so safe-to-spend and savings math stay correct. Monarch ships as a
built-in preset; other sources are handled by mapping the CSV's columns to
Sprout fields.

Design intent and history: [`../plans/002-csv-import-pipeline.md`](../plans/002-csv-import-pipeline.md).
Schema: [`er-diagram.md`](er-diagram.md).

## Pipeline

Pure steps live in [`../src/lib/import/`](../src/lib/import/) with colocated
tests; `runImport()` orchestrates them and is shared by the script and the API.

```
read        read-csv.ts        CSV text -> rows: Record<string,string>[]
apply-map   apply-mapping.ts   rows + ImportMapping -> normalized rows
                                 amount -> signed cents (never float past here); parse date
classify    classify.ts        derive kind + exclude_from_budget from source category/amount
dedupe      dedupe.ts          compute external_id (sha256 of the source row + occurrence)
resolve     run.ts             source_category -> categoryId; upsert accounts by (user, name)
persist     persist.ts         batch upsert on (user_id, external_id)
```

Amount normalization and `external_id` hashing are the two spots that most need
unit tests — a silent bug there corrupts the whole import.

## Column mapping

An `ImportMapping` ([`types.ts`](../src/lib/import/types.ts)) declares how a
source's columns become normalized fields. Amount is normalized to **signed
cents** regardless of source shape, via one of three modes:

- `signed` — one column, sign convention explicit (`expensesArePositive`).
- `debitCredit` — separate debit and credit columns.
- `inflowOutflow` — separate inflow and outflow columns.

**Presets** live in [`presets/`](../src/lib/import/presets/) — a preset is just a
saved `ImportMapping` (+ a category map). Monarch is auto-detected when the CSV's
header set matches; otherwise the user maps columns manually. Saved user profiles
are a future addition.

## Dedupe & repeatability

Each imported row gets a deterministic `external_id` (sha256 of
`occurred_at | merchant | amount_cents | source_account` + an occurrence counter
so two genuinely identical same-day charges are both kept). A **partial unique
index** on `(user_id, external_id) WHERE external_id IS NOT NULL` makes re-imports
upsert; manual transactions (null `external_id`) are unconstrained.

Because `source_category` / `source_account` are stored, category and account
mapping can be re-run later as a pure update — no re-import.

## Budget correctness

`classify` sets `kind` (`expense | income | transfer | payment`) and
`exclude_from_budget`. Internal moves get `exclude_from_budget = true`, and the
budget/spent/savings math (`src/lib/transactions/repository.ts`) filters them out,
so transfers and card payments don't inflate spending.

## Category resolution (three layers)

A raw source category → a Sprout `categories.id`, cheapest layer first:

1. **Static map** ([`category-map.ts`](../src/lib/import/category-map.ts)) — a
   preset's `sourceCategory -> SproutCategoryKey` map (Monarch ships one).
2. **Cached merchant rules** ([`merchant-rules.ts`](../src/lib/import/merchant-rules.ts))
   — a `merchant_rules` row maps a **normalized merchant** (`normalizeMerchant`:
   uppercase, punctuation-split, digit-bearing store/ref tokens dropped) to a
   category, unique per `(user_id, pattern)`.
3. **AI fallback** ([`ai-categorize.ts`](../src/lib/import/ai-categorize.ts)) —
   merchants still uncategorized are sorted into the user's own category names by
   **Claude (`claude-haiku-4-5`, structured output)**, and each result is written
   back as a merchant rule so it's a **one-time cost per merchant**. Anything the
   model can't place stays uncategorized for a quick manual pass.

Whatever stays uncategorized is easy to find afterwards: the **Uncategorized**
filter chip on the Transactions view (and mobile Search) shows the count and lists
exactly those rows for a manual pass.

The AI fallback is **opt-in and best-effort**: if `ANTHROPIC_API_KEY` is unset or
the API call fails, those rows simply import uncategorized — the import never
blocks or errors on it. Enable it via the web toggle or the `--ai` script flag.

## Running an import

**Script** (one-off backfill, runs against the local `develop` Neon branch):

```bash
npm run db:import -- <path.csv> [--preset monarch | --map map.json] [--email <user>] [--ai]
```

- `--preset monarch` uses the Monarch mapping + category map (default when no
  `--map` is given).
- `--map map.json` supplies a custom `ImportMapping` as JSON.
- `--email` targets a specific user (defaults to the seed user).
- `--ai` enables the Claude categorization fallback.

**In-app:** the web **Import** screen (upload → auto-detect Monarch or map
columns → live preview → import) posts to `POST /api/import`. The route is
session-authed, validates the mapping, caps CSV size (~8MB), and accepts an
`aiCategorize` flag (a checkbox in the UI, default on).

The import summary reports `imported`, `excluded` (internal moves),
`uncategorized`, `accounts`, and `aiCategorized`.

## Environment

- `ANTHROPIC_API_KEY` — **optional**. Enables layer 3 (AI categorization). Without
  it, imports still work; unmatched merchants just import uncategorized. Set it in
  `.env.local` for the script and in the Vercel project for in-app import.
