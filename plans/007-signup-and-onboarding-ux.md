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

### ⚠️ Blocking finding (2026-07-08): "budget" is two disconnected things

Investigation while building slice 2 revealed the budget-checklist premise is
built on a false model. There are **two** unrelated "budget" concepts:

- **`user.budgetPoolCents`** — the "monthly budget pool", default `400000`
  ($4,000). This is what the old auth budget step, Settings/`EditProfileForm`,
  and the planned "Set monthly budget" checklist item all edit. It does **not**
  feed the dashboard.
- **Per-category `monthlyBudgetCents`** — summed into `summary.budgetCents` by
  `getBudgetSummary` (`sum(categories.monthlyBudgetCents)`), which is what
  actually drives the **"safe to spend" hero tile**.

New users are seeded with non-zero category budgets (`DEFAULT_CATEGORIES` totals
**$4,150**), so a brand-new user's hero tile is **already populated** — verified
end-to-end: a fresh signup lands on Home showing "SAFE TO SPEND $4,150". That
sinks the original slice-2 plan:

- Making `budgetPoolCents` nullable/`0` would **not** empty the hero tile — the
  hero never reads that field.
- A "Set monthly budget" item that sets the pool has **no visible dashboard
  effect**.
- The mobile budget screen the hero taps into (`BudgetSetup.tsx`) also has a
  hardcoded `$4,000` / `64% / 36%` mock header and edits per-category budgets — a
  third, separate surface.

**Resolved 2026-07-09 — envelope unification (chosen model).** The two concepts
are now unified:

- `budgetPoolCents` is the **single total monthly budget** and the source of
  truth for "safe to spend" (`getBudgetSummary` now reads the pool, not the
  category sum).
- Per-category `monthlyBudgetCents` are **allocations within** the pool.
  `BudgetSummary` gained `allocatedCents` (sum of category budgets) and
  `unallocatedCents` (`pool − allocated`, negative = over-allocated).
- New users start with the pool **unset (`0`)** and categories seeded at **$0**,
  so the hero shows a "Set your budget" prompt instead of a phantom number.
- The mobile `BudgetSetup` screen is now a real editor: editable total, live
  allocated / left (or "over" in the accent color), per-category steppers.

Verified end-to-end: fresh signup → empty hero → set $3,000 + allocate → hero
shows "$3,000 safe to spend"; over-allocation shows "$X over". See the Technical
approach + Implementation slices below for the file-level changes.

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

## Phase 1 — remove dead setup ✅ Done (2026-07-08)

Lead with the data-truth cleanup.

- ✅ Removed the `cats`, `budget`, and `goal` screens from `AuthFlow`; the gate is
  now just signup/login
- ✅ Removed dead `onbBudget` / `onbCats` / `onbGoal` state and the unused
  `finishFlow` action; trimmed `FlowStep` to `booting | signup | login | done`
- ✅ `signup` now sets `flowStep = "done"` (lands in-app); verified end-to-end
  (fresh signup → Home, no gated steps)
- The `budgetPoolCents` migration + hero empty state moved to slice 2, now
  **blocked** on the budget-model finding above

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

### Setting budget from the checklist

Reuse the existing budget-edit path — do not build a new one. `setBudgetPool`
(store) already does the optimistic update + debounced persist, and
`parseBudgetPool` / `formatBudgetInput` already exist for the input.

- The "Set monthly budget" item opens an inline `$ [____]` input (mirrors the old
  auth budget step) and calls `setBudgetPool` on confirm; routing to
  Settings → Monthly budget is the fallback if inline proves awkward.
- Once budget is set, the "safe to spend" hero fills in and the checklist item
  self-clears (visibility is derived from budget being unset).

**The `0`/null rule (design seam between this and the slice-2 migration):**

- `0`/null is **valid as stored state** — it means "never set", and is what
  drives the empty hero tile and the checklist trigger.
- `0` is **invalid as a submitted value** — an edit form must still reject saving
  a zero/empty budget.
- Display unset as **blank** (placeholder `4,000`), never `$0.00`. In particular,
  `formatBudgetInput(0)` must render empty, and `EditProfileForm`'s existing
  `budgetPoolCents <= 0` guard stays as a *submit* check but must not treat the
  unset starting state as a user error.

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
- `src/state/initial.ts` — drop the client-side `400000` default so a new user
  starts unset, matching the new column default
- `src/lib/format.ts` (`formatBudgetInput`) — render unset (`0`/null) as blank,
  not `$0.00`
- `src/components/shared/EditProfileForm.tsx` — keep the `budgetPoolCents <= 0`
  guard as a *submit* check, but treat the unset starting state as blank, not an
  error
- Audit other `budgetPoolCents` readers for a phantom-default assumption:
  `Home.tsx` (safe-to-spend tile empty state), `Overview.tsx`, `Categories.tsx`,
  and the Settings screens

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

1. ✅ **Prune dead steps** *(done 2026-07-08)*
   Removed categories, budget, and goal from the auth gate; deleted dead
   `onbBudget`/`onbCats`/`onbGoal` state + `finishFlow`; signup lands in-app.
2. ✅ **Envelope budget unification** *(done 2026-07-09)*
   `budgetPoolCents` is now the single total (drives safe-to-spend);
   per-category budgets allocate within it. Migration set the pool default to
   `0`; `DEFAULT_CATEGORIES` seeded at $0; `getBudgetSummary` rewired +
   `allocatedCents`/`unallocatedCents` added; mobile + web heroes show a "Set your
   budget" empty state; `BudgetSetup` rebuilt as a real editor; budget
   input format/parse extracted to `format.ts` (blank when unset). Verified
   end-to-end.
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
- ~~**Budget model (blocks slice 2):** pool vs. category-sum vs. unify?~~
  **Resolved 2026-07-09:** full envelope unification — pool is the single total
  driving safe-to-spend; categories allocate within it; new users start blank
  ($0 pool + $0 category budgets) for a real "set your budget" moment.
- Do we want a lightweight “starter mode” for users with zero transactions?
- Should activation checklist state live only on the client or be persisted per
  user? Client-only is acceptable for a first pass, but it may reappear on a new
  device or browser.

## Non-goals

- OAuth/social login
- password reset/email verification
- a full onboarding analytics system in the first pass
- rebuilding the entire app shell just to support onboarding
