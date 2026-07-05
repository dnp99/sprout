# Sprout 🌱

Sprout is a friendly, mobile-first personal budgeting app. It helps people see
how much they can safely spend, track where their money goes by category, and
stay on top of goals and bills — with a warm, playful design.

## What it does

- **Safe to spend** — a clear headline number of what's left to spend this cycle.
- **Budgets** — set a monthly budget and give every category an allocation.
- **Categories** — track spending per category with progress toward each budget.
- **Transactions** — log expenses and income; browse recent activity and history.
- **Goals** — save toward things that matter (trips, emergency fund, …).
- **Bills** — keep upcoming bills and subscriptions in view.
- **Trends** — see spending over time and what's moving.

## Stack

- **App:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS
- **Data:** Drizzle ORM · `postgres.js` → Neon Postgres
- **Tests:** Vitest
- **Hosting:** Vercel (app) + Neon (database)

Money is handled as signed integer **cents** end to end; only `formatMoney()`
turns it into display strings.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

To use a real database, copy `.env.example` to `.env.local`, fill in your Neon
connection strings, then:

```bash
npm run db:generate  # generate migrations from src/db/schema.ts
npm run db:migrate   # apply them
npm run db:seed      # load the sample dataset
```

## Project structure

```
src/
├── app/            # Next.js App Router — pages + /api routes
├── components/     # UI (app shell, tab bar, screens)
├── state/          # client state store
├── db/             # Drizzle schema, client, seed
└── lib/            # types, formatting, domain logic (<domain>/{repository,dto,validation})
docs/               # design system, ER diagram, migrations runbook
plans/              # design/implementation plans and roadmap
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — conventions and mandatory rules for contributors/agents
- [`AGENT.md`](AGENT.md) — workflow rules (branching, money handling, push policy)
- [`docs/design-system.md`](docs/design-system.md) — Sprout design tokens & components
- [`docs/er-diagram.md`](docs/er-diagram.md) — data model
- [`docs/database-migrations.md`](docs/database-migrations.md) — migration workflow
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Vercel + Neon deployment
- [`plans/`](plans/) — plans for upcoming work

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint + ES-compatibility check |
| `npm test` | Vitest unit tests |
| `npm run db:generate` / `db:migrate` / `db:seed` | Drizzle schema + Neon seed |
