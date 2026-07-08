# Sprout Deployment Strategy

## 1) Target architecture

Sprout is a **single unified Next.js app** deployed to one Vercel project, with
Neon Postgres as the database.

- **App** (repo root): Next.js on Vercel project `sprout`
- **Database:** Neon Postgres (one project, branched per environment)
- **Domain:** production is [`www.sprout-money.ca`](https://www.sprout-money.ca)
  (the apex `sprout-money.ca` 308-redirects to it); the default
  `*.vercel.app` URL stays valid too.

UI pages, API routes, and DB access all live in the same deployment — no CORS, no
separate API host.

### Custom domain (DNS)

The domain is registered elsewhere with DNS hosted on Cloudflare. Two records
point it at Vercel (add them in the registrar/Cloudflare DNS panel, **not**
proxied — keep them "DNS only" / grey-cloud, since proxying Cloudflare in front
of Vercel breaks the apex→www redirect and SSL):

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| `A` | `sprout-money.ca` (root) | `216.198.79.1` (Vercel apex IP) | 600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 600 |

Then, in Vercel → project → **Settings → Domains**, add both `sprout-money.ca`
and `www.sprout-money.ca`. Vercel verifies the records, auto-provisions HTTPS
(Let's Encrypt), and the canonical is **www** (the apex redirects to it). Use
whatever record values Vercel's Domains panel shows for your project — the A-record
IP above is what it issued here (Vercel's older apex IP `76.76.21.21` also exists
for some accounts).

**No app changes are needed for the domain:** the client calls relative paths
(`/api/...`), there is no base-URL env var, and the session cookie
(`sprout_session`) sets no `domain`, so it binds to whichever host serves it and
works on the custom domain automatically.

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

Optional:

- `ANTHROPIC_API_KEY` — enables AI categorization for CSV import (Claude
  `claude-haiku-4-5`; see [`docs/csv-import.md`](docs/csv-import.md)). Without it,
  imports still work — unmatched merchants just import uncategorized.

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
- **skips migrations (without failing)** when no `DATABASE_URL_UNPOOLED` /
  `DATABASE_URL` is set — a missing URL only skips migrations; once Neon is
  connected they run automatically.

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
3. Confirm the custom domain shows **Valid Configuration** in Vercel → Domains,
   `https://www.sprout-money.ca` serves over HTTPS, and `https://sprout-money.ca`
   redirects to it. Do a live login round-trip to confirm the session cookie
   works on the domain.
4. Smoke-test:
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
