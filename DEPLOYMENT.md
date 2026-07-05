# Sprout Deployment Strategy

## 1) Target architecture

Sprout is a **single unified Next.js app** deployed to one Vercel project, with
Neon Postgres as the database.

- **App** (repo root): Next.js on Vercel project `sprout`
- **Database:** Neon Postgres (one project, branched per environment)
- **Domain:** `sprout.yourdomain.com` (or the default `*.vercel.app`)

UI pages, API routes, and DB access all live in the same deployment — no CORS, no
separate API host.

## 2) Environments

Neon supports database branching, so mirror Vercel's environments with Neon
branches:

| Environment | Vercel | Neon branch |
| --- | --- | --- |
| Production | Production deployment | `main` |
| Preview | Preview deployments (per-PR) | a preview branch |
| Local | `npm run dev` | a dev branch |

Each environment migrates its **own** database on deploy (see §5).

## 3) Required environment variables

Set these in the Vercel project (Production **and** Preview), and in
`.env.local` for local dev (see [`.env.example`](.env.example)):

- `DATABASE_URL` — Neon **pooled** connection string. Used by the app at runtime.
- `DATABASE_URL_UNPOOLED` — Neon **direct/unpooled** connection string. Used for
  migrations only (Neon's pooler runs PgBouncer in transaction mode and does not
  reliably apply DDL).

Both must point at the database for that specific environment.

## 4) GitHub Secrets (optional, only if you automate deploys)

Vercel's Git integration handles deploys automatically on push. If you later add
a GitHub-driven deploy workflow, set:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 5) CI/CD flow

### CI (`.github/workflows/ci.yml`)

Runs on PR and push to `main`: `npm ci` → `npm run lint` → `npm run test:coverage`
→ `npm run build`. Branch-protect `main` on the `CI / Lint · test · build` check.

### Migrations on deploy

`vercel.json` sets `buildCommand` to
`node scripts/migrate-on-deploy.mjs && next build`. The script:

- runs `drizzle-kit migrate` on **production and preview** builds (each migrates
  its own DB),
- **skips** local builds,
- **fails the build** if no `DATABASE_URL_UNPOOLED` / `DATABASE_URL` is set.

`migrate` is idempotent, so it's safe on every deploy. Full runbook:
[`docs/database-migrations.md`](docs/database-migrations.md).

### Deploy

Vercel deploys automatically: production on push to `main`, preview per PR.

## 6) Production safety checklist

Before the first prod cut:

1. Confirm `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are set for Production and
   Preview, each pointing at the correct Neon branch.
2. Confirm the initial migration applied (`drizzle.__drizzle_migrations` has
   rows) and, if desired, seed data via `npm run db:seed`.
3. Smoke-test:
   - `GET /` renders the Home screen.
   - `GET /api/summary` returns the user + budget summary + categories.
   - `GET /api/transactions` returns recent transactions.
   - `POST /api/transactions` creates one (valid body) and rejects an invalid one
     with `400`.

## 7) Rollback strategy

- Use Vercel's "Promote previous deployment" to roll back the app.
- Schema changes are additive-first; if a migration must be undone, generate a
  new corrective migration rather than editing history.
- Keep one known-good preview deployment before promoting to production.

## 8) Post-deploy monitoring

Track at minimum:

- 5xx error rate on `/api/*`
- API latency (summary / transactions)
- Neon connection/pool errors

Alert on sustained 5xx or connection exhaustion.
