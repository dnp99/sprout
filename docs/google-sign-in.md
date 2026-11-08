# Google sign-in

Google sign-in is optional on the shared login/signup gate, covering desktop,
mobile browsers and installed PWAs. It uses a full-page authorization-code
redirect rather than a popup/third-party browser session. It requests only
`openid email profile`; access/refresh tokens are not persisted and no Google
Drive, Gmail, Calendar or financial-account permissions are requested.

## Configuration

Create a **Web application** OAuth client in Google Cloud / Google Auth Platform.
Configure branding, audience and test users while the consent screen is in
Testing. Add this exact authorized redirect URI:

- Production: `https://sprout-money.ca/api/auth/google/callback`
- Local development: `http://localhost:3000/api/auth/google/callback`

Use separate clients for local and production. `127.0.0.1` and `localhost` are
separate origins: register the precise URI and open Sprout at that same origin.
Set these server environment variables (never commit their values):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AUTH_ORIGIN`: exact trusted origin, no trailing slash; HTTPS required
  in production. Local HTTP loopback is accepted only outside production.

Run generated migrations before enabling these variables. Restart/redeploy after
configuration. The gate queries a no-store public boolean configuration endpoint;
the button is hidden when credentials are absent. No secrets reach the client.

## Security and account behavior

A ten-minute HMAC-authenticated, HTTP-only, SameSite=Lax cookie binds state, nonce and a PKCE verifier
to the initiating browser. Production uses Secure and the `__Host-` prefix.
Callbacks consume this cookie before exchanging the authorization code. The
Google library validates the ID token signature, issuer, audience and expiry;
Sprout additionally requires verified email, a subject and the expected nonce.
Redirect destinations come only from the configured origin; there is no caller
return URL. Errors are generic and tokens/provider payloads are never logged.

`users.google_subject` uniquely identifies the Google account. A matching subject
signs into its existing Sprout account, regardless of a changed Google email.
A new subject provisions a new account and starter category tree atomically.
An existing matching email is **not automatically linked**: use the existing
password login. Existing users can link Google under Account → Security → Link Google account.
This requires a fresh current-password proof followed by a verified Google account
with the same email. Never relax this to email-only automatic account merging.

Google-only accounts have no password hash. Forgot password can establish a
password through the existing email-token proof, enabling password-protected
account actions such as deletion. Legacy seed accounts without either credential
remain excluded. Password login, password reset and session revocation otherwise
retain their existing behavior. Google sign-out is not global Google logout;
Sprout logout revokes only the Sprout session.

## Validation and rollout

Unit/route tests cover state expiry/mismatch, malformed flow cookies, trusted
origin configuration, nonce/email claims, PKCE exchange and normal session issue.
A live Google consent flow requires real client credentials and an authorized
redirect URI. Before enabling production, test new users, returning users,
cancellation, existing-email collision, password establishment, local/production
redirect origins and iOS/Android installed-PWA round trips. Browser cookie sharing
between installed PWAs and the system browser varies by platform; physical-device
verification is required. No production configuration or deployment is automatic.

References: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect),
[server-side ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## Linking existing accounts

`GET /api/auth/google/link` exposes configured/linked booleans only to the signed-in
user. `POST` requires the configured same Origin, a valid Sprout session and the
current password. It then starts the shared PKCE/state/nonce flow with a linking
intent bound to the user ID and SHA-256 of that exact opaque session token. The
password and raw session token are never placed in the flow cookie or OAuth URL.
The server authenticates the flow metadata with HMAC-SHA256 using the server-only
client secret, preventing browser-edited cookies from forging a re-authenticated
link intent. Changing that secret invalidates pending flows.

The callback re-resolves the current session and verifies that binding before
linking. Logout, account switching, revocation or session rotation therefore fails
closed. Linking updates only `users.google_subject`; the password, user ID, group
memberships and financial records remain untouched. A row lock prevents concurrent
replacement of an existing Google identity, and the unique subject constraint
prevents one Google account from belonging to multiple Sprout accounts. Email
mismatch, a conflicting identity and provider cancellation leave the link unchanged.
There is no automatic account merge or unlink/replace action.

The callback returns to a validated originating ledger pathname, preserving Personal
or Group mode. The common app shell shows translated success/error feedback and
removes the transient result query parameter. Security settings report the linked
state after a fresh server read. The linked confirmation uses a padded, bordered
primary-soft surface with medium-weight primary text and a non-shrinking green
check icon so wrapped translations remain easy to scan. Both mobile and desktop
use the same panel and semantic theme tokens. No new database migration is required.

Regression tests cover same-origin/password/session requirements, malformed intents,
open-redirect rejection, expired/switched/rotated sessions, same-email enforcement,
subject ownership conflicts, idempotent linking and unchanged sign-in provisioning.
Live consent and installed-PWA round trips still require physical-device verification.

Implementation validation: lint and production build passed; the full suite passed
814 tests (50 integration/environment skips). The group-directory return destination
also has a focused regression check. Live Google linking and the six-theme physical
mobile/PWA matrix have not been exercised; no real account was linked during tests.

## Authentication page presentation

Login and signup share a compact responsive card with persistent credential labels,
semantic theme surfaces, and a separated Google/email choice. Empty email fields
do not show invalid-address feedback on blur, and auth pages do not automatically
open the mobile keyboard. Provider return messages appear in a bounded notice.

`public/google-logo.png` is Google’s official multicolor G from
https://developers.google.com/static/identity/images/g-logo.png, used unchanged
on a white logo backing in accordance with the
[Google branding guidelines](https://developers.google.com/identity/branding-guidelines).
Brand artwork retains its original colors; surrounding controls use Sprout tokens.

### Linking failure feedback

The authenticated link POST distinguishes expired sessions, password mismatch,
accounts without a password, and rejected origins using fixed response codes.
Origin validation and fresh password verification remain mandatory. The form
reads native FormData so Safari/password-manager autofill does not depend on
React change events, and offers a password visibility toggle. Autofill colors
use the active surface (`--bg`) and text (`--fg`, the `text-ink` mapping) tokens.
Both masked dots and revealed autofilled text retain the active theme's contrast;
the caret uses that same text token. Generic network/server failures retain a
neutral retry message; no password or session contents are logged.
