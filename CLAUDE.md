# Sprout — Claude Instructions

Sprout is a friendly, mobile-first personal budgeting app. This file is the
standing brief for any coding agent working in this repo. Read it first, every
session.

## Documentation Rule (mandatory)

**Always document everything.** See [`AGENT.md`](AGENT.md) for the full rule. In
short:

1. New concepts, schema, or flows get a doc under [`docs/`](docs/). Keep
   [`docs/er-diagram.md`](docs/er-diagram.md) in sync with `src/db/schema.ts`.
2. Public functions and non-obvious logic get comments explaining **why**, not
   what. Match the surrounding comment density.
3. Plans for upcoming work go in [`plans/`](plans/) (roadmap, feature designs,
   build plans). `docs/` describes how the system *is*; `plans/` describes what
   we intend to build. The root `README.md` stays an evergreen overview of what
   Sprout is — not a status log.

## Design System (mandatory)

**Always follow the design system.** Full spec:
[`docs/design-system.md`](docs/design-system.md). The look is **Sprout** —
friendly & playful.

Key rules enforced every session:

1. **Tokens live in `tailwind.config.ts`.** Never hard-code hex colors in
   components — use the semantic Tailwind tokens (`bg-bg`, `text-ink`,
   `text-muted`, `bg-primary`, `bg-card`, `bg-track`, `text-green`, …). The one
   exception is a category's own accent color, which is dynamic per-row data and
   passed via `style`.
2. **Money is always integer cents** end-to-end (DB, state, API). Only
   `formatMoney()` in [`src/lib/format.ts`](src/lib/format.ts) converts cents to
   display strings. Never do `amount / 100` math in a component.
3. **Fonts:** headings/UI in `font-display` (Bricolage Grotesque), body in
   `font-sans` (Figtree). Both are wired via `next/font` in `layout.tsx`.
4. **Surfaces:** app canvas is `bg-bg` (warm cream); cards are `bg-card` (white)
   with generous radii (`rounded-card` / `rounded-pill`). The budget hero uses
   the dark `bg-surface`.
5. **Weights are heavy** — the Sprout look leans on `font-bold` / `font-extrabold`.
6. **Mobile-first.** The app renders inside a centered `max-w-app` (480px)
   column with a sticky bottom tab bar. Touch targets ≥ 44px.
7. **Emoji as category icons** — categories carry an `emoji` field; use it rather
   than icon components for category/transaction rows.

## Data model & money

- Schema: [`src/db/schema.ts`](src/db/schema.ts) — `users`, `categories`,
  `transactions`. Money columns are signed integer **cents** (negative =
  expense, positive = income).
- Domain logic lives in `src/lib/<domain>/{repository,dto,validation}.ts` with a
  colocated `*.test.ts` (Vitest). Keep this shape when adding domains.
- API routes are thin: validate → call repository → return via the
  [`src/lib/http.ts`](src/lib/http.ts) helpers.

## Code hygiene (mandatory)

Keep files small and logic DRY.

1. **~500-line ceiling.** When a file grows past ~500 lines (or is clearly doing
   too much before then), refactor it — split a large component into smaller
   components, extract a hook, or move logic into `src/lib`. Prefer many focused
   files over one big one.
2. **Always extract common logic.** Never copy-paste a block of logic — pull
   repeated or reusable code into a shared helper (`src/lib/...`), a hook, or a
   small component, and call it from both places. Do this the moment you'd write
   the same thing twice.
3. Helpers are pure and unit-tested where practical (colocated `*.test.ts`);
   components stay presentational and read data from the store.

## Pushing (mandatory)

**Never `git push` without the user's explicit permission.** Commit locally as
much as needed (in small, logical slices), but pushing to any remote is always a
separate, user-approved step. Do not push, force-push, or create/update PRs on
the user's behalf unless they explicitly ask in that message.

## Pre-push checklist (mandatory)

Once the user has approved a push, run these first and fix any failures:

```sh
npm run lint    # ESLint + ES compatibility check
npm run test    # Vitest unit tests
npm run build   # Next.js production build (also type-checks)
```

Never push with failing lint, tests, or build.

## Database migrations (mandatory)

Never hand-write Drizzle migration files — `drizzle-kit` chains snapshot hashes
and silently skips hand-crafted files. Workflow for every schema change:

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` — diffs against the live DB and writes the SQL +
   properly-chained snapshot. Requires a live `DATABASE_URL_UNPOOLED`; if the
   environment doesn't have one, ask the user to run it.
3. `npm run db:migrate` — applies pending migrations.

**Never run `drizzle-kit push`** on a shared DB — it desyncs the journal. Always
generate + migrate. Migrations auto-apply on Vercel builds via
`vercel.json` → `scripts/migrate-on-deploy.mjs`. Full runbook:
[`docs/database-migrations.md`](docs/database-migrations.md).

## Branch workflow (mandatory)

Never work from a stale branch or commit directly to `main`. Start every change
from a fresh branch off updated `main` — see [`AGENT.md`](AGENT.md).

## Stack

- **App:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Data:** Drizzle ORM + `postgres.js` → Neon Postgres
- **Tests:** Vitest
- **Hosting:** Vercel (app) + Neon (database) — one unified project

## Structure note

The reference project (navigate-easy) splits into `frontend/` (Vite) +
`backend/` (Next API). Sprout is intentionally a **single unified Next.js app**
(chosen for the simplest Vercel+Neon deploy), but mirrors navigate-easy's
conventions: `src/app` / `src/db` / `src/lib/<domain>` layout, docs footprint,
CI, Husky, and the documentation discipline above.
