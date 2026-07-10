# 009 — Import wedge: Mint / YNAB / GoodBudget presets

**Status:** Draft · **Created:** 2026-07-09

## Outcome

Turn Sprout's existing CSV import into an **acquisition wedge**: one-click,
correctly-mapped import for the three budgeting tools people are actively leaving
— **Mint** (shut down), **YNAB**, and **GoodBudget**. The pitch is a landing
angle — *"Leaving Mint? Bring your history into Sprout in 2 minutes, free"* —
aimed at a large pool of orphaned budgeters shopping for a replacement right now.

## Why this is the cheap win

The whole pipeline already exists ([`docs/csv-import.md`](../docs/csv-import.md),
plan 002): read → map → classify → dedupe → persist, with AI categorization and
repeatable upserts. A **preset is just a saved `ImportMapping` + a category map**
([`presets/monarch.ts`](../src/lib/import/presets/monarch.ts)). So most of this
plan is *data* (three mappings + three category maps + detection signatures), not
new machinery — plus one small generalization and one new amount mode.

This is mostly-marketing, little-engineering: the reason to do it is timing (Mint
is dead) and cost (the importer's built), not technical novelty.

## What exists today

- `ImportMapping` ([`types.ts`](../src/lib/import/types.ts)) declares column →
  field mapping; amount normalizes to **signed cents** via one of three modes:
  `signed`, `debitCredit`, `inflowOutflow`.
- A preset = `ImportMapping` + `Record<string, SproutCategoryKey>` category map
  ([`category-map.ts`](../src/lib/import/category-map.ts)).
- **Auto-detection is hardcoded** in [`useImport.ts`](../src/components/shared/useImport.ts):
  `MONARCH_HEADERS.every(h => detected.includes(h))`, and `preset` is a
  `"monarch" | "custom"` union. This is the thing that must generalize.

## Slice A — a preset registry (generalize detection)

Replace the hardcoded Monarch check with a registry so presets scale:

```ts
// src/lib/import/presets/index.ts
interface Preset {
  id: string;                 // "monarch" | "mint" | "ynab" | "goodbudget"
  label: string;              // "Mint"
  mapping: ImportMapping;
  categoryMap: Record<string, SproutCategoryKey>;
  signature: string[];        // header set that identifies this source
}
export const PRESETS: Preset[] = [monarch, mint, ynab, goodbudget];
export function detectPreset(headers: string[]): Preset | null; // first whose signature ⊆ headers
```

- `useImport.ts` drops `MONARCH_HEADERS` / the two-value union and calls
  `detectPreset(headers)`; `preset` becomes `Preset["id"] | "custom"`. Move the
  Monarch mapping/map behind the registry unchanged (no behaviour change for
  existing Monarch users — cover with a test).
- The preset picker in the import UI lists all registered presets + "Custom."

## Slice B — the three presets

Each is a mapping + category map + signature. **Exact headers must be verified
against a real current export from each tool before finalizing** — versions drift;
treat the below as the shape, and pin the tests to committed sample fixtures.

### YNAB — easiest (uses an existing amount mode)

YNAB's register export has separate **Outflow** and **Inflow** columns → the
existing `inflowOutflow` mode. Roughly:

```
date: "Date"   merchant: "Payee"   notes: "Memo"   account: "Account"
category: "Category"                       -- YNAB's "Category" (or "Category Group/Category")
amount: { mode: "inflowOutflow", inflowColumn: "Inflow", outflowColumn: "Outflow" }
```

Category map: YNAB category names → Sprout keys (groceries, dining, …).

### GoodBudget — signed amount (existing mode)

GoodBudget exports a single **signed Amount** (negative = expense) and an
**Envelope** as the category:

```
date: "Date"   merchant: "Name"   notes: "Notes"   account: "Account"
category: "Envelope"    amount: { mode: "signed", column: "Amount" }
```

Category map: GoodBudget envelope names → Sprout keys.

### Mint — needs a **new amount mode**

Mint's amount is a **positive magnitude** plus a separate **Transaction Type**
column (`debit` / `credit`) that carries the sign — none of the three existing
modes fit. Add a fourth:

```ts
// types.ts AmountMapping
| { mode: "signedByType"; column: string; typeColumn: string; debitValues?: string[] }
```

Implement in [`amount.ts`](../src/lib/import/amount.ts): magnitude from `column`,
sign from `typeColumn` (`debit` → expense/negative, `credit` → income/positive;
`debitValues` defaults to `["debit"]`). This is the one genuinely new piece of
engineering, and per [`docs/csv-import.md`](../docs/csv-import.md) amount
normalization is a **must-test** spot — fixture-driven unit tests, both signs.

Mint mapping (verify against a real export):

```
date: "Date"   merchant: "Description"   notes: "Notes"   account: "Account Name"
category: "Category"
amount: { mode: "signedByType", column: "Amount", typeColumn: "Transaction Type" }
```

Category map: Mint's (many) category names → Sprout keys. Mint's taxonomy is the
largest; map the common ones and let the rest fall through to the AI categorizer /
uncategorized (both already handle the tail).

## Slice C — the acquisition surface (the actual point)

The engineering above is only worth it if people arrive for it:

- A **marketing/landing section** — *"Switching from Mint, YNAB, or GoodBudget?
  Import your full history free."* Logos, a 3-step (export → upload → done) strip,
  screenshot of the preview. This is the campaign the plan exists to enable.
- **Pre-signup import teaser (optional, higher effort):** let a visitor drop their
  CSV and see a live preview (row count, detected source, category split) *before*
  creating an account, then sign up to keep it. Turns "try it" into activation.
  Gated behind a decision below — could leak into the pre-auth flow (plan 007).
- **In-app copy:** the Import screen names the supported tools explicitly so a
  logged-in switcher knows it'll Just Work.

## New / touched files

```
src/lib/import/types.ts                    + "signedByType" AmountMapping
src/lib/import/amount.ts (+ .test)         handle signedByType (both signs)
src/lib/import/presets/index.ts            Preset type + PRESETS + detectPreset
src/lib/import/presets/mint.ts             mapping + category map + signature
src/lib/import/presets/ynab.ts             mapping + category map + signature
src/lib/import/presets/goodbudget.ts       mapping + category map + signature
src/lib/import/presets/*.test.ts           per-source fixture round-trips
src/components/shared/useImport.ts         detectPreset registry (drop MONARCH_HEADERS)
docs/csv-import.md                         document the registry + the four presets
(marketing surface)                        landing section / switcher page
```

## Testing (the risky bits)

Per `docs/csv-import.md`, **amount normalization** and **`external_id` hashing**
are where a silent bug corrupts an import. So:

- A committed **sample fixture CSV** per source (a few rows: expense, income,
  transfer, a card payment) checked into the test dir.
- Assert: `signedByType` signs correctly; each preset auto-detects from its
  header set; category map resolves the common categories; internal moves still
  get excluded by `classify`; re-import is idempotent.

## Sequencing

1. **Registry** (Slice A) — refactor detection, Monarch behind it, tests green.
   No user-visible change; safe prerequisite.
2. **YNAB + GoodBudget** — reuse existing amount modes; pure data + fixtures.
3. **Mint** — add `signedByType` to `amount.ts` + tests, then the Mint preset.
4. **Acquisition surface** (Slice C) — landing section first (cheap), pre-signup
   teaser only if we decide it's worth the auth-flow entanglement.
5. **Docs** — update `csv-import.md`; flip this plan to Complete.

## Open questions

1. **Pre-signup import preview** — worth letting visitors preview before an
   account exists (strong activation hook, but touches the auth gate reshaped in
   plan 007), or keep import behind login for v1?
2. **Category-map depth** — how much of Mint's large taxonomy to hand-map vs.
   lean on the AI categorizer for the tail. (Bias: map the top ~20, let AI/uncat
   handle the rest — cheap and self-correcting.)
3. **Header drift** — do we match on an exact signature set, or a looser
   "contains these key columns" so minor export-format changes don't break
   detection? (Leaning subset-match, which the registry already implies.)
```
