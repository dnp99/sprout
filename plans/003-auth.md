# 003 — Authentication (multi-user)

**Status:** 🏗️ In progress · **Created:** 2026-07-05

## Goal

Turn Sprout from a single hardcoded test user into a real **multi-user** app:
email + password **sign-up / login**, cookie **sessions**, and per-user data
isolation — so two people (different banks) each have their own private account.
This unblocks CSV import + Plaid, which must attach data to the logged-in user.

The data model is already **`user_id`-scoped end to end**, the **auth/onboarding
UI is built**, and the app **opens on login** — so this is mostly wiring.

## Approach

Mirror the reference project (`navigate-easy` `src/lib/auth/*`): bcrypt password
hashing + opaque session tokens in an httpOnly cookie, looked up server-side.

## Schema changes

Follow the migration runbook (generate + migrate against **develop**; never
hand-write / never `push`). Update `docs/er-diagram.md` after.

```
users  — add:
  password_hash   text?     -- nullable (existing seed user has none until set)

sessions  — new table:
  id          uuid PK default random
  token       text unique not null      -- random opaque token; stored in the cookie
  user_id     uuid FK -> users (ON DELETE CASCADE)
  expires_at  timestamptz not null
  created_at  timestamptz default now
```

Seed: give the demo user a known password hash so you can log in as Sam.

## Auth lib (`src/lib/auth/*`)

- `password.ts` — `hashPassword` / `verifyPassword` (bcryptjs).
- `session.ts` — token generation, cookie name/flags (httpOnly, secure,
  sameSite=lax, ~30-day expiry), serialize/parse.
- `sessionRepository.ts` — create / find-by-token (join user, check expiry) /
  revoke / cleanup expired.
- `currentUser.ts` — **replace** the "first user" resolver with one that reads
  the session cookie → user, or `null`.

## API routes (`src/app/api/auth/*`)

- `POST /signup` — validate, hash password, create user, start session, set cookie.
- `POST /login` — verify password, start session, set cookie.
- `POST /logout` — revoke session, clear cookie.
- `GET /me` — current user from session (or 401).

Existing `/api/summary` + `/api/transactions` switch to the session user (401 if
unauthenticated). Reuse `src/lib/http.ts` helpers; validate inputs.

## Client wiring

- `AuthFlow`: sign-up submits `/signup` → onboarding steps → `finishFlow`; login
  submits `/login` → `finishFlow`. Show inline errors on failure.
- Store: on load, `GET /me`; if authed → `flowStep = 'done'` + hydrate data; else
  stay on the login gate. `logout` calls `/logout`.
- Keep the onboarding steps (income/cats/goal) as cosmetic for now.

## Build slices (commit locally per slice, no push)

1. **Schema + migration** — `users.password_hash`, `sessions` table, ER-diagram
   update. ← *this slice*
2. **Auth lib** — password, session, sessionRepository, currentUser (+ tests).
3. **Auth API** — signup / login / logout / me; protect summary + transactions.
4. **Client wiring** — AuthFlow → API, store `GET /me` hydration, logout, errors.
5. **Seed + polish** — demo user password; expired-session cleanup; docs.

`lint` + `test` + `build` green per slice (verification rule). No push until
approved.

## Non-goals (later)

OAuth/social login, password reset email, email verification, rate limiting
(nice-to-have), remember-me. Keep v1 to email+password + sessions.
