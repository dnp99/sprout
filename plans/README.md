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

- [`009-legal-pages-and-footer-trust.md`](009-legal-pages-and-footer-trust.md) —
  dedicated footer legal pages for Privacy, Terms, Security, and Data/Deletion,
  with a shared reading layout and honest v1 trust copy.
- [`010-recurring-monthly-status-view.md`](010-recurring-monthly-status-view.md) —
  a monthly, status-aware Bills/Recurring view with month navigation, derived
  paid-vs-upcoming grouping, and shared reconciliation logic across web/mobile.
- [`011-budget-tracking-redesign.md`](011-budget-tracking-redesign.md) —
  reworks Budget into a month-aware tracking screen with fixed/flexible groups,
  planned/spent/left rows, and shared web/mobile derivation.
- [`012-cash-flow-redesign.md`](012-cash-flow-redesign.md) —
  evolves Trends into a cash-flow view (income vs. expenses vs. net + savings
  rate over time) with income/expense category breakdowns, all derived from
  transactions.

## Recently shipped

- [`008-external-capture-api-and-channels.md`](008-external-capture-api-and-channels.md) —
  **Complete** (verified on real devices). An authenticated ingest API so users log
  transactions without opening Sprout, via a Siri Shortcut and a WhatsApp bot
  (Twilio), both riding one endpoint — regex + Haiku NL parse, classify, idempotency,
  CSV reconciliation, write-first + undo. Kept here (not moved to `completed/`) to
  preserve its in-repo links; marked Complete at the top. Standing doc:
  [`../docs/capture-api.md`](../docs/capture-api.md).
- [`007-signup-and-onboarding-ux.md`](007-signup-and-onboarding-ux.md) —
  **Implemented (slices 1–6).** Collapsed the auth gate to email+password,
  unified the budget into an envelope model, added a first-run Home activation
  checklist + zero-transaction empty states, and wired a privacy-first PostHog
  funnel. Kept here (not moved to `completed/`) to preserve its many in-repo
  links; marked Done at the top per the convention above.


## Completed

Finished plans live in [`completed/`](completed/):

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
