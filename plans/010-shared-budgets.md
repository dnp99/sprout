# 010 — Shared budgets (spaces)

**Status:** Draft · **Created:** 2026-07-09

## Outcome

Let two or more people share one budget — a household/couple/roommate "space"
with shared categories, transactions, accounts, goals, and bills. This is
Sprout's **structural growth loop**: budgeting is usually a shared activity, so
every serious user wants to pull in a partner, and every invite arrives
**pre-activated** (their space is already set up). No other feature makes existing
users recruit new ones.

## The core reshape: user-owned → space-owned

Today "a budget" *is* a user — `categories`, `transactions`, `accounts`, `goals`,
`recurring_items`, and `merchant_rules` all hang off `user_id`
([`schema.ts`](../src/db/schema.ts)). Sharing requires inserting a **space** layer
between the user and their data (chosen over a per-row grant model, which only
models "access to someone else's budget," not a joint one).

**Decisions (locked in discussion):**

- **Spaces own the data.** Re-parent the six tables from `user_id` → `space_id`.
- **Every user gets a personal space** on migration (backfill) and on signup, so
  **solo users never notice** — they just have a space of one.
- **Attribution kept.** `transactions.created_by` records *who* logged a row even
  though the space owns it (couples want "who paid"). A pooled view is a display
  toggle, not a schema change.
- **N members**, UI aimed at 2–4. Modeling many costs nothing over couples-only.
- **Invite via one-time code / link** (piggybacks on the WhatsApp channel in plan
  008); email invite is a fast-follow.
- **Two roles:** `owner` (created it; manage members, delete space) and `member`
  (full read/write on budget data). No per-category permissions in v1.

## Model

```
spaces
  id            uuid pk
  name          text                       -- "Our budget" / "The Flat"
  budget_pool_cents  integer               -- moves off users (it's a space-level budget)
  budget_cycle  text default 'monthly'     -- likewise
  created_by    uuid -> users
  created_at / updated_at

space_members
  id            uuid pk
  space_id      uuid -> spaces (cascade)
  user_id       uuid -> users  (cascade)
  role          text                       -- 'owner' | 'member'
  created_at
  unique (space_id, user_id)

space_invites
  code          text pk                     -- short, shareable ("SPRT-JOIN-7Q2K")
  space_id      uuid -> spaces (cascade)
  invited_by    uuid -> users
  role          text default 'member'
  expires_at    timestamptz
  accepted_at   timestamptz?
  created_at

-- Re-parent (drop user_id, add space_id -> spaces, cascade):
categories, transactions, accounts, goals, recurring_items, merchant_rules
  - user_id
  + space_id    uuid -> spaces (cascade)

transactions
  + created_by  uuid -> users               -- attribution; who logged the row

users
  - budget_pool_cents, budget_cycle         -- these become space-level
  (currency can stay per-user for display, or move to space — see open Qs)
```

The unique index on `merchant_rules (user_id, pattern)` and the partial
`transactions (user_id, external_id)` index both re-key to `space_id`.

## Migration & backfill — where the risk lives

This is a schema-wide migration; the backfill is the dangerous part and must be
**idempotent** and tested against the live DB. Follow the runbook in
[`docs/database-migrations.md`](../docs/database-migrations.md) — edit
`schema.ts` → `npm run db:generate` (needs `DATABASE_URL_UNPOOLED`) →
`npm run db:migrate`. **Never `drizzle-kit push`.**

Backfill steps (one migration, ordered):

1. Create `spaces` / `space_members` / `space_invites`.
2. For each existing user: insert a personal space (`name` = "My budget",
   copy `budget_pool_cents` / `budget_cycle` off the user), add the user as
   `owner` in `space_members`.
3. Add nullable `space_id` to the six tables; set each row's `space_id` to its
   owner's personal space (join through the old `user_id`). Add `created_by` to
   `transactions` = old `user_id`.
4. Make `space_id` NOT NULL, add FKs + re-keyed indexes, drop the old `user_id`
   columns (and the now-unused `users.budget_pool_cents` / `budget_cycle`).

Because `db:generate` diffs the live DB, the data-moving steps (2–3) likely need a
**hand-authored data migration** invoked from the generated SQL or a companion
script — call it out and test on the `develop` Neon branch first. Keep
[`docs/er-diagram.md`](../docs/er-diagram.md) in sync.

## App layer

### Active space in the session

