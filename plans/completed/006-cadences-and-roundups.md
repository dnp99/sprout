# 006 — Non-monthly cadences + goal round-ups

**Status:** ✅ Complete (2026-07-06) · **Created:** 2026-07-06

Both slices landed: **A** — weekly/yearly cadences (migration 0007) with a
cadence-aware `bills.ts` and the `EditRecurringForm` Repeats selector. **B** —
on-demand goal round-up sweep (migration 0008) into a single designated goal,
via `roundups.ts` + `sweepRoundups` + the `RoundupSweepCard` on both Goals
screens and the "Round-up destination" toggle in the goal editor.

Two follow-ups deferred from plan 005's non-goals.

## A. Weekly / yearly recurring cadences

`recurring_items.cadence` exists (default `monthly`) but only `monthly` is
modeled. Add **weekly** and **yearly**, each with its own anchor.

### Model

`day_of_month` alone can't anchor weekly/yearly, so add two nullable columns:

```
recurring_items
  + day_of_week    integer?   -- 0=Sun..6=Sat, for cadence='weekly'
  + month_of_year  integer?   -- 1..12,        for cadence='yearly' (with day_of_month)
```

Anchor per cadence: **monthly** → `day_of_month`; **weekly** → `day_of_week`;
**yearly** → `month_of_year` + `day_of_month`. `day_of_month` stays NOT NULL
(defaults to 1 for weekly, where it's unused).

### Derivation (`src/lib/bills.ts`, pure + tested)

- `nextDueDate(item, now)` becomes cadence-aware (item = `{cadence, dayOfMonth,
  dayOfWeek, monthOfYear}`): next weekday for weekly, next month/day for yearly,
  next day-of-month for monthly (clamped to month length as today).
- `recurringFrequencyLabel(item)` → "Monthly · 7th" / "Weekly · Tuesdays" /
  "Yearly · Mar 15".
- `monthlyBillsTotalCents` normalizes to a **monthly-equivalent** (weekly ×52/12,
  yearly ÷12, monthly ×1) so the "monthly bills" figure stays meaningful.

### Wiring

- `RecurringInput` + `RecurringItem` type + DTO + `toRecurringInput` gain
  `cadence`, `dayOfWeek`, `monthOfYear`. `createRecurring` stops hardcoding
  `cadence: "monthly"`.
- `validateRecurring`: cadence ∈ {monthly, weekly, yearly}; require the matching
  anchor, null the others.
- `EditRecurringForm`: a cadence selector; the anchor input swaps — day-of-month
  (monthly), day-of-week (weekly), month + day (yearly).

## B. Goal round-ups (on-demand sweep → one designated goal)

Spare change from expenses, swept into a goal on demand (user's choice: sweep
button, single designated goal). No cron; a sweep marks rows so nothing
double-counts.

### Model

```
goals        + is_roundup_target  boolean default false   -- at most one per user (app-enforced)
transactions + roundup_swept_at   timestamptz?            -- set when swept
```

### Compute (`src/lib/roundups.ts`, pure + tested)

- `roundUpCents(amountCents)` — spare change on an expense: `(100 - |amt|%100) %
  100`.
- `availableRoundupsCents(transactions)` — Σ round-ups over expenses that count
  toward budget (not income, not `excludeFromBudget`) and are **not yet swept**.

### Sweep (repository + API)

- `sweepRoundups(userId)`: find the target goal; sum unswept round-ups; add to
  `saved_cents`; stamp `roundup_swept_at = now` on those rows; return
  `{sweptCents, goalId}`. No target or nothing to sweep → `{sweptCents: 0}`.
- `setRoundupTarget(userId, goalId)` — set one, clear the others.
- `POST /api/goals/roundups/sweep`; the target toggle rides on the existing goal
  `PATCH` (`isRoundupTarget`).

### Wiring

- `Transaction` DTO gains `roundupSwept: boolean` so the client can total
  available round-ups live.
- `Goal` type + DTO + `validateGoal` gain `isRoundupTarget`.
- Store: `sweepRoundups()` action (refreshes after).
- UI: `EditGoalForm` gets a "Round-up destination" toggle; the Goals screen
  (web + mobile) shows a "Round up spare change · $X available" button when a
  target exists and there's change to sweep.

## Slices (small commits)

1. **A** — cadences: schema+migration, `bills.ts` + tests, validation/dto/input,
   `EditRecurringForm`.
2. **B** — round-ups: schema+migration, `roundups.ts` + tests, sweep
   repository/API, goal target toggle, sweep button + store.

## Non-goals

- Biweekly / custom intervals (the `cadence` text column allows them later).
- Automatic round-ups on new transactions (sweep-only for now).
- Per-sweep goal selection (single designated target instead).

Branch rule / verification rule apply; no push without approval. Update
[`docs/er-diagram.md`](../docs/er-diagram.md) when schema lands.
