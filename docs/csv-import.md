# CSV import

Sprout imports **any** bank/budget-tool CSV (or TSV) export, **repeatably** —
re-running the same or an overlapping export upserts instead of creating
duplicates. Internal money moves (transfers, card/loan payments) are kept out of
budget totals so safe-to-spend and savings math stay correct.

**Built-in source presets** (auto-detected from headers): **Monarch**, **YNAB**,
**Goodbudget**, and **legacy Mint** exports. Any other source is handled by
mapping the file's columns to Sprout fields manually. Presets are transaction-
history only — Sprout does not import source budgets, targets, or envelope
balances.

Design intent and history:
[`../plans/completed/002-csv-import-pipeline.md`](../plans/completed/002-csv-import-pipeline.md)
and [`../plans/014-import-presets-acquisition-wedge.md`](../plans/014-import-presets-acquisition-wedge.md).
Schema: [`er-diagram.md`](er-diagram.md).

## Pipeline

Pure steps live in [`../src/lib/import/`](../src/lib/import/) with colocated
tests; `runImport()` orchestrates them and is shared by the script and the API.

```
read        read-csv.ts        text -> rows; detects comma/tab, strips a BOM
detect      presets/index.ts   score headers -> a preset id or Custom (detectPreset)
preflight   preflight.ts       validate rows -> totals + row-level errors (before any write)
apply-map   apply-mapping.ts   rows + ImportMapping -> normalized rows
                                 amount -> signed cents (never float past here); parse date
classify    classify.ts        derive kind + exclude_from_budget from source category/amount
dedupe      dedupe.ts          compute external_id (sha256 of the source row + occurrence)
resolve     run.ts             source_category -> categoryId; upsert accounts by (user, name)
persist     persist.ts         batch upsert on (user_id, external_id)
```

Amount normalization and `external_id` hashing are the two spots that most need
unit tests — a silent bug there corrupts the whole import.

**Strict parsing.** Money notation is declared per preset (`decimal: "period" |
"comma"`) so a decimal comma can't be misread; `parseMoney` rejects genuinely
ambiguous separators for undeclared/custom input. Dates validate the real
calendar and reject ambiguous slash dates (e.g. `01/02/2026`) unless the preset
gives a format — no reliance on the environment's `Date` parser.

## Column mapping

An `ImportMapping` ([`types.ts`](../src/lib/import/types.ts)) declares how a
source's columns become normalized fields. Amount is normalized to **signed
cents** regardless of source shape, via one of four modes:

- `signed` — one column, sign convention explicit (`expensesArePositive`).
- `debitCredit` — separate debit and credit columns.
- `inflowOutflow` — separate inflow and outflow columns.
- `signedByType` — one positive-magnitude column + a type column whose values
  (`debitValues` / `creditValues`) set the sign (legacy Mint). Preset-only; the
  manual mapper exposes the first three.

The `amountToCents` switch is **exhaustive**, so a new mode can't silently fall
through to an unrelated branch.

## Source presets & detection

**Presets** live in [`presets/`](../src/lib/import/presets/). A preset is an
`ImportMapping` + a category map + `detection` metadata, registered in
[`presets/index.ts`](../src/lib/import/presets/index.ts) — the **one source of
truth** the API, CLI, and both import views resolve through (`getPreset`,
`PRESET_OPTIONS`). `PresetId` is a literal union, so unknown ids fail at compile
time; the server also re-verifies uploaded headers against the chosen preset
(`verifyPresetHeaders`).

`detectPreset(headers, filename)` scores each preset: **required** headers gate
eligibility, **distinctive** headers (disjoint from required) score confidence,
and a filename hint only breaks an exact tie. A unique top scorer with ≥1
distinctive match and a margin ≥1 → `high`; a tie or zero-distinctive top →
`ambiguous` → **Custom** (never a guessed mapping).

| Source | File | Amount mode | Dates | Category col |
| --- | --- | --- | --- | --- |
| Monarch | CSV | `signed` | ISO | Category |
| Sprout template | CSV | `signed` | YYYY-MM-DD | Category |
| YNAB | CSV or **TSV** | `inflowOutflow` | MM/DD/YYYY* | Category |
| Goodbudget | CSV | `signed` | MM/DD/YYYY | Envelope |
| Mint (legacy) | CSV | `signedByType` | MM/DD/YYYY | Category |

