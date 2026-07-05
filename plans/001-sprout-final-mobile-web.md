# 001 — Sprout Final: mobile app + web companion

**Status:** In progress · **Started:** 2026-07-05

## Goal

Implement the **Sprout Final** design (handoff bundle
`personal-budget-app-design-new`) — the complete product: the mobile app **and**
the desktop web companion, plus auth/onboarding. Runs on the local state store
with the design's dataset (Neon wired in a later plan).

## Architecture decisions

- **One responsive Next.js app.** Small viewports render the **mobile app**
  (tab-bar navigation); `lg+` viewports render the **web dashboard** (sidebar).
  Both read the same `useStore()` state. Switch via Tailwind responsive classes
  so there's no hydration branch.
- **Local state only** this pass. The store holds all app state + navigation +
  interactions. Data comes from `src/lib/mock/*`.
- **Shared primitives first.** Extract reusable UI (Money, ProgressBar, Toggle,
  SegmentedControl, Pill, Card, StatCard, Sheet, Donut, BarChart, Keypad) so
  mobile and web don't duplicate. Keep every file < ~500 lines (hygiene rule).
- **Structure:**
  ```
  src/components/
    ui/            # shared primitives
    mobile/        # phone screens + MobileApp shell (tab bar)
    web/           # dashboard views + WebApp shell (sidebar)
    auth/          # sign-up / login / onboarding wizard (shared by both)
  src/lib/mock/    # user, categories, transactions, goals, recurring, bills, accounts
  src/lib/search.ts, budget.ts   # shared filter/sort + budget math
  src/state/store.tsx            # all state + actions
  ```

## Data model (mock)

- **User:** Sam Rivera · sam@sprout.money.
- **Categories** (spent / budget cents): Bills 960/1000, Groceries 520/600,
  Shopping 310/**250 (over)**, Dining 280/300, Fun 190/220, Transport 140/200.
  Total budget $4,000, spent $3,240, safe-to-spend $2,480.
- **Transactions:** expenses + income (Salary +$3,200), with date label, note,
  method, emoji, category.
- **Goals:** Japan trip 🌸 $2,100/$5,000 (Dec 2026), Safety net 🛡️ $8,400/$10,000,
  New laptop 💻 $1,220/$2,000 (Sep 2026).
- **Recurring:** Salary +3,200, Rent −1,850, Electric −88, Netflix −15.99,
  Spotify −11.99, Gym −40, iCloud+ −2.99; each pausable.
- **Connected accounts:** Chase Checking, Amex Gold (web settings).

## Screen inventory

**Mobile:** Home · Categories · Category detail · Add category · Budget setup ·
Add (expense/income + recurring) · Activity · Search · Trends · Goals · Bills ·
Add bill · Manage recurring · Transaction detail · Settings.

**Web dashboard:** Overview · Transactions (search + sortable) · Categories
(editable budgets) · Trends · Goals · Bills & recurring · Settings · Add modal.

**Auth:** Sign-up · Login · Onboarding (income → categories → goal). Mobile =
full-screen; web = split-screen overlay.

## Build slices (commit locally per slice, no push)

1. Data foundation — `lib/mock/*`, `types.ts`, `format.ts`, `search.ts`, `budget.ts`.
2. Store — all state + actions (nav, add, toggle recurring, edit budget, search, auth).
3. Shared UI primitives (`components/ui/*`).
4. Mobile app — shell (tab bar) + all mobile screens.
5. Web companion — shell (sidebar) + all dashboard views + add modal.
6. Auth/onboarding — shared flow, mobile + web presentations.
7. Responsive `AppShell` wiring + verify (lint/test/build) + design tokens.

## Out of scope (later plans)

Neon persistence, real auth, real bank sync, editing/splitting transactions,
new-goal/new-category forms beyond the design's static screens.
