# Sprout — Implementation Plan & Change Log

Single source of truth for implementation history (per [`AGENT.md`](AGENT.md)).
Newest entries at the top.

---

## Goal

Build the **Sprout** variant of the Budget App design prototype as a
mobile-first web app: **Next.js 16 + React 19 + TypeScript + Tailwind + Drizzle
ORM + Neon Postgres**, deployed to Vercel. Mirror the conventions of the
reference project `navigate-easy`.

Decisions locked with the user:

- Unified Next.js app (not the split Vite+Next of navigate-easy), TypeScript.
- Drizzle + `postgres.js` → Neon; pooled `DATABASE_URL`, unpooled for migrations.
- First pass: **Home screen only**; other tabs are placeholders; local state +
  interactions (runs on mock data before Neon is connected).

---

## 2026-07-04 — Entry 3: push-permission rule + initial local commits

**Why:** User directed: never push without explicit permission; commit locally in
slices. Also fixed a git remote auth mismatch.

**Changed:**

- `CLAUDE.md` — added "Pushing (mandatory)" rule: never `git push` / open PRs
  without explicit user permission; commit locally in small slices freely.
- `AGENT.md` — added matching "Push Permission Rule".
- Saved a memory (`never-push-without-permission`) so it persists across sessions.

**Git remote fix (local only, no push):** the repo remote was
`git@github.com:dnp99/sprout.git`, which resolved to the machine's default SSH key
(GitHub account `dvnp19`) → "permission denied". Repointed the remote to the
existing `github-dnp99` SSH host alias (`git@github-dnp99:dnp99/sprout.git`), which
uses `~/.ssh/id_ed25519_dnp99` → authenticates as `dnp99`. Verified via
`ssh -T git@github-dnp99` → "Hi dnp99!".

**Committed the scaffold locally in slices** (no push — awaiting permission):

1. `chore(config)` — build/lint/test/db config
2. `feat(db)` — schema, client, seed
3. `feat(lib)` — types, format, mock, http, currentUser, transactions domain (+tests)
4. `feat(api)` — summary & transactions routes
5. `feat(home)` — Home screen, tab bar, add-expense sheet, state store, app shell
6. `docs` — CLAUDE/AGENT/DEPLOYMENT/docs, plan, tooling (husky, CI, scripts), README

**Verification:** lint + test + build were green as of Entry 2; commits ran the
Husky pre-commit gate (lint-staged + tests) on src-touching slices.

---

## 2026-07-04 — Entry 2: navigate-easy structure parity + documentation

**Why:** User asked to keep the same project structure/conventions as
navigate-easy, add a `CLAUDE.md`, and "always document everything."

**Added — documentation:**

- `CLAUDE.md` — standing agent brief: documentation rule, Sprout design-system
  rules, money-in-cents rule, pre-push checklist, migration rules, branch
  workflow, stack, and the unified-vs-split structure note.
- `AGENT.md` — mandatory rules: Change Documentation (update `plan.md` every
  session), Branch Workflow, Money Handling (integer cents), Verification.
  (Replaced navigate-easy's PHI rule with a Money Handling rule — no health data
  here.)
- `DEPLOYMENT.md` — unified Vercel + Neon deploy strategy (single project, Neon
  branches per environment, migrate-on-deploy).
- `docs/design-system.md` — Sprout tokens, typography, components, layout, money
  display.
- `docs/er-diagram.md` — users / categories / transactions ER diagram + rules.
- `docs/database-migrations.md` — Drizzle+Neon authoring flow, auto-migration,
  journal-drift runbook, seeding.
- `plan.md` — this file.

**Added — tooling (navigate-easy parity):**

- `scripts/check-es-compat.mjs` — flags newer-lib APIs; wired into `lint`.
  (Kept `trimEnd/trimStart/isFinite/isNaN`; dropped navigate-easy's `.includes`
  restriction since our target is ES2022 where it is safe.)
- `scripts/migrate-on-deploy.mjs` — applies migrations on Vercel prod/preview
  builds; skips local; fails loudly without a DB URL.
- `.husky/pre-commit` — prettier+lint on staged `src/`, then unit tests.
- `.github/workflows/ci.yml` — single `Lint · test · build` job on PR/push.
- `.github/CODEOWNERS` — `@dnp99`.
- `package.json` — added `husky`, `lint-staged`; scripts `prepare` (husky),
  `check:es-compat`; `lint` now runs ESLint + es-compat.
- `vercel.json` — `buildCommand` now runs `migrate-on-deploy.mjs` before build.

**Intentional deviations from navigate-easy (documented):** unified app (no
`frontend/`+`backend/` split); no `shared/` (types live in `src/lib/types.ts`);
no `.idea/`; single-package Husky/CI instead of per-workspace.

**Verification:**

- `npm run lint` → clean (ESLint + `check:es-compat`, no violations).
- `npm test` → **9/9 passed**.
- `npm run build` → success; TypeScript clean; all routes compiled.
- Husky installed (`core.hooksPath=.husky/_`); `pre-commit` executable.

---

## 2026-07-04 — Entry 1: project scaffold + Home screen

**Why:** First pass — stand up the app and build the Home screen.

**Added — config:** `package.json`, `tsconfig.json`, `next.config.ts`,
`postcss.config.mjs`, `tailwind.config.ts` (Sprout tokens), `.gitignore`,
`.env.example`, `.prettierrc`, `eslint.config.mjs` (flat config via
`eslint-config-next` v16), `vitest.config.ts`, `drizzle.config.ts`,
`vercel.json`.

**Added — database layer:** `src/db/schema.ts` (users, categories, transactions
— money as signed cents), `src/db/index.ts` (Drizzle + postgres.js client),
`src/db/seed.ts` (seeds the mock dataset).

**Added — domain/lib:** `src/lib/types.ts`, `src/lib/format.ts` (+ test),
`src/lib/mock.ts` (prototype dataset for "Sam"), `src/lib/http.ts`,
`src/lib/currentUser.ts`, `src/lib/transactions/{repository,dto,validation}.ts`
(+ `validation.test.ts`).

**Added — API routes:** `GET /api/summary`, `GET|POST /api/transactions`.

**Added — UI:** `src/app/{layout,page,globals.css}` (Bricolage + Figtree fonts),
`src/state/store.tsx` (client store: local state + `addExpense` interaction),
`src/components/AppShell.tsx`, `TabBar.tsx`, `Placeholder.tsx`,
`ui/ProgressBar.tsx`, `home/HomeScreen.tsx`, `home/AddExpenseSheet.tsx`.

**Behavior:** Home renders from the store (greeting, safe-to-spend, budget card,
4 category bars, 5 recent transactions). The ＋ FAB opens a quick-add sheet that
updates safe-to-spend, spent, and the category bar live. Other tabs are
friendly placeholders. Runs on mock data with no DB.

**Verification:**

- `npm test` → **9/9 passed**.
- `npm run build` → success; TypeScript clean; routes `/`, `/api/summary`,
  `/api/transactions` compiled.
- `npm run lint` → clean (after switching from `next lint` to ESLint flat
  config).
- Runtime smoke test (on `PORT=3210`, since 3000 was busy): Home renders all
  expected content; `/api/summary` returns 500 without `DATABASE_URL` (expected —
  UI uses the local store).
