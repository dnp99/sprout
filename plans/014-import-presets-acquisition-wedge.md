# 014 — Import presets and migration acquisition wedge

**Status:** Planned · **Created:** 2026-07-18

## Outcome

Make Sprout a reliable destination for people moving transaction history from
**YNAB**, **Goodbudget**, **legacy Mint exports**, and **Monarch**. A supported
source should be detected, previewed, validated, and imported without the user
manually mapping columns. Unknown or ambiguous files must fall back to the
custom mapper rather than risk importing incorrect dates or amounts.

This is a **transaction-history import** feature. It does not promise to migrate
source budgets, targets, envelope balances, category groups, account balances,
or every source-specific object.

The acquisition message is broader than the original draft:

> Switching budgeting apps? Bring your transaction history to Sprout.

Mint remains useful as a legacy-import search term, but it is not the primary
2026 campaign. YNAB, Goodbudget, and Monarch are current migration paths; Mint
copy should say **old Mint export** rather than imply an active Mint product.

## Why the original draft is not ready to implement

Plan 002 built a good source-agnostic pipeline, but the remaining work is not
just three mappings and a landing section. The current implementation has
correctness and integration gaps that must be addressed first:

1. [`read-csv.ts`](../src/lib/import/read-csv.ts) only reads comma-delimited
   files. YNAB may export CSV or TSV depending on locale.
2. [`amount.ts`](../src/lib/import/amount.ts) assumes a period decimal separator;
   a decimal comma can silently change the value.
3. [`date.ts`](../src/lib/import/date.ts) defaults ambiguous slash dates to
   month-first unless a mapping provides a format.
4. Preset handling is duplicated and Monarch-only in the shared hook, API, CLI,
   and both import views. Adding files under `presets/` alone would not expose a
   working source end to end.
5. Current auto-detection uses the generic `Date`, `Merchant`, `Amount` subset.
   A bank CSV can accidentally look like Monarch. First-match subset detection
   will become less safe as the registry grows.
6. Source semantics extend beyond column names. Transfers, card payments,
   split transactions, starting balances, and envelope transfers can require
   source-specific classification or row normalization.
7. Invalid rows can be skipped with too little explanation. The preview must
   tell users what will import, what will not, and why before any write occurs.
8. Static category maps collapse source taxonomies into a small set of Sprout
   categories. AI is optional and best-effort, so it cannot be the correctness
   strategy for unmapped categories.

## Product decisions

These decisions resolve the open questions in the original draft.

- **Scope:** import transaction history only. Preserve `source_category` and
  `source_account`; do not create source budgets, category groups, or envelopes.
- **Category behavior:** map high-confidence source categories to existing
  Sprout categories. Show unmatched counts and route them to the existing
  uncategorized review flow. Never silently claim full category migration.
- **Detection:** score normalized headers using required and distinctive fields.
  If the best match is weak or tied, choose Custom. Filename hints are secondary.
- **Pre-signup preview:** defer until authenticated imports show measurable
  activation. If built later, parse locally in the browser and do not upload the
  file before signup.
- **Source order:** harden the parser and preserve Monarch first, then ship YNAB,
  Goodbudget, and legacy Mint independently. A source is not enabled until its
  fixture suite passes.
- **Marketing:** prove the in-app experience before building a dedicated landing
  campaign. Use source names as text unless trademark/logo use is verified.
- **AI:** optional categorization assistance only. Import success, source
  detection, amounts, dates, and transfer handling cannot depend on AI.

## Supported-format contract

Before implementation, collect sanitized or synthetic fixtures modeled on
current exports. Never commit a real user's financial history. Record the
following matrix beside the fixtures:

| Source | Supported file | Delimiter/encoding | Required semantic rows |
| --- | --- | --- | --- |
| Monarch | Transactions export | CSV, UTF-8/BOM | expense, income, transfer/payment |
| YNAB | transaction/register export | CSV or TSV, UTF-8/BOM | outflow, inflow, transfer, split if present |
| Goodbudget | transaction export | CSV, UTF-8/BOM | expense, income, envelope transfer if present |
| Mint | previously downloaded transaction export | CSV, UTF-8/BOM | debit, credit, transfer/payment |

