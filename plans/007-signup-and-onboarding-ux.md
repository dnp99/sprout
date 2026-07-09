# 007 — Signup and Onboarding UX Refresh

**Status:** Draft · **Created:** 2026-07-08

## Outcome

Reduce signup friction, get new users to value faster, and move non-essential
 setup out of the auth gate and into a guided in-app activation flow.

## Goal

The current flow in [`src/components/auth/AuthFlow.tsx`](../src/components/auth/AuthFlow.tsx)
asks for account creation first, then blocks the user behind three more setup
steps: budget, categories, and goal.

That is serviceable, but it creates three UX problems:

- the user does not see the real product quickly enough
- optional setup is treated as mandatory
- the app asks for abstract intent before it has earned enough context

The goal is to keep the onboarding lightweight while increasing completion rate,
reducing drop-off, and making first-run Sprout feel more immediate.

## Product direction

### 1. Shorten the auth gate

Reduce the pre-app flow to the minimum required to create an account and seed a
useful budgeting experience.

Recommended shape:

1. Account creation: email + password
2. Budget + goal: one combined setup step
3. Optional categories: skippable, or deferred entirely

### 2. Move setup into the app where possible

After successful signup, prefer landing the user inside the real app shell with
a first-run checklist on Home rather than holding them in a wizard for every
setup action.

Checklist candidates:

- Set monthly budget
- Pick a savings goal
- Add first transaction
- Import transactions
- Add a recurring bill

### 3. Treat categories as optional

The categories step should not block access. New users often cannot choose the
right categories before they have imported or entered any transactions.

Options:

- keep the step but add `Skip for now`
- remove it from auth onboarding and let Home prompt later

### 4. Improve perceived progress and trust

The auth gate should feel fast and intentional:

- stronger inline validation before submit
- explicit loading states after signup
- success copy like “Setting up your budget…”
- trust/support cues such as “No credit card required”

## Proposed UX changes

## Phase 1 — friction reduction in the existing flow

Keep the current architecture, but improve the current experience with minimal
structural risk.

- Add inline validation for email format, password length, and confirm-password
  match in `AuthFlow`
- Disable submit/continue buttons until each step is valid
- Combine budget + goal into a single step
- Add `Skip for now` on categories
- Improve empty/error copy so failures are actionable

## Phase 2 — move onboarding into Home

Reshape signup so the user reaches the app sooner.

- After successful signup, route to `/home` once minimal account setup is done
- Show a first-run checklist card on mobile + web Home
- Persist checklist completion in local client state first; only add backend
  persistence if the pattern proves useful
- Prompt toward “Import transactions” or “Add first transaction” as the first
  meaningful action

## Phase 3 — polish and optimization

- Measure drop-off between signup, budget set, first transaction, and first
  return session
- Consider passwordless or magic-link experiments later if conversion still
  lags
- Add lightweight delight moments when the user completes setup actions

## Technical approach

### `src/components/auth/AuthFlow.tsx`

- Refactor from four hardcoded modes (`signup`, `login`, `budget`, `cats`,
  `goal`) into either:
  - fewer modes, or
  - a small config-driven step model
- Add derived validation state rather than submit-only validation
- Keep API submission logic narrow and explicit

### `src/state/store.tsx`

- Revisit the meaning of `flowStep = 'done'`
- Support a state where auth is complete but activation tasks remain
- Keep route/auth ownership in `AppShell`; avoid spreading redirect logic

### `src/components/mobile/screens/Home.tsx`

- Add a first-run activation card/checklist for new users
- Surface “Import”, “Add transaction”, and “Bills” as next actions
- Make the checklist disappear once the user has completed meaningful setup

### `src/components/AppShell.tsx`

- Preserve the current auth gate and splash behavior
- Avoid flashing between auth and app while onboarding state resolves

## Implementation slices

1. **Validation + copy polish**
   Add inline validation, disabled states, and clearer loading/error messages in
   `AuthFlow`.
2. **Step compression**
   Merge budget + goal into one step and make categories skippable.
3. **First-run Home checklist**
   Add an activation card on Home with clear next actions.
4. **Post-signup landing adjustment**
   Reduce hard gating so the user gets into the app sooner.
5. **Instrumentation + iteration**
   Measure completion and refine based on actual drop-off.

## Open questions

- Is budget required before the dashboard is useful, or can it be deferred?
- Should categories be seeded silently from defaults without asking the user?
- Do we want a lightweight “starter mode” for users with zero transactions?
- Should activation checklist state live only on the client or be persisted per
  user?

## Non-goals

- OAuth/social login
- password reset/email verification
- a full onboarding analytics system in the first pass
- rebuilding the entire app shell just to support onboarding
