# Sprout 🌱

A friendly, mobile-first personal budgeting app. Built from the **Sprout** variant
of the Budget App design prototype.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS ·
Drizzle ORM · Neon Postgres. Deploys to **Vercel** with **Neon** as the database.

## Status

First pass — **Home screen** built and interactive. Other tabs (Categories, Goals,
Bills) are friendly placeholders. The app runs entirely on a local state store
seeded from mock data, so it works before a database is connected. The DB schema,
migrations, seed, and API routes are scaffolded and ready for Neon.

## Quickstart

```bash
npm install
npm run dev          # http://localhost:3000 — runs on mock data, no DB needed
```

- Tap the **＋** to add an expense — Safe-to-spend, the month bar, and the
  category bars update live (local state).
- The bottom tab bar switches screens.

## Project structure

```
src/
├── app/
│   ├── layout.tsx          # fonts (Bricolage Grotesque + Figtree), providers
│   ├── page.tsx            # renders the app shell
│   ├── globals.css
│   └── api/
│       ├── summary/route.ts        # GET user + budget summary + categories
│       └── transactions/route.ts   # GET recent · POST new
├── components/
│   ├── AppShell.tsx        # centered 480px frame + tab bar + add sheet
│   ├── TabBar.tsx
│   ├── Placeholder.tsx     # stubs for the not-yet-built tabs
│   ├── ui/ProgressBar.tsx
│   └── home/               # HomeScreen + AddExpenseSheet
├── state/store.tsx         # client store: local state + interactions
├── db/
│   ├── schema.ts           # users, categories, transactions (money = cents)
│   ├── index.ts            # Drizzle + postgres.js client
│   └── seed.ts             # seeds the mock dataset into Neon
└── lib/
    ├── types.ts · format.ts · mock.ts · http.ts · currentUser.ts
    └── transactions/       # repository · dto · validation (+ tests)
```

Money is stored and computed as signed integer **cents** everywhere; only the
`formatMoney` helper turns it into display strings.

## Connecting Neon (next pass)

1. Create a Neon project and copy both connection strings into `.env.local`
   (see `.env.example`) — pooled `DATABASE_URL` for the app, unpooled
   `DATABASE_URL_UNPOOLED` for migrations.
2. Generate + apply the schema, then seed:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
3. Point the client store at `/api/summary` + `/api/transactions` instead of the
   mock imports — the response shapes already match `src/lib/types.ts`.

## Deploying

- **Vercel:** import the repo; set `DATABASE_URL` / `DATABASE_URL_UNPOOLED` env
  vars. `vercel.json` runs `db:migrate` before `next build`.
- **Neon:** use the same project; a dev branch locally, main for production.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit tests) |
| `npm run db:generate` / `db:migrate` / `db:seed` | Drizzle schema + Neon seed |
