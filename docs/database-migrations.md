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

- **Production Vercel deploys:** `vercel.json` runs
  `node scripts/migrate-on-deploy.mjs && next build`. Only
  `VERCEL_ENV=production` may run `drizzle-kit migrate`; preview and local
  builds skip before inspecting database credentials. Migrations remain
  idempotent and a migration failure prevents production deployment.
- Automatic Git deployments are restricted to `main` through
  `git.deploymentEnabled` (`**: false`, `main: true`). Vercel's Preview
  environment Branch Tracking is also disabled in the project dashboard.
  Manual CLI/API preview deployments remain possible but do not migrate.
- Production uses `DATABASE_URL_UNPOOLED` (preferred, direct Neon connection)
  or `DATABASE_URL`. Local development retains its independent database.
- Neon preview branching is configured separately in the Vercel Storage
  integration; disable Preview connections/branch creation there. Blocking
  builds alone is not a substitute for checking integration provisioning.
  Existing databases/deployments are not deleted by this configuration.

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
transactions, goals, recurring items) defined in `src/db/seed-data.ts` via
`src/db/seed.ts`. It is idempotent — it deletes the seeded user (cascading to
their rows) and re-inserts.
