# Local development on this Mac

Checkout: `~/projects/sprout`, branch `develop`.

## Start

Double-click `start-local.command` in Finder, or run:

```sh
cd ~/projects/sprout
./start-local.command
```

Open http://localhost:3000. Keep the terminal open; Control-C stops Next.js.
The PostgreSQL server remains available for later runs.

The launcher uses Homebrew Node.js 22 and PostgreSQL 17. Node 22 meets Next.js's
runtime requirements; `.nvmrc` still records the repository's Node 20 preference.
For manual npm commands on this Mac, first run:

```sh
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"
```

## Demo login

The repository's sample account is `sam@sprout.money` / `password123`.
It was seeded once into the new empty local database during setup.
You can also create a separate local account through signup.

## Database and secrets

This checkout uses its own PostgreSQL cluster in `.local/postgres`, listening
only on `127.0.0.1:55432`. Its database and role are both named `sprout_dev`.
Local connections over TCP use a generated password stored in ignored
`.env.local`; Unix socket connections are confined to `.local/run` under the
private `.local` directory. Neither URL points to Neon or production.

The existing Drizzle migrations have been applied. No schema changes or new
migration files were needed. Never rerun the seed command casually: the upstream
seed script deletes and recreates the demo account and its data.

`.local/` and `.env.local` are ignored by Git. Preserve the database directory.
Optional AI categorization, analytics, password-reset email, and WhatsApp are
not configured; those integrations require their own service credentials.

To stop PostgreSQL explicitly:

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D .local/postgres stop -m fast
```

Dependencies were installed from `package-lock.json` with `npm ci`.
No remote push or deployment is part of this local setup.
