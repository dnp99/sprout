# Sprout 🌱

Sprout is a friendly, mobile-first personal budgeting app. It helps people see
how much they can safely spend, track where their money goes by category, and
stay on top of goals and bills — and it lets you **log expenses without opening
the app**, by dictating to a **Siri Shortcut** or texting a **WhatsApp** bot.
Clean, friendly design with full light + dark mode.

Live at **[www.sprout-money.ca](https://www.sprout-money.ca)**.

## What it does

- **Safe to spend** — a clear headline number of what's left to spend this cycle.
- **Budgets** — set a monthly budget and give every category an allocation.
- **Categories** — track spending per category with progress toward each budget.
- **Transactions** — log expenses and income; browse recent activity and history.
- **Import** — bring in any bank/budget-tool CSV (Monarch preset or map your own
  columns), repeatably and without duplicates, with optional AI categorization.
- **Capture on the go** — log expenses *without opening the app*: dictate to a
  **Siri Shortcut** or text a **WhatsApp** bot ("coffee 4.50", or even "McDonald's
  five dollars"). One authenticated ingest API powers both, with a natural-language
  parser (regex + a Haiku fallback), write-first + undo, and CSV reconciliation so
  captures never double-count. See [`docs/capture-api.md`](docs/capture-api.md).
- **Goals** — save toward things that matter (trips, emergency fund, …).
- **Bills** — keep upcoming bills and subscriptions in view.
- **Trends** — see spending over time and what's moving.

A public **marketing landing page** greets signed-out visitors at `/`; signed-in
users are sent straight to their dashboard. See
[`docs/landing-page.md`](docs/landing-page.md).

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
├── db/             # Drizzle schema, client, seed, import script
└── lib/            # types, formatting, domain logic (<domain>/{repository,dto,validation}); import/ pipeline
docs/               # design system, ER diagram, migrations runbook, CSV import
plans/              # design/implementation plans and roadmap
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — conventions and mandatory rules for contributors/agents
- [`AGENT.md`](AGENT.md) — workflow rules (branching, money handling, push policy)
- [`docs/design-system.md`](docs/design-system.md) — Sprout design tokens & components
- [`docs/er-diagram.md`](docs/er-diagram.md) — data model
- [`docs/database-migrations.md`](docs/database-migrations.md) — migration workflow
- [`docs/csv-import.md`](docs/csv-import.md) — CSV import pipeline (mapping, dedupe, AI categorization)
- [`docs/capture-api.md`](docs/capture-api.md) — external capture API + Siri/WhatsApp channels
- [`docs/landing-page.md`](docs/landing-page.md) — public landing page + entry routing
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
| `npm run db:import -- <csv> [--preset monarch\|--map f.json] [--ai]` | Import a CSV export ([docs](docs/csv-import.md)) |
| `npm run capture:landing` | Re-capture the landing hero dashboard screenshots (dev server + seed) |
