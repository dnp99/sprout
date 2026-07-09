# 007 — Signup and Onboarding UX Refresh

**Status:** Draft · **Created:** 2026-07-08

## Outcome

Reduce signup friction, get new users to value faster, and move non-essential
setup out of the auth gate and into a guided in-app activation flow.

## Goal

The current flow in
[`src/components/auth/AuthFlow.tsx`](../src/components/auth/AuthFlow.tsx) asks
for account creation first, then blocks the user behind three more setup steps:
budget, categories, and goal.

The code review finding that reshapes this plan: only one of those three setup
steps persists meaningful user data today.

## Current behavior

- **Budget is real.** The `budget` step calls `updateBudgetPoolApi`, then updates
  `user.budgetPoolCents` in client state.
- **Categories are redundant.** The `cats` step only writes `onbCats` in the
  client store. `onbCats` is not consumed outside `AuthFlow`, while
  [`POST /api/auth/signup`](../src/app/api/auth/signup/route.ts) already seeds a
  full default category set from `DEFAULT_CATEGORIES`.
- **Goal is inert.** The `goal` step only writes `onbGoal` in the client store.
  `finishFlow` then sets `flowStep = "done"` without creating a persisted goal,
  even though Goals are a real domain object.

That means the auth gate is not merely longer than necessary; two of its setup
steps are currently theater. Optimizing those screens as UI would preserve
friction without improving the user's actual data.

This creates four UX/product problems:

- the user does not see the real product quickly enough
- optional setup is treated as mandatory
- the app asks for abstract intent before it has earned enough context
- two setup screens imply work happened when no durable data changed

The goal is to keep the onboarding lightweight while increasing completion rate,
reducing drop-off, and making first-run Sprout feel more immediate.

## Product direction

### 1. Shorten the auth gate

Reduce the pre-app flow to only work that actually changes persisted state or is
strictly required before the app is useful.

**Decision (2026-07-08): the gate is email + password only.** Budget moves to the
Home activation checklist. Rationale: budget is not theater like `cats`/`goal` —
it powers the "safe to spend" hero tile — but gating it costs a full step for
every signup, and the tile can show a clear empty state until the user sets one.
Getting into the real app faster wins over a pre-filled hero on first load.

Recommended shape:

1. Account creation: email + password — the entire gate
2. Budget: first item in the Home activation checklist
3. Everything else: in-app activation, or persist it properly

### Consequence: budget needs a real "unset" signal

`budgetPoolCents` currently defaults to `400000` ($4,000) in both the DB schema
and client initial state. That means a new user already *has* a $4,000 budget, so
"budget not set" cannot be derived from the value — $4,000 is indistinguishable
from a deliberate choice. To make budget a clean checklist item and give the hero
tile an honest empty state, we need to distinguish "never set" from "set to a
value":

- Make `budgetPoolCents` nullable (or default `0`) via a schema migration
  (`db:generate` + `db:migrate` — never hand-write or `push`), so "unset" is
  representable.
- Give the "safe to spend" tile an empty/prompt state when budget is unset,
  rather than rendering a number derived from a phantom default.
- Update the `4,000` placeholder handling in the budget input accordingly.

### 2. Delete the categories onboarding step

The category question is already answered by server behavior: new users receive
default categories at signup. Remove the `cats` step from `AuthFlow`, and remove
dead `onbCats` state once no code reads it.

### 3. Move goal into Home activation

**Decision (2026-07-08): remove the `goal` screen from auth and move "Pick a
savings goal" into Home activation, opening the existing goal-creation flow.**

Rationale from the code: a real Goal requires a positive `targetCents`
(`validateGoal`), but the onboarding pills only pick a *type* — no amount, no
date. Creating a real goal at signup would force an amount question before the
user has any context, which is the exact "abstract intent too early" problem this
plan sets out to fix. The full create-goal path already exists (`createGoal` API
+ store action + Goals UI), so the checklist item can deep-link into it and let
the user set name/target/date with real context.

### 4. Move setup into the app where possible

After successful signup, prefer landing the user inside the real app shell with a
first-run checklist on Home rather than holding them in a wizard for every setup
action.

Checklist candidates:

- Set monthly budget
- Pick a savings goal
- Add first transaction
- Import transactions
- Add a recurring bill

### 5. Improve perceived progress and trust

The auth gate should feel fast and intentional:

- stronger inline validation before submit
- explicit loading states after signup
- success copy like “Setting up your budget…”
- trust/support cues such as “No credit card required”

## Proposed UX changes

## Phase 1 — remove dead setup

Lead with the data-truth cleanup.

- Remove the `cats` screen from `AuthFlow`
- Remove `onbCats` from initial state and app types once no code reads it
- Remove the `budget` and `goal` screens from `AuthFlow`; the gate ends at
  account creation
- Remove dead `onbGoal` state once no code reads it
- Make `budgetPoolCents` nullable / default `0` (schema migration) so "unset" is
  representable, and add the empty state to the "safe to spend" tile

