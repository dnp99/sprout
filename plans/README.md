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

- [`004-inline-categorize-and-ai-backlog.md`](004-inline-categorize-and-ai-backlog.md)
  — inline category assignment + a one-click AI pass over uncategorized
  transactions.

## Completed

Finished plans live in [`completed/`](completed/):

- [`001-sprout-final-mobile-web.md`](completed/001-sprout-final-mobile-web.md) —
  mobile app + web companion.
- [`002-csv-import-pipeline.md`](completed/002-csv-import-pipeline.md) — generic
  CSV import (mapping, dedupe, budget exclusion, AI categorization).
- [`003-auth.md`](completed/003-auth.md) — multi-user authentication.