For every fixture, document the exact headers, date notation, decimal notation,
sign convention, and expected row/amount totals. If an official export varies by
locale, include at least one representative variant or explicitly reject it with
an actionable message.

## Architecture

### 1. Parser and preflight

Turn file parsing into a strict preflight operation before mapping or writing:

```ts
interface ParsedImportFile {
  headers: string[];
  rows: Record<string, string>[];
  delimiter: "," | "\t";
}

interface ImportPreflight {
  presetId: PresetId | "custom";
  confidence: "high" | "ambiguous" | "none";
  totalRows: number;
  validRows: number;
  invalidRows: Array<{ row: number; reason: string }>;
  unmatchedCategories: number;
  amountTotalCents: number;
}
```

- Detect comma vs. tab outside quoted fields and reject unsupported/mixed input.
- Strip a UTF-8 BOM and normalize header whitespace/case for matching while
  retaining original headers for display and record access.
- Detect or explicitly configure decimal notation. Reject ambiguous values; do
  not guess if `1,234` could mean either 1.234 or 1,234.
- Validate calendar dates and reject impossible or ambiguous date formats unless
  the preset provides a format. Do not rely on environment-dependent `Date.parse`
  for supported presets.
- Treat missing merchant/date/amount, unknown transaction type, malformed money,
  and invalid dates as row errors. A valid zero-dollar row is allowed only when a
  supported source fixture proves it is meaningful.
- Show total, valid, and invalid row counts plus the first actionable errors in
  both import views before enabling Import.
- Do not persist any rows when file-level validation fails. Row-level partial
  import must require an explicit user confirmation and report exact skips.

### 2. Exhaustive amount semantics

Add Mint's positive-magnitude plus transaction-type representation to
[`types.ts`](../src/lib/import/types.ts) and implement it in
[`apply-mapping.ts`](../src/lib/import/apply-mapping.ts), where amount modes are
currently resolved:

```ts
type AmountMapping =
  | ExistingAmountMappings
  | {
      mode: "signedByType";
      column: string;
      typeColumn: string;
      debitValues: readonly string[];
      creditValues: readonly string[];
    };
```

- Normalize type values for case and surrounding whitespace.
- Debit values map to negative cents; credit values map to positive cents.
- Reject blank or unknown values instead of treating every non-debit as income.
- Resolve all amount modes with an exhaustive switch so a new mode cannot fall
  through to an unrelated branch.
- Keep the custom mapping UI to its existing three modes in this plan unless a
  real non-preset use case justifies exposing `signedByType` manually.

### 3. Typed, server-authoritative preset registry

Create [`src/lib/import/presets/index.ts`](../src/lib/import/presets/) as the one
source of truth:

```ts
export type PresetId = "monarch" | "ynab" | "goodbudget" | "mint";

interface ImportPreset {
  id: PresetId;
  label: string;
  mapping: ImportMapping;
  categoryMap: Record<string, SproutCategoryKey>;
  detection: {
    requiredHeaders: readonly string[];
    distinctiveHeaders: readonly string[];
    filenameHints?: readonly string[];
  };
  transformRow?: (row: Record<string, string>) => Record<string, string>;
}
```

- Keep `PresetId` as a literal union. `interface Preset { id: string }` followed
  by `Preset["id"]` is still just `string` and does not protect API/CLI callers.
- Export client-safe preset metadata separately from server mapping/category
  behavior if bundle boundaries require it.
- `detectPreset` returns a scored result, not the first subset match. Required
  headers gate eligibility; distinctive headers determine confidence; filename
  is only a tie-breaker. Ambiguous results return Custom.
- `getPreset(id)` is used by the API and CLI. The server rejects unknown IDs and
  verifies the uploaded headers against the selected preset before importing.
- Add an optional source transform only when fixture semantics require it. Do
  not create a general plugin framework preemptively.

Replace every hardcoded preset branch:

- [`src/components/shared/useImport.ts`](../src/components/shared/useImport.ts)
- [`src/app/api/import/route.ts`](../src/app/api/import/route.ts)
- [`src/db/import.ts`](../src/db/import.ts)
- [`src/components/web/views/Import.tsx`](../src/components/web/views/Import.tsx)
- [`src/components/mobile/screens/Import.tsx`](../src/components/mobile/screens/Import.tsx)
- importer messages in `messages/en.json` and `messages/fr-CA.json`

