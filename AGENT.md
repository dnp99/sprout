# AGENT.md

Standing rules for any agent (human or AI) working in this repository.

## Documentation Rule (Mandatory)

For this repository, **everything must be documented.**

### Required after each code update

1. If the change introduces or alters a concept, schema, flow, or convention,
   add or update the relevant doc under [`docs/`](docs/). Keep
   [`docs/er-diagram.md`](docs/er-diagram.md) in sync with `src/db/schema.ts`.
2. Comment non-obvious logic (the "why", not the "what"), matching the
   surrounding comment density.
3. Keep `README.md` and `CLAUDE.md` accurate when workflows or structure change.

### Scope

- Applies to app code, config, docs, and infrastructure.
- Applies to all future updates in this project.

## Branch Workflow Rule (Mandatory)

For this repository, work directly on **`develop`**. Never create a feature
branch for new work, and never commit directly on `main`.

### Required branch process before implementing changes

1. Switch to `develop`: `git switch develop`
2. Pull the latest `develop`: `git pull --ff-only origin develop`
3. Do all changes and commits directly on `develop`.
4. If `develop` has unrelated uncommitted work, preserve it and do not create a
   branch as a workaround; ask the user before taking an action that would
   overwrite or conflict with it.

### Recovery if a commit is made on `main`

1. Cherry-pick the commit onto `develop`.
2. Reset local `main` back to `origin/main`.
3. Continue work on `develop`.

## Money Handling Rule (Mandatory)

Sprout deals with money; correctness matters.

1. Store and compute all monetary values as **signed integer cents** (negative =
   expense, positive = income) — never floats.
2. Convert to a display string **only** at the view boundary, via
   `formatMoney()` in `src/lib/format.ts`. Never inline `amount / 100` math or
   ad-hoc currency strings in components.
3. Derived totals (category spent, budget summary) are computed from cents and
   rounded only when formatting.
4. Validate amounts server-side (`src/lib/transactions/validation.ts`) before
   they reach the database.

## Code Hygiene Rule (Mandatory)

Keep files small and logic DRY.

1. When a file grows past **~500 lines** (or is clearly doing too much before
   then), refactor it: split large components into smaller ones, extract a hook,
   or move logic into `src/lib`. Prefer many focused files over one big file.
2. **Always extract common logic** into a shared helper, hook, or component
   instead of duplicating it — the moment you'd write the same block twice.
3. Keep helpers pure and testable (colocated `*.test.ts` where practical).

## Push Permission Rule (Mandatory)

**Never `git push` without the user's explicit permission.** Commit locally in
small, logical slices freely, but pushing to a remote (or creating/updating a PR)
is always a separate step the user must approve in that message. Never
force-push on their behalf.

## Verification Rule (Mandatory)

Once a push is approved, run and pass first: `npm run lint`, `npm run test`,
`npm run build`. Never push red.
