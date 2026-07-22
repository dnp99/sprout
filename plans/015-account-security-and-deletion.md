# 015 — Account security & deletion

**Status:** Planned · **Created:** 2026-07-22

## Outcome

Give users real, self-serve control over their account from **Settings →
Security**, and make the Data & Deletion promise something they can act on
in-app instead of by emailing support:

- **Change password** — verify the current password, set a new one, and sign out
  other devices.
- **Sign out everywhere** — revoke all other sessions from one place.
- **Delete account** — a confirmed, re-authenticated, irreversible hard delete of
  the user and all their data, then sign-out.
- **Two-factor auth (TOTP)** — optional app-based 2FA with recovery codes
  (larger; may be split into its own plan — see sequencing).

This finishes what the **Settings "Security" card** already advertises
("Two-factor auth and password changes") and upgrades the **Data & Deletion**
legal page from an email-request flow to genuine self-serve deletion.

## What the app already promises (the contract)

- [`src/lib/legal-pages.ts`](../src/lib/legal-pages.ts) **Data & Deletion**:
  today it says deletion is requested by emailing support ("email support from
  the address associated with your Sprout account. We may need to confirm
  ownership"), and deliberately avoids promising retention periods. Self-serve
  deletion is a strict upgrade; the copy must be updated to describe it.
- **Security Overview** keeps claims "narrow" and "does not describe controls we
  have not verified and documented." So we only add security claims (password
  change, 2FA) to that page **after** each ships and is tested.
- Settings **Security** coming-soon card:
  [`Settings.tsx`](../src/components/web/views/Settings.tsx) → `security` /
  `securityDesc`.

## What already exists to build on

- **Passwords:** bcrypt via [`password.ts`](../src/lib/auth/password.ts)
  (`hashPassword` / `verifyPassword`). `users.password_hash` is a nullable bcrypt
  hash ([`schema.ts`](../src/db/schema.ts)).
- **Sessions:** opaque tokens in a `sessions` table, `sprout_session` cookie;
  [`sessionRepository.ts`](../src/lib/auth/sessionRepository.ts) has
  `createSession` / `findUserByToken` / `revokeSession` /
  `deleteExpiredSessions`; [`session.ts`](../src/lib/auth/session.ts) holds the
  cookie helpers; [`currentUser.ts`](../src/lib/auth/currentUser.ts) resolves the
  logged-in user.
- **Cascade deletes:** every user-scoped table — transactions, categories,
  goals, recurring, accounts, merchant_rules, api_tokens, whatsapp links, and
  `sessions` — is `references(() => users.id, { onDelete: "cascade" })`. So
  deleting the `users` row removes everything in one statement. (The plan still
  adds a test that asserts zero residual rows, and audits any FK that is *not*
  cascade before relying on it.)
- **Auth routes:** `api/auth/{signup,login,logout,me}` and a `/logout` page —
  the patterns to mirror for the new endpoints.

## Product decisions

- **Change password:** require the current password; validate the new one with
  the same rules as signup (reuse [`validation.ts`](../src/lib/auth/validation.ts));
  re-hash with bcrypt; on success **revoke every other session** (keep the
  current one) so a stolen session elsewhere is cut off. No email step in v1.
