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
│ currency         (default CAD)│
│ budget_cycle     (default monthly)
│ budget_pool_cents (default 0 = unset)
│ password_hash    (nullable)  │
│ created_at, updated_at       │
└──────────────┬───────────────┘
               │ 1
        ┌──────┴──────────────┬─────────────┬──────────────────┐
        │                     │             │                  │
        ▼ N                   ▼ N           ▼ N                ▼ N
     (categories)      (transactions)   ┌──────────────────────────┐
                                        │        sessions          │
                                        │──────────────────────────│
                                        │ id (PK, uuid)            │
                                        │ token (unique)           │
                                        │ user_id (FK → users)     │
                                        │ expires_at               │
                                        │ created_at               │
                                        └──────────────────────────┘
                                                             ┌──────────────────────────┐
                                                             │  password_reset_tokens   │
                                                             │──────────────────────────│
                                                             │ id (PK, uuid)            │
                                                             │ user_id (FK → users)     │
                                                             │ token_hash (unique)       │
                                                             │ expires_at, used_at       │
                                                             │ created_at               │
                                                             └──────────────────────────┘

┌──────────────────────────────┐
│   password_reset_requests    │
│──────────────────────────────│
│ id (PK, uuid)                │
│ email_hash, ip_hash          │
│ created_at                   │
└──────────────────────────────┘
┌──────────────────────────────┐
│       income_sources         │
│──────────────────────────────│
│ id (PK, uuid)                │
│ user_id (FK → users, CASCADE)│
│ name, emoji, sort_order       │
│ created_at, updated_at       │
└──────────────────────────────┘
┌──────────────────────────────┐   ┌──────────────────────────────┐
│          categories          │   │         transactions         │
│──────────────────────────────│   │──────────────────────────────│
│ id (PK, uuid)                │   │ id (PK, uuid)                │
│ user_id (FK → users)         │   │ user_id (FK → users)         │
│ name                         │   │ category_id (FK → categories,│
│ emoji                        │◄──│   nullable, ON DELETE SET NULL)
│ color            (hex accent) │ N │ recurring_item_id (FK →      │
│ monthly_budget_cents (int)   │   │   recurring_items, nullable, │
│ sort_order (int)             │   │   ON DELETE SET NULL)        │
│ created_at, updated_at       │   │ merchant                     │
└──────────────────────────────┘   │ amount_cents (int, signed)   │
                                    │ note (nullable)              │
                                    │ method  (default card)       │
                                    │ status  (default posted)     │
                                    │ account_id (FK → accounts)   │
                                    │ kind, exclude_from_budget    │
                                    │ external_id, source (origin) │
                                    │ source_category, source_account
                                    │ imported_at                  │
                                    │ occurred_at                  │
                                    │ created_at, updated_at       │
                                    └──────────────────────────────┘

┌──────────────────────────────┐   ┌──────────────────────────────┐
│           accounts           │   │        merchant_rules        │
│──────────────────────────────│   │──────────────────────────────│
│ id (PK, uuid)                │   │ id (PK, uuid)                │
│ user_id (FK → users, CASCADE)│   │ user_id (FK → users, CASCADE)│
│ name                         │   │ pattern (normalized merchant)│
│ type   (default depository)  │   │ label (nullable, display)    │
│ mask (nullable)              │   │ category_id (FK → categories,│
│ institution (nullable)       │   │   nullable, ON DELETE SET NULL)
│ current_balance_cents (null) │   │ source     (ai | manual)     │
│ sort_order (int)             │   │ created_at, updated_at       │
│ created_at, updated_at       │   │ unique (user_id, pattern)    │
└──────────────────────────────┘   └──────────────────────────────┘

── External capture (plan 008) ──────────────────────────────────────
┌──────────────────────────────┐   ┌──────────────────────────────┐
│          api_tokens          │   │      channel_identities      │
│──────────────────────────────│   │──────────────────────────────│
│ id (PK, uuid)                │   │ id (PK, uuid)                │
│ user_id (FK → users, CASCADE)│   │ user_id (FK → users, CASCADE)│
│ name                         │   │ channel        ('whatsapp')  │
│ token_hash (unique, sha256)  │   │ external_id (E.164 phone)    │
│ token_prefix                 │   │ verified_at (nullable)       │
│ scope       (default ingest) │   │ last_ingest_id (FK → txns,   │
│ last_used_at, revoked_at     │   │   nullable, ON DELETE SET NULL)
│ created_at                   │   │ last_ingest_at (nullable)    │
└──────────────────────────────┘   │ created_at                   │
                                    │ unique (channel, external_id)│
┌──────────────────────────────┐   └──────────────────────────────┘
│      channel_link_codes      │
│──────────────────────────────│
│ code (PK, text)              │
│ user_id (FK → users, CASCADE)│
│ expires_at                   │
│ created_at                   │
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
- **users → income_sources:** one-to-many (`ON DELETE CASCADE`). Sources label
  positive transactions without participating in expense budget allocation;
  deleting one clears the nullable `transactions.income_source_id` reference.
