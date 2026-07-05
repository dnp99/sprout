# Database migrations

Drizzle ORM + `drizzle-kit`, Postgres (Neon). Schema lives in
[`../src/db/schema.ts`](../src/db/schema.ts); generated migration files live in
`drizzle/`, tracked in `drizzle/meta/_journal.json`.

## Authoring a schema change

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` — diffs the schema and writes the `NNNN_*.sql` file + a
   properly-chained snapshot. **Never hand-write migration files** (hashes /
   snapshots won't chain and `drizzle-kit migrate` silently skips them).
3. `npm run db:migrate` to apply locally.

`db:generate` and `db:migrate` load `.env.local` via `drizzle.config.ts` and
prefer `DATABASE_URL_UNPOOLED` (the direct connection). If your environment has
no database URL, ask the user to run generate themselves.

## Auto-migration on deploy

- **Vercel deploys:** `vercel.json` sets `buildCommand` to
  `node scripts/migrate-on-deploy.mjs && next build`. The script runs
  `drizzle-kit migrate` on **production and preview** builds (each env migrates
  its own DB) and skips local builds. While Neon isn't connected the app runs on
  mock data, so a missing database URL is expected — the script **skips
  migrations** (it does not fail the build) and runs them automatically once
  `DATABASE_URL_UNPOOLED` / `DATABASE_URL` is set. `migrate` is idempotent, so
  it's safe on every deploy.
- Each Vercel environment must have its own `DATABASE_URL_UNPOOLED` (preferred —
  Neon's pooler doesn't reliably apply DDL) pointing at that environment's Neon
  branch.

## NEVER use `drizzle-kit push` on a shared DB

`push` syncs the schema directly **without** recording anything in
`drizzle.__drizzle_migrations`. The journal then lags the real schema, and the
next `migrate` tries to re-apply changes that already exist → `column … already
exists` and a failed deploy. Only ever use generate + migrate.

## How `migrate` decides what to apply

`drizzle.__drizzle_migrations` stores one row per applied migration:
`(id, hash, created_at)`, where `created_at` is the migration's `when` timestamp
from `_journal.json`. `migrate` finds the **max `created_at`** and applies every
migration whose `when` is greater.

## Runbook: reconciling journal drift (`column … already exists`)

If a deploy fails because the schema already has a column the migration tries to
add (usually from a stray `push` or a partially-applied migration):

1. Inspect `drizzle.__drizzle_migrations` vs `drizzle/meta/_journal.json` to find
   which migration is missing a row.
2. If the DDL is genuinely already present, insert the matching row into
   `drizzle.__drizzle_migrations` (id, hash from the journal, `created_at` = the
   migration's `when`) so `migrate` treats it as applied.
3. Re-run `npm run db:migrate` and confirm it reports no pending migrations.
4. Prefer forward-fixing (a new corrective migration) over editing history.

## Seeding

`npm run db:seed` inserts the sample dataset (user "Sam", categories,
transactions) from `src/lib/mock.ts` via `src/db/seed.ts`. It is idempotent —
it deletes the seeded user (cascading to their rows) and re-inserts.
