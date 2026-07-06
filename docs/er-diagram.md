# Sprout — Entity Relationship Diagram

Keep this in sync with [`../src/db/schema.ts`](../src/db/schema.ts). Money columns
are signed integer **cents**.

## Schema diagram

```
┌──────────────────────────────┐
│            users             │
│──────────────────────────────│
│ id (PK, uuid)                │
│ name                         │
│ email (unique)               │
│ currency         (default USD)│
│ budget_cycle     (default monthly)
│ budget_pool_cents (default 400000)
│ password_hash    (nullable)  │
│ created_at, updated_at       │
└──────────────┬───────────────┘
               │ 1
        ┌──────┴──────────────┬─────────────┐
        │                     │             │
        ▼ N                   ▼ N           ▼ N
     (categories)      (transactions)   ┌──────────────────────────┐
                                        │        sessions          │
                                        │──────────────────────────│
                                        │ id (PK, uuid)            │
                                        │ token (unique)           │
                                        │ user_id (FK → users)     │
                                        │ expires_at               │
                                        │ created_at               │
                                        └──────────────────────────┘
┌──────────────────────────────┐   ┌──────────────────────────────┐
│          categories          │   │         transactions         │
│──────────────────────────────│   │──────────────────────────────│
│ id (PK, uuid)                │   │ id (PK, uuid)                │
│ user_id (FK → users)         │   │ user_id (FK → users)         │
│ name                         │   │ category_id (FK → categories,│
│ emoji                        │◄──│   nullable, ON DELETE SET NULL)
│ color            (hex accent) │ N │ merchant                     │
│ monthly_budget_cents (int)   │   │ amount_cents (int, signed)   │
│ sort_order (int)             │   │ note (nullable)              │
│ created_at, updated_at       │   │ method  (default card)       │
└──────────────────────────────┘   │ status  (default posted)     │
                                    │ account_id (FK → accounts)   │
                                    │ kind, exclude_from_budget    │
                                    │ external_id, source_category │
                                    │ source_account, imported_at  │
                                    │ occurred_at                  │
                                    │ created_at, updated_at       │
                                    └──────────────────────────────┘

┌──────────────────────────────┐   ┌──────────────────────────────┐
│           accounts           │   │        merchant_rules        │
│──────────────────────────────│   │──────────────────────────────│
│ id (PK, uuid)                │   │ id (PK, uuid)                │
│ user_id (FK → users, CASCADE)│   │ user_id (FK → users, CASCADE)│
│ name                         │   │ pattern (normalized merchant)│
│ type   (default depository)  │   │ category_id (FK → categories,│
│ mask (nullable)              │   │   nullable, ON DELETE SET NULL)
│ institution (nullable)       │   │ source     (ai | manual)     │
│ current_balance_cents (null) │   │ created_at, updated_at       │
│ sort_order (int)             │   │ unique (user_id, pattern)    │
│ created_at, updated_at       │   └──────────────────────────────┘
└──────────────────────────────┘
```

## Relationships

- **users → categories:** one-to-many. Deleting a user cascades to their
  categories (`ON DELETE CASCADE`).
- **users → transactions:** one-to-many. Deleting a user cascades to their
  transactions.
- **categories → transactions:** one-to-many, and a transaction's category is
  **nullable** (income has no category). Deleting a category sets its
  transactions' `category_id` to `NULL` (`ON DELETE SET NULL`) rather than
  deleting the transactions.
- **users → sessions:** one-to-many. A session holds an opaque `token` (stored in
  the auth cookie) and an `expires_at`; deleting a user cascades to their
  sessions (`ON DELETE CASCADE`).
- **users → accounts:** one-to-many (`ON DELETE CASCADE`). An account is a
  bank/card/loan (`name`, `type`, `mask`, `institution`, `current_balance_cents`),
  populated by CSV/bank import.
- **accounts → transactions:** one-to-many; `transactions.account_id` is
  **nullable** (`ON DELETE SET NULL`).
- **users → merchant_rules:** one-to-many (`ON DELETE CASCADE`). A rule caches a
  normalized merchant `pattern` → `category_id` (`source` = `ai | manual`), unique
  per `(user_id, pattern)`. Populated by the AI categorization fallback so each
  merchant is classified once. `category_id` FK → categories (`ON DELETE SET NULL`).
- **users → goals:** one-to-many (`ON DELETE CASCADE`). A savings goal
  (`name`, `emoji`, `color`, `target_cents`, `saved_cents`, optional
  `target_date`). The progress label ("Almost there!", "Dec 2026") is **derived**
  on read, not stored.
- **users → recurring_items:** one-to-many (`ON DELETE CASCADE`). Recurring income
  + bills (`amount_cents` signed, `cadence`, `day_of_month`, `paused`, optional
  `category_id` → categories `ON DELETE SET NULL`). "Upcoming bills" are **derived**
  from the expense rows (next due from `day_of_month`) — there is no bills table.

## Import columns (on `transactions`)

Added for repeatable import (plan 002):

- `external_id` (nullable) — deterministic per-source-row dedupe key. A **partial
  unique index** on `(user_id, external_id) WHERE external_id IS NOT NULL` makes
  re-imports upsert; manual transactions (null `external_id`) are unconstrained.
- `kind` (default `expense`) — `expense | income | transfer | payment`.
- `exclude_from_budget` (default `false`) — internal moves (transfers, card/loan
  payments) set `true`; budget math ignores them.
- `source_category` / `source_account` — raw import strings, preserved so
  category/account mapping can be re-run without re-importing.
- `imported_at` (nullable) — set on import, null for manual entry.

## Conventions

- **Money:** `amount_cents` is signed — negative = expense, positive = income.
  `monthly_budget_cents` is a non-negative budget.
- **Derived, not stored:** a category's "spent this month" and the budget summary
  are computed on read (see `src/lib/transactions/repository.ts`), not stored
  columns.
- **Timestamps:** all `timestamptz`, defaulting to `now()`.