## Phase 2 — validation and copy polish

Improve the remaining auth surface without changing server semantics.

- Add inline validation for email format, password length, and confirm-password
  match in `AuthFlow`
- Disable submit/continue buttons until each active step is valid
- Improve empty/error copy so failures are actionable
- Keep validation client-side and cheap; email verification remains a non-goal

## Phase 3 — separate auth from activation state

The load-bearing state-model change: `flowStep` should answer only the auth/gate
question, while a separate activation model drives first-run prompts inside the
app.

- After successful signup, route to `/home` by setting `flowStep = "done"` once
  the account and required data are loaded
- Add a separate activation/checklist state instead of adding more meaning to
  `flowStep`
- After the schema change, `signup` sets `flowStep = "done"` directly (it no
  longer routes to a `budget` step)
- First pass can derive checklist visibility from existing data:
  - budget unset (`budgetPoolCents` null / `0` — a real signal after the
    migration, not the old phantom $4,000 default)
  - no transactions
  - no goals
  - no recurring bills
- If we add explicit dismissal/completion state, start with client-side storage
  only and document the tradeoff: it may reappear on a new device or browser

## Phase 4 — move onboarding into Home

Reshape signup so the user reaches the app sooner and finishes setup in context.

- Show a first-run checklist card on mobile + web Home
- Prompt toward “Import transactions” or “Add first transaction” as the first
  meaningful action
- “Pick a savings goal” opens the real goal-creation flow (name/target/date),
  not a type-only pill

## Phase 5 — polish and optimization

- Measure drop-off between signup, budget set, first transaction, and first
  return session
- Consider passwordless or magic-link experiments later if conversion still
  lags
- Add lightweight delight moments when the user completes setup actions

## Technical approach

### `src/components/auth/AuthFlow.tsx`

- Refactor from the current hardcoded modes (`signup`, `login`, `budget`, `cats`,
  `goal`, plus `done`) into either:
  - fewer modes, or
  - a small config-driven step model
- Remove `cats`, `budget`, and `goal` from the auth path; the gate ends at
  signup/login
- Add derived validation state rather than submit-only validation
- Keep API submission logic narrow and explicit

### `src/state/store.tsx`

- `signup` sets `flowStep = "done"` after `load()` instead of `"budget"`
- Keep `flowStep = "done"` meaning “authenticated and app visible”
- Do not encode activation/checklist state into `flowStep`
- Keep route/auth ownership in `AppShell`; avoid spreading redirect logic

### `src/db/schema.ts` + migration

- Make `budgetPoolCents` nullable or default `0` so "budget never set" is a real
  state; generate + migrate (never hand-write or `drizzle-kit push`)
- Update `src/lib/auth/currentUser.ts` / DTOs if the column type changes

### `src/state/types.ts` and `src/state/initial.ts`

- Remove `onbCats` and `onbGoal` once the categories/goal auth steps are deleted
- Add explicit activation state only if derived state is not enough

### `src/components/mobile/screens/Home.tsx`

- Add a first-run activation card/checklist for new users
- Surface “Import”, “Add transaction”, and “Bills” as next actions
- Make the checklist disappear once the user has completed meaningful setup

### `src/components/AppShell.tsx`

- Preserve the current auth gate and splash behavior
- Avoid flashing between auth and app while onboarding state resolves

## Implementation slices

1. **Prune dead steps**
   Remove categories, budget, and goal from auth onboarding; delete dead
   `onbCats`/`onbGoal` state.
2. **Budget "unset" migration**
   Make `budgetPoolCents` nullable / default `0`; add the empty state to the
   "safe to spend" tile so a budget-less user sees an honest prompt.
3. **Validation + copy polish**
   Add inline validation, disabled states, and clearer loading/error messages in
   `AuthFlow`.
4. **State model change**
   Make signup land in-app (`flowStep = "done"`), and keep activation separate
   from `flowStep`.
5. **First-run Home checklist**
   Add an activation card on Home with clear next actions (budget first).
6. **Instrumentation + iteration**
   Measure completion and refine based on actual drop-off.

## Open questions

- ~~Is budget required before the dashboard is useful, or can it be deferred?~~
  **Resolved 2026-07-08:** deferred to the Home activation checklist; gate is
  email + password only, and the "safe to spend" tile gets an empty state.
- ~~Should the goal prompt create a persisted Goal during onboarding, or move
  fully into Home activation?~~ **Resolved 2026-07-08:** moved fully into Home
  activation, opening the existing goal-creation flow — a real Goal needs a
  target amount the pills don't collect.
- Do we want a lightweight “starter mode” for users with zero transactions?
- Should activation checklist state live only on the client or be persisted per
  user? Client-only is acceptable for a first pass, but it may reappear on a new
  device or browser.

## Non-goals

- OAuth/social login
- password reset/email verification
- a full onboarding analytics system in the first pass
- rebuilding the entire app shell just to support onboarding