### 4. Source presets

Implement and release each source separately.

#### Monarch regression baseline

- Move the existing mapping and category map behind the registry without changing
  normalized rows, classification, or dedupe IDs.
- Replace the generic three-header signature with fixture-backed distinctive
  fields.
- Prove existing Monarch imports remain idempotent.

#### YNAB

- Support the transaction/register file, not budget or account-plan files.
- Map Date, Payee, Memo, Account, Category, Outflow, and Inflow only after the
  fixture confirms current headers.
- Support CSV and locale-dependent TSV at the parser layer.
- Define behavior for split transactions, transfers, and starting balances from
  fixtures. Use a source transform/classifier only if generic classification is
  insufficient.

#### Goodbudget

- Map the verified transaction export fields, including Envelope as
  `source_category`.
- Verify signed amount and date/locale behavior from fixtures.
- Define envelope-transfer treatment explicitly so internal moves do not inflate
  spending.

#### Legacy Mint

- Support previously downloaded Mint transaction CSVs using `signedByType`.
- Verify Description, Category, Account Name, Notes, Amount, and Transaction Type
  headers against a representative legacy export.
- Map explicit debit and credit values; unknown types are validation errors.
- Label the picker and copy **Mint (legacy export)**.

## Build sequence

### Gate 0 — fixture and format specification

1. Add sanitized/synthetic source fixtures and an expected-results manifest.
2. Record supported headers, delimiter, date, decimal, amount, and semantic rows.
3. Resolve source-specific transfer/split/opening-balance behavior.
4. Stop the source's implementation if the current export cannot be verified.

**Exit:** every planned source has a fixture with exact expected row count,
signed amount total, excluded count, and uncategorized count.

### Slice 1 — parser/preflight hardening

1. Add CSV/TSV delimiter handling and BOM/header normalization.
2. Add strict money/date parsing with explicit locale decisions.
3. Add structured row errors and preflight totals.
4. Surface the preflight in shared state and both import views.

**Exit:** malformed or ambiguous monetary/date data cannot reach persistence,
and users can see every skipped-row reason before importing.

### Slice 2 — registry and Monarch migration

1. Add the typed registry, scored detection, and server header verification.
2. Route hook, API, CLI, web, and mobile through the registry.
3. Preserve Custom mapping behavior and Monarch output.
4. Add translated preset and validation copy.

**Exit:** there is one authoritative preset list; unknown or ambiguous sources
fall back safely; Monarch regression and custom mapping suites remain green.

### Slice 3 — YNAB

Add the verified preset, category coverage, semantic classification, and fixture
tests. Enable it in the registry only after all acceptance checks pass.

### Slice 4 — Goodbudget

Add the verified preset, category coverage, semantic classification, and fixture
tests. Enable it in the registry only after all acceptance checks pass.

### Slice 5 — legacy Mint

Add `signedByType`, the verified preset, category coverage, semantic
classification, and fixture tests. Enable it only after both debit and credit
paths and unknown-type failures are covered.

### Slice 6 — in-app experience and measurement

1. Show detected source and confidence, delimiter, valid/invalid counts, amount
   total, exclusions, and unmatched category count.
2. Link unmatched imports to the uncategorized Transactions review flow.
3. Add privacy-safe events for file selected, source detected, preflight failed,
   import started, import completed, and source-specific completion. Never log
   filenames, merchants, amounts, row contents, or CSV data.
4. Update [`docs/csv-import.md`](../docs/csv-import.md) with the supported-format
   matrix, registry, validation behavior, CLI values, and limitations.

### Slice 7 — acquisition experiment

After authenticated source imports have enough successful runs to validate the
experience, add a landing section or dedicated migration page:

- “Switching budgeting apps? Bring your transaction history to Sprout.”
- source-specific export instructions linked to current official documentation;
- a clear transaction-history-only scope and privacy statement;
- an experiment metric from migration-page visit to successful first import.

Defer pre-signup file preview until this funnel shows a meaningful opportunity.

## Test matrix

### Parser and normalization

- quoted commas/newlines and escaped quotes continue to work;
- UTF-8 BOM, comma CSV, and tab TSV;
- period and supported comma decimal formats, currency symbols, thousands
  separators, negatives, and accounting parentheses;