- **Delete account:** **immediate, irreversible hard delete** (no soft-delete or
  grace period — matching the legal page's "remove from active product use" and
  its refusal to promise retention we don't operationalize). Gate it with
  **re-authentication** (current password) **and** a typed confirmation
  (`DELETE`). One cascade delete of the `users` row; then revoke all sessions,
  clear the cookie, and redirect to a public confirmation.
- **Re-auth model:** password is re-entered **at the moment** of the sensitive
  action (change-password, delete). No stored "sudo" window in v1 — simpler and
  safe.
- **Sessions:** add "sign out of all other devices." A full active-session list
  (device/last-seen) is a later refinement; v1 ships the one-tap revoke-others.
- **2FA (TOTP):** optional, app-based (RFC 6238), with **10 single-use recovery
  codes**. Enrolling requires verifying a live code; the TOTP **secret is
  encrypted at rest** (app key) and recovery codes are stored **bcrypt-hashed**.
  When enabled, login requires a second step; disabling requires the password.
  This is the largest piece and needs a migration — it is **Slice 4** and may be
  promoted to its own plan (016) if we want to ship the trust essentials first.
- **Abuse resistance:** the password-verifying endpoints (login, change-password,
  delete, 2FA challenge) get basic **rate limiting**; failures are generic
  ("incorrect password") and never reveal account existence.
- **Scope guard for the agent:** this builds a *user-initiated, confirmed,
  re-authenticated* self-delete flow. The agent never deletes user data directly;
  the destructive action is always the signed-in user's own, behind confirmation.

## Architecture

### Shared

- **`requireReauth(user, password)`** helper (in `src/lib/auth/`) — verify the
  password hash, throwing a typed error the routes translate to a 401/400. Used
  by change-password and delete.
- **`revokeOtherSessions(userId, keepToken)`** and **`revokeAllSessions(userId)`**
  in `sessionRepository.ts` (delete by `user_id`, optionally excluding the
  current token).
- All new endpoints are session-authed (`getSessionUser`), validate input, and
  return via the [`http.ts`](../src/lib/http.ts) helpers — thin routes over
  repository/helper functions, matching house style.

### 1. Change password — `POST /api/auth/password`

`{ currentPassword, newPassword }` → `requireReauth` → validate new (length /
strength via `validation.ts`, and `newPassword !== currentPassword`) →
`hashPassword` → update `users.password_hash` → `revokeOtherSessions(user.id,
currentToken)`. Returns ok; the current session stays valid. No schema change.

### 2. Sessions — `POST /api/auth/sessions/revoke-others`

`revokeOtherSessions(user.id, currentToken)`; used by a "Sign out other devices"
button. No schema change.

### 3. Delete account — `POST /api/auth/delete`

`{ password, confirm }` → `requireReauth` + assert `confirm === "DELETE"` →
`deleteUser(user.id)` (single `delete from users where id = …`, cascades to all
child tables) → `revokeAllSessions` + clear the `sprout_session` cookie → 200.
The client then navigates to a public **"account deleted"** confirmation. No
schema change. Guard the **seed/`null` password-hash** edge: if a user somehow
has no hash, deletion falls back to typed-confirmation-only (documented), but
real signups always have a hash.

### 4. Two-factor auth (TOTP) — schema + flow *(stretch / possibly plan 016)*

- **Schema:** `users.totp_secret` (encrypted, nullable), `users.totp_enabled_at`
  (nullable), and a `recovery_codes` table (`user_id` cascade, bcrypt `code_hash`,
  `used_at`). Generated via `npm run db:generate` + `db:migrate` (needs a live
  `DATABASE_URL_UNPOOLED`; ask the user to run if the env lacks one).
- **Enroll:** `POST /api/auth/2fa/setup` returns a secret + otpauth URI (render a
  QR client-side, no external calls); `POST /api/auth/2fa/enable` verifies a live
  code, stores the encrypted secret + `totp_enabled_at`, and returns the 10
  recovery codes **once**.
- **Login challenge:** when `totp_enabled_at` is set, login returns a "2FA
  required" state; a second step verifies a TOTP or a recovery code before a
  session is issued. Recovery codes are single-use (`used_at`).
- **Disable:** `POST /api/auth/2fa/disable` requires the password; clears secret,
  `totp_enabled_at`, and recovery codes.
- TOTP verify/generate is a small pure module (`src/lib/auth/totp.ts`, RFC 6238,
  unit-tested) or a minimal audited dep — decided at build time.

### UI — Settings → Security

Replace the "Security" coming-soon card with a real **Security** panel (web
[`Settings.tsx`](../src/components/web/views/Settings.tsx) + mobile settings),
using the same account-card / inset-tile design language:

- **Password** row → inline form (current, new, confirm) with validation + a
  success toast.
- **Two-factor** row → status + enable/disable flow (Slice 4).
- **Sign out other devices** → button with a confirm.
- **Delete account** → a destructive `Modal` (typed `DELETE` + password), red
  affordance, an explicit list of what will be removed, and the irreversible
  warning. Mirrors the existing modal/inset patterns.

### Legal copy

- **Data & Deletion:** rewrite "Requesting deletion" to describe **self-serve
  in-app deletion** (Settings → Security → Delete account), keep the third-party
  caveat, and keep the no-retention-promise stance.
- **Security Overview:** add password-change and 2FA to the controls list **only
  after** they ship and are tested (narrow, verified claims).

## Build sequence

Slices 1–3 need **no migration** and deliver the core trust win; ship them first.

### Slice 1 — Change password
Endpoint + `requireReauth` + `revokeOtherSessions`; Security panel password form;
i18n; tests (wrong current password, weak new, same-as-current, other-session
revocation).

### Slice 2 — Session control
`revoke-others` endpoint + "Sign out other devices" button; tests.

### Slice 3 — Delete account
Endpoint + `deleteUser` + cookie/session teardown; destructive modal + public
confirmation page; **update the Data & Deletion legal copy**; tests (re-auth
required, wrong confirm string, full cascade leaves zero residual rows,
post-delete requests are unauthorized).

### Slice 4 — Two-factor auth *(stretch)*
Schema + migration; `totp.ts`; setup/enable/disable + login-challenge endpoints;
enroll/recovery UI; **update the Security Overview copy**. Promote to plan 016 if
we'd rather land Slices 1–3 alone first.

## Test matrix

- **Password:** correct/incorrect current password; new-password validation
  (length, equality with current); other sessions revoked, current preserved.
- **Sessions:** revoke-others deletes siblings, keeps the caller's token.
- **Delete:** requires valid password + `DELETE` confirm; deleting the user
  leaves **no** rows in transactions / categories / goals / recurring / accounts
  / merchant_rules / api_tokens / whatsapp links / sessions; the session cookie is
  cleared and subsequent authed calls 401.
- **2FA:** TOTP verify accepts an in-window code and rejects a stale one;
  recovery code works once then is `used`; disable requires the password; login
  is blocked until the second factor when enabled.
- **Abuse:** repeated wrong-password attempts are throttled; error messages don't
  leak account existence.

## Acceptance criteria

- A signed-in user can change their password, sign out other devices, and delete
  their account entirely from Settings — no email to support required.
- Deletion is irreversible, re-authenticated, confirmed, and provably complete
  (zero residual rows; session invalidated).
- Password change cuts off other sessions.
- 2FA (if shipped in this plan) enrolls, challenges at login, supports recovery
  codes, and can be disabled with the password.
- Legal copy matches the shipped behavior; security claims are only what's built
  and tested.
- New endpoints are session-authed, rate-limited on password checks, and thin
  over unit-tested helpers.

## Out of scope

- Email-based password **reset** (forgot-password) and email verification — a
  separate flow (no transactional-email infra in v1).
- SMS/WhatsApp OTP as a second factor, WebAuthn/passkeys, hardware keys.
- A full device/session inventory with names, geolocation, or per-session revoke.
- Soft-delete, deletion grace periods, or downloadable "final export on delete"
  (export already exists separately).
- Admin-initiated deletion or bulk account tooling.

## Expected files

```text
src/lib/auth/reauth.ts (+ test)              requireReauth(user, password)
src/lib/auth/sessionRepository.ts            revokeOtherSessions / revokeAllSessions
src/lib/auth/validation.ts                   reuse/extend password rules
src/lib/auth/totp.ts (+ test)                RFC 6238 (Slice 4)
src/lib/auth/account.ts (+ test)             deleteUser cascade + residual-rows test
src/app/api/auth/password/route.ts (+ test)  change password
src/app/api/auth/sessions/revoke-others/route.ts
src/app/api/auth/delete/route.ts (+ test)    self-serve delete
src/app/api/auth/2fa/{setup,enable,disable}/route.ts   (Slice 4)
src/app/(public)/account-deleted/page.tsx    post-delete confirmation
src/components/settings/SecurityPanel.tsx    shared Security UI
src/components/web/views/Settings.tsx        swap coming-soon → Security panel
src/components/mobile/screens/…              mobile Security entry
src/db/schema.ts (+ migration)               totp_secret / recovery_codes (Slice 4)
src/lib/legal-pages.ts                       Data & Deletion + Security copy
src/messages/en-CA.json, src/messages/fr-CA.json
docs/auth.md (or docs/security.md)           standing doc for the above
```

`db:generate` + `db:migrate` are only needed for **Slice 4** (2FA). Slices 1–3
touch no schema. Never hand-write the migration — follow
[`docs/database-migrations.md`](../docs/database-migrations.md).

## Open questions

1. **2FA in this plan or plan 016?** Recommendation: land Slices 1–3 first
   (immediate trust win, no migration), then decide 2FA scope.
2. **TOTP secret encryption key** — reuse an existing app secret or add a
   dedicated `ENCRYPTION_KEY` env? (Slice 4 decision.)
3. **Rate-limit store** — in-memory per-instance is weak on serverless; is a
   lightweight DB-backed attempt counter worth it for v1, or acceptable as a
   documented limitation?
