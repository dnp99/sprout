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

A ten-minute HTTP-only, SameSite=Lax cookie binds state, nonce and a PKCE verifier
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
password login. Linking an existing password account is not exposed in this
initial integration and requires a separate authenticated linking flow. Never
relax this to email-only automatic account merging.

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
