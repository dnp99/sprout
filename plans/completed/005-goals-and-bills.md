# 005 — Goals & Bills (real data)

**Status:** ✅ Done — goals + recurring/bills are real, and full create/edit/
delete UI shipped (Goals, Recurring, Categories) on web + mobile ·
**Created:** 2026-07-05 · **Updated:** 2026-07-05

## Goal

Replace the last hardcoded sample datasets in the app — **Goals**, **Upcoming bills**, and
**Recurring** — with real per-user tables. After this, every screen except the
API-failure fallback renders from the database.

## Model

Two tables (money stays signed integer **cents**):

### `goals`

```
goals
  id (PK, uuid)
  user_id (FK -> users, CASCADE)
  name, emoji, color
  target_cents  integer            -- goal amount
  saved_cents   integer default 0  -- progress
  target_date   date?              -- for the "Dec 2026" label
  sort_order    integer default 0
  created_at, updated_at
```

`targetLabel` is **derived** (not stored): reached / almost-there / month-year.

### `recurring_items` — the source of "upcoming bills"

Recurring income + bills. Upcoming bills are **derived** from the expense rows
(next due date from `day_of_month`), so there's no separate bills table.

```
recurring_items
  id (PK, uuid)
  user_id (FK -> users, CASCADE)
  name, emoji
  amount_cents  integer            -- signed: negative = bill, positive = income
  cadence       text default 'monthly'
  day_of_month  integer            -- 1..31
  paused        boolean default false
  category_id   uuid? (FK -> categories, SET NULL)
  sort_order    integer default 0
  created_at, updated_at
```

## Derivation (pure, tested — `src/lib/bills.ts`, `src/lib/goals/`)

- `nextDueDate(dayOfMonth, now)` / `daysUntil` / `dueLabel(days)` →
  `deriveUpcomingBills(recurring, now, limit)`: non-paused expenses, soonest
  first, `urgent` when due ≤ 3 days.
- `monthlyBillsTotalCents(recurring)` — sum of non-paused expense magnitudes.
- `recurringFrequencyLabel(dayOfMonth)` → "Monthly · 7th".
- `goalTargetLabel(saved, target, date)` → "Reached!" / "Almost there!" /
  "Dec 2026" / "".

## Wiring

- **Repository/DTO** per domain: `src/lib/goals/{repository,dto}.ts`,
  `src/lib/recurring/{repository,dto}.ts`.
- **API:** extend `GET /api/summary` to also return `goals` + `recurring`
  (one round trip; the store already fetches summary on load).
- **Store/api.ts:** `AppData` gains `goals` + `recurring`; components derive
  upcoming bills from `recurring` via `bills.ts`.
- **Components:** Overview (goals + bills), web/mobile Bills, web/mobile Goals
  read from the store — no fake data in any render path.
- **Seed:** add goals + recurring for the seed user so the screens aren't empty.

## Slices

1. **Schema + migration** (`goals`, `recurring_items`), ER-diagram update.
2. **Helpers + DTO/repository** with tests (derivation is the risky part).
3. **API + store wiring + seed**; components read real data (no fake data in any
   render path).

## Non-goals / follow-ups

- **Create/edit UI** for goals & recurring (POST/PATCH routes + forms). This
  slice makes them real and readable; add/edit is a fast follow.
- **Contributing to a goal** from a transaction / round-ups.
- Non-monthly cadences (weekly/yearly) — `cadence` column is there for later.

Branch off fresh `main`; `lint` + `test` + `build` green; no push without
approval.
