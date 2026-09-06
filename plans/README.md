# Plans

This folder holds design and implementation **plans** for Sprout — roadmap notes,
feature designs, and step-by-step build plans for upcoming work.

## Conventions

- One file per plan: `NNN-short-title.md` (e.g. `001-neon-integration.md`), or a
  dated file like `2026-07-connect-neon.md`. Numbering keeps them ordered.
- A plan captures **what** we're building and **why**, the approach, and open
  questions — written before or alongside the work.
- Move finished plans to `plans/completed/` (or mark them Done at the top) rather
  than deleting them, so the history of decisions stays available.

Reference material that describes how the system *is* (not what we plan to do)
lives in [`../docs/`](../docs/) instead.

## Active

- [`020-business-activity-reporting.md`](020-business-activity-reporting.md) —
  optional business assignment on both income and expenses, plus Yoga-style
  period reporting and saved business views.

- [`019-income-sources.md`](019-income-sources.md) — first-class Main job, Side
  business, Refunds, and custom income sources, separate from expense budgets.

- [`015-account-security-and-deletion.md`](015-account-security-and-deletion.md) —
  self-serve **Security** in Settings. **Slices 1–3 shipped** (`00cc3a8`): change
  password (+ sign out other devices) and irreversible re-authenticated **account
  deletion**, upgrading the Data & Deletion page from email-request to in-app.
  **Remaining:** Slice 4, optional TOTP **two-factor auth** with recovery codes
  (needs a migration; may split into a dedicated follow-up plan).
- [`016-installable-online-first-pwa.md`](016-installable-online-first-pwa.md) —
  reliable browser/home-screen installation, `/home` standalone launch,
  cross-platform Settings guidance, and mobile safe-area polish, explicitly
  without offline caching of authenticated financial data.

## Completed

Finished plans live in [`completed/`](completed/):

- [`014-import-presets-acquisition-wedge.md`](completed/014-import-presets-acquisition-wedge.md) —
  fixture-backed Monarch, YNAB, Goodbudget, and legacy Mint transaction-history
  presets on a hardened parser/preflight (comma/tab + BOM, per-preset decimal
  notation, strict dates, `signedByType`) and a typed, server-authoritative
  registry with scored detection. **Shipped the import engine (Slices 1–6);
  deferred the Slice 6 telemetry + the Slice 7 acquisition landing** — see the
  status note at the top of the plan. Standing doc:
  [`../docs/csv-import.md`](../docs/csv-import.md).
- [`017-categorization-rules-and-saved-views.md`](017-categorization-rules-and-saved-views.md) —
  merchant categorization rules, advanced transaction filters, and server-
  persisted saved views. **Completed 2026-08-14.**

- [`013-internationalization.md`](completed/013-internationalization.md) — locale
  system (next-intl, English + fr-CA beta): cookie-preference language setting,
  route-group split, locale-aware money/date formatting + parser, message
  catalogs with a drift CI check, and the full app string sweep. Standing doc:
  [`../docs/i18n.md`](../docs/i18n.md).

- [`010-recurring-monthly-status-view.md`](completed/010-recurring-monthly-status-view.md) —
  monthly Bills/Recurring status with list and calendar modes, exact
  transaction links, and manual completion for unmatched occurrences.

- [`001-sprout-final-mobile-web.md`](completed/001-sprout-final-mobile-web.md) —
  mobile app + web companion.
- [`002-csv-import-pipeline.md`](completed/002-csv-import-pipeline.md) — generic
  CSV import (mapping, dedupe, budget exclusion, AI categorization).
- [`003-auth.md`](completed/003-auth.md) — multi-user authentication.
- [`004-inline-categorize-and-ai-backlog.md`](completed/004-inline-categorize-and-ai-backlog.md)
  — inline category assignment, apply-to-merchant, + a one-click AI pass over
  uncategorized transactions.
- [`005-goals-and-bills.md`](completed/005-goals-and-bills.md) — real Goals &
  Recurring/Bills data with full create/edit/delete UI.
- [`006-cadences-and-roundups.md`](completed/006-cadences-and-roundups.md) —
  weekly/yearly recurring cadences + on-demand goal round-up sweep.
- [`007-signup-and-onboarding-ux.md`](completed/007-signup-and-onboarding-ux.md) —
  auth gate collapsed to email+password, an envelope budget model, a first-run
  Home activation checklist + empty states, and a privacy-first analytics funnel.
- [`008-external-capture-api-and-channels.md`](completed/008-external-capture-api-and-channels.md) —
  authenticated ingest API + Siri Shortcut & WhatsApp channels (regex + Haiku NL
  parse, classify, idempotency, CSV reconciliation, write-first + undo). Standing
  doc: [`../docs/capture-api.md`](../docs/capture-api.md).
- [`009-legal-pages-and-footer-trust.md`](completed/009-legal-pages-and-footer-trust.md) —
  real footer legal pages (Privacy, Terms, Security Overview, Data & Deletion) on
  a shared editorial reading layout, with honest v1 copy in a typed content model.
- [`011-budget-tracking-redesign.md`](completed/011-budget-tracking-redesign.md) —
  Budget redesigned into a month-aware tracking screen with fixed/flexible
  groups, planned/spent/left rows, and shared web/mobile derivation.
- [`012-cash-flow-redesign.md`](completed/012-cash-flow-redesign.md) —
  Trends evolved into a cash-flow view (income vs. expenses vs. net + savings
  rate) with bar/line + pace projection, Category/Merchant/Group breakdowns, and
  CSV export, all derived from transactions. Standing doc:
  [`../docs/trends-reports.md`](../docs/trends-reports.md).