- **users → password_reset_tokens:** one-to-many (`ON DELETE CASCADE`). A reset
  row stores only a SHA-256 `token_hash`, plus expiry and single-use `used_at`
  markers; a newer recovery request invalidates a prior unused token.
- **password_reset_requests:** an unlinked, privacy-minimized rate-limit log.
  It stores SHA-256 hashes of a normalized email and request IP with its creation
  time, never the raw identifier or reset token.
- **users → accounts:** one-to-many (`ON DELETE CASCADE`). An account is a
  bank/card/loan (`name`, `type`, `mask`, `institution`, `current_balance_cents`),
  populated by CSV/bank import.
- **accounts → transactions:** one-to-many; `transactions.account_id` is
  **nullable** (`ON DELETE SET NULL`).
- **users → merchant_rules:** one-to-many (`ON DELETE CASCADE`). A rule caches a
  normalized merchant `pattern` → `category_id` (`source` = `ai | manual`; `label`
  holds the readable merchant for the rules manager), unique per `(user_id,
  pattern)`. Users manage their own `manual` rules (plan 017), which the AI pass
  never overwrites. Populated by the AI categorization fallback so each
  merchant is classified once. `category_id` FK → categories (`ON DELETE SET NULL`).
- **users → goals:** one-to-many (`ON DELETE CASCADE`). A savings goal
  (`name`, `emoji`, `color`, `target_cents`, `saved_cents`, optional
  `target_date`). `is_roundup_target` marks the one goal that round-up sweeps go
  into (app-enforced single target). The progress label ("Almost there!",
  "Dec 2026") is **derived** on read, not stored.
- **users → recurring_items:** one-to-many (`ON DELETE CASCADE`). Recurring income
  + bills (`amount_cents` signed, `cadence` = `monthly | weekly | yearly`, `paused`,
  optional `category_id` → categories `ON DELETE SET NULL`). The due-date **anchor**
  depends on cadence: monthly → `day_of_month`; weekly → `day_of_week` (0=Sun..6=Sat);
  yearly → `month_of_year` (1..12) + `day_of_month`. `day_of_month` stays NOT NULL
  (defaults to 1 for weekly). "Upcoming bills" are **derived** from the expense rows
  (next due per cadence) — there is no bills table.
- **recurring_items → transactions:** one-to-many through nullable
  `transactions.recurring_item_id`. A manually confirmed occurrence creates a
  normal transaction with this exact link; deleting a recurring definition sets
  the link to `NULL` and preserves the transaction history.
- **users → api_tokens:** one-to-many (`ON DELETE CASCADE`). Bearer tokens for the
  Siri Shortcut / scripts: `token_hash` (sha256, unique), `token_prefix` (display),
  `scope` (`ingest`), `last_used_at`, `revoked_at`. Plan 008.
- **users → channel_identities:** one-to-many (`ON DELETE CASCADE`). Binds an
  external `channel` + `external_id` (a WhatsApp phone; unique per channel) to a
  user. `last_ingest_id` (FK → transactions, `ON DELETE SET NULL`) + `last_ingest_at`
  point at the row a bare `U`/`E` reply undoes/edits. Plan 008.
- **users → channel_link_codes:** one-to-many (`ON DELETE CASCADE`). One-time codes
  shown in-app to bind a phone to a user (`code` PK, `expires_at`). Plan 008.
- **transactions → channel_identities.last_ingest_id:** a captured row can be an
  identity's "last ingest" pointer (`ON DELETE SET NULL`).

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
- `roundup_swept_at` (nullable) — set when this row's spare change has been swept
  into a goal (round-ups), so a later sweep won't recount it. Null = not swept.
- `source` (nullable, plan 008) — origin of the row: null/`manual` = in-app add,
  `import` = CSV, `whatsapp` | `siri` = external capture. Lets a later CSV import
  reconcile against a prior channel capture instead of double-counting.

## Conventions

- **Money:** `amount_cents` is signed — negative = expense, positive = income.
  `monthly_budget_cents` is a non-negative budget.
- **Budget model (envelope):** `users.budget_pool_cents` is the single **total**
  monthly budget and the source of truth for "safe to spend". A category's
  `monthly_budget_cents` is an **allocation within** that total; the budget
  summary exposes `allocatedCents` (sum of category budgets) and
  `unallocatedCents` (`pool − allocated`). `0` pool = never set (drives the "set
  your budget" empty state). See [`plans/007`](../plans/completed/007-signup-and-onboarding-ux.md).
- **Derived, not stored:** a category's "spent this month" and the budget summary
  (incl. safe-to-spend / allocated / unallocated) are computed on read (see
  `src/lib/transactions/repository.ts`), not stored columns.
- **Timestamps:** all `timestamptz`, defaulting to `now()`.