Fixtures + expected-results manifests live in
[`__fixtures__/`](../src/lib/import/__fixtures__/) and drive
[`presets/registry.test.ts`](../src/lib/import/presets/registry.test.ts). They are
**synthetic**, modeled on documented export formats. *YNAB's date format and
split-transaction rows are locale/plan dependent; a real export in the target
locale (and Goodbudget envelope-transfer rows) should be verified before a source
is treated as fully production-grade.* Saved user mapping profiles remain a future
addition.

## Fill-in Sprout template

The Import screen offers a downloadable `sprout-import-template.csv`. It is a
first-class, auto-detected preset — no manual mapping after upload. Its columns
are `Date, Description, Amount, Source, Category`:

- **Date:** `YYYY-MM-DD`
- **Description:** merchant/payee text
- **Amount:** signed dollars (positive = income, negative = expense)
- **Source:** optional account name, such as `Chequing`
- **Category:** optional source category; unmatched labels remain available for
  review instead of being guessed

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

Detection uses the source category when present; when an export carries **no
category** (some bank CSVs don't), `isCardOrBillPayment(merchant)` catches card
and issuer bill payments (Amex, Mastercard payment, "Bill Payment", …) by
merchant name. It's kept deliberately tight — e.g. "Mobile Bill Payment" (a real
phone bill) is *not* matched. Users can always override per-transaction with the
**Exclude from budget** toggle on the edit form.

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
npm run db:import -- <path.csv> [--preset monarch|ynab|goodbudget|mint | --map map.json] [--email <user>] [--ai]
```

- `--preset <id>` uses that preset's mapping + category map (defaults to
  `monarch` when neither `--preset` nor `--map` is given). Unknown ids error.
- `--map map.json` supplies a custom `ImportMapping` as JSON.
- `--email` targets a specific user (defaults to the seed user).
- `--ai` enables the Claude categorization fallback.

**In-app:** the web **Import** screen (sidebar) and the mobile **Import** screen
(Settings → Import) share one hook (`components/shared/useImport.ts`): upload →
auto-detect Monarch or map columns → live preview → import, posting to
`POST /api/import`. The route is session-authed, validates the mapping, caps CSV
size (~8MB), and accepts an `aiCategorize` flag (a checkbox in the UI, default on).

The import summary reports `imported`, `excluded` (internal moves),
`uncategorized`, `accounts`, and `aiCategorized`.

## Reclassifying an existing backlog

For rows already imported (e.g. an early import that predates a classifier
improvement, or a CSV that arrived with no category/type data), re-run the
classification passes in place — no re-import:

```bash
npm run db:reclassify -- [--email <user>] [--exclude] [--ai]
```

- `--exclude` (default when no pass is named) — `excludeCardBillPayments`: flag
  existing card/bill payments as `exclude_from_budget`. Idempotent.
- `--ai` — `categorizeBacklog`: run layers 2–3 (cached rules, then Haiku) over
  the still-uncategorized expenses and write the resolved category onto every
  matching row, caching each merchant as a rule.

Both live in [`src/lib/transactions/backlog.ts`](../src/lib/transactions/backlog.ts)
and reuse the same primitives as `runImport`, so a future in-app "categorize my
backlog" action can call them directly.

## Export

`GET /api/export?range=month|quarter|year|all` streams the signed-in user's
transactions as CSV (`Date, Merchant, Category, Amount`; amounts in signed
dollars, so they round-trip back through the importer). Pure helpers live in
[`../src/lib/export.ts`](../src/lib/export.ts). The **Export** tab (shared
`ExportPanel`) sits next to Import under the same **Import & export** screen on
web (sidebar) and mobile (Settings → Import / export): pick a date range → see
the row count → download.

## Environment

- `ANTHROPIC_API_KEY` — **optional**. Enables layer 3 (AI categorization). Without
  it, imports still work; unmatched merchants just import uncategorized. Set it in
  `.env.local` for the script and in the Vercel project for in-app import.
