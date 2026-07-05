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
                                    │ occurred_at                  │
                                    │ created_at, updated_at       │
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

## Conventions

- **Money:** `amount_cents` is signed — negative = expense, positive = income.
  `monthly_budget_cents` is a non-negative budget.
- **Derived, not stored:** a category's "spent this month" and the budget summary
  are computed on read (see `src/lib/transactions/repository.ts`), not stored
  columns.
- **Timestamps:** all `timestamptz`, defaulting to `now()`.