- invalid/ambiguous money is rejected rather than converted to zero;
- ISO, month-first, and day-first fixture dates; impossible and ambiguous dates;
- headers normalized for detection without breaking source record lookup.

### Detection and mapping

- each fixture uniquely detects its source at high confidence;
- a generic bank file and intentionally overlapping headers return Custom;
- unknown explicit preset IDs and selected-preset/header mismatches fail in the
  API and CLI;
- every amount mode is exhaustive, including both `signedByType` signs and an
  unknown transaction type;
- expected source categories map; unmatched categories remain preserved and are
  counted.

### Semantics and persistence

- expense, income, transfer, payment, split/opening-balance cases expected by
  each source;
- exact signed amount total and `exclude_from_budget` count per fixture;
- importing the same file twice produces no duplicates;
- overlapping exports preserve genuinely repeated same-day transactions while
  updating the same imported rows;
- preset and custom API integration tests cover validation and summary counts;
- CLI tests prove `--preset <id>` uses that ID rather than silently defaulting to
  Monarch;
- web and mobile tests cover detected, custom, ambiguous, and invalid-file states.

## Acceptance criteria

- All enabled presets are backed by representative fixtures and exact expected
  totals.
- No ambiguous source, date, decimal, sign, or transaction type is guessed.
- The client and server agree on the preset; the server validates independently.
- Monarch and Custom behavior remain backward compatible.
- Re-importing identical or overlapping files remains idempotent.
- Users see valid, invalid, excluded, and unmatched-category counts before they
  commit an import.
- Imported rows preserve raw source category/account values.
- Transfer/payment semantics do not inflate budget spending in supported fixtures.
- Both web and mobile expose the same preset list and validation behavior.
- Import documentation and localized messages ship with the implementation.
- Privacy-safe telemetry can measure completion by source before acquisition work
  is expanded.

## Out of scope

- live bank synchronization;
- QFX, OFX, QIF, PDF, or spreadsheet workbook import;
- source budgets, targets, category groups, envelope balances, or account balance
  history;
- automatically creating a source's entire category taxonomy;
- saved custom mapping profiles;
- pre-signup server upload or persistence;
- guaranteeing categorization through AI.

## Expected files

```text
src/lib/import/read-csv.ts (+ tests)            delimiter/BOM/header handling
src/lib/import/date.ts (+ tests)                strict supported date parsing
src/lib/import/amount.ts (+ tests)              locale-aware strict money parsing
src/lib/import/apply-mapping.ts (+ tests)       exhaustive signedByType handling
src/lib/import/preflight.ts (+ tests)           validation and row diagnostics
src/lib/import/presets/index.ts (+ tests)       typed registry and detection
src/lib/import/presets/monarch.ts               registry migration
src/lib/import/presets/ynab.ts                  verified YNAB preset
src/lib/import/presets/goodbudget.ts            verified Goodbudget preset
src/lib/import/presets/mint.ts                  verified legacy Mint preset
src/lib/import/__fixtures__/                    sanitized source fixtures/manifests
src/components/shared/useImport.ts              registry + preflight state
src/components/web/views/Import.tsx             shared preset/preflight UX
src/components/mobile/screens/Import.tsx        shared preset/preflight UX
src/app/api/import/route.ts (+ tests)            authoritative preset validation
src/db/import.ts (+ tests)                      real --preset selection
messages/en.json
messages/fr-CA.json
docs/csv-import.md
```

No schema migration is expected. If implementation reveals a need to change
`external_id` inputs or persist import diagnostics, stop and write a separate
migration design before editing [`src/db/schema.ts`](../src/db/schema.ts).

## External format references

- [YNAB: export plan data](https://support.ynab.com/en_us/how-to-export-plan-data-Sy_CouWA9)
- [Goodbudget: export transactions](https://goodbudget.com/help/customize-your-goodbudget/export-transactions/)
- [Credit Karma announcement for Mint users](https://www.creditkarma.com/about/releases/intuit-credit-karma-welcomes-all-minters)

Official documentation establishes available export flows, but committed
fixtures and expected totals remain the implementation contract because headers
and locale-specific formats can change.