- A user can belong to multiple spaces; the session needs a **current space**.
  Add `active_space_id` to the session (or a `users.last_active_space_id`), default
  = the user's personal space. `getSessionUser` gains the active space + the
  user's role in it.
- **Every repository query** flips `where user_id = …` → `where space_id =
  activeSpaceId`, after asserting the user is a member of that space
  (authorization). Extract a `requireSpaceMember(userId, spaceId)` guard so this
  isn't copy-pasted (code-hygiene rule 2). This is the bulk of the mechanical work
  — every domain repository is touched.

### Spaces domain — `src/lib/spaces/`

`{repository, dto, validation}.ts` + tests, matching the house domain shape:

- `createSpace`, `listSpacesForUser`, `renameSpace`, `deleteSpace` (owner only).
- `createInvite(spaceId, role)`, `acceptInvite(code, userId)` (validates/expires
  the code, adds `space_members`, burns it), `listMembers`, `removeMember`
  (owner only), `leaveSpace`.
- Role checks live here; API routes stay thin via `src/lib/http.ts`.

### API — `src/app/api/spaces/*`

`POST /api/spaces`, `GET /api/spaces`, `PATCH/DELETE /api/spaces/[id]`,
`POST /api/spaces/[id]/invites`, `POST /api/spaces/join` (redeem a code),
`GET /api/spaces/[id]/members`, `DELETE /api/spaces/[id]/members/[userId]`,
and `POST /api/spaces/active` (switch current space).

### State + UI

- Store holds `spaces`, `activeSpaceId`, `activeRole`; a `setActiveSpace` action
  re-fetches budget data for the new space (subscribe with selectors — see
  [`docs/state-management.md`](../docs/state-management.md)).
- **Space switcher** in the sidebar (web) / header (mobile) when a user has >1
  space; hidden for solo users so nothing changes for them.
- **Members screen** (Settings): list members + roles, invite (show/copy the code
  or link), remove, leave.
- **Attribution UI:** transaction rows can show a small "by \<member\>" when the
  space has >1 member; a "who paid" filter and an optional pooled/by-person toggle
  on reports. Keep subtle per the design system (rule 6 — chrome stays quiet).

## New / touched files

```
src/db/schema.ts                      + spaces, space_members, space_invites; re-parent 6 tables; created_by
drizzle/ (generated) + backfill       schema-wide migration + idempotent data backfill
src/lib/spaces/{repository,dto,validation}(.test).ts   spaces domain + role guards
src/lib/auth/currentUser.ts           resolve active space + role
src/lib/**/repository.ts              user_id -> space_id across every domain (via requireSpaceMember)
src/app/api/spaces/**                 space + invite + member + switch routes
src/state/store.tsx                   spaces, activeSpaceId, activeRole, setActiveSpace
src/components/**                      space switcher, members/invite screen, attribution bits
docs/spaces.md                        the standing doc for the space model
docs/er-diagram.md                    keep in sync
```

Watch the ~500-line ceiling as repositories grow; extract the membership guard and
any shared space-scoping helper rather than inlining it per query.

## Sequencing

1. **Schema + backfill** on the `develop` Neon branch — the hardest, riskiest
   step. Verify solo users' data is intact and space-scoped before anything else.
2. **Space-scope the repositories** behind `requireSpaceMember`, active space =
   personal space. At this point the app behaves *identically* for everyone — no
   sharing yet, but everything runs through spaces. Ship/validate this as its own
   slice; it de-risks the rest.
3. **Spaces domain + API** — create/rename/delete, members, invites, join, switch.
4. **UI** — switcher, members/invite screen, attribution.
5. **Docs** — `docs/spaces.md`, update `er-diagram.md`; flip this plan to Complete.

Slice 2 is the safety valve: the whole reshape lands and is verified with **zero
behaviour change** before any sharing surface exists.

## Open questions

1. **Currency** — stays per-user (display only) or moves to the space? A shared
   budget with mixed member currencies is incoherent, so probably **space-level**;
   confirm.
2. **Round-ups / goals attribution** — round-up sweeps and goal contributions are
   space-level now; do we attribute who swept, or leave it pooled? (Lean pooled —
   goals are shared.)
3. **Invite delivery** — v1 is a copyable code/link; do we wire the WhatsApp
   channel (plan 008) to send it directly, or keep that a fast-follow?
4. **Leaving / deleting a space** — what happens to a personal space's data if the
   owner deletes it? (Guard: a user's *last* space can't be deleted; block it.)
5. **Per-category permissions** — explicitly out of scope for v1; revisit only if
   roommates ask for private categories.
```
