# Password recovery

Sprout’s signed-out recovery flow is available at `/forgot-password`. It always
shows the same confirmation message so a requester cannot discover whether an
email address has an account.

## Security model

- Reset links contain a random 256-bit token and expire after 30 minutes.
- Only the SHA-256 hash of the token is stored. A new request invalidates older
  unused links for the same account.
- Consuming a valid link updates the bcrypt password hash and revokes every
  active session in one database transaction.
- Requests are limited by hashed normalized email (3 per 15 minutes) and hashed
  client IP (8 per 15 minutes). The generic success response is retained even
  when a request is limited.
- If email delivery fails, the newly-created token is invalidated and the server
  records an operational error without logging the token.

## Production configuration

The mail adapter uses Resend’s HTTPS API. Configure these Vercel Production
environment variables, then redeploy:

| Variable              | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY`      | Resend API key permitted to send from the configured domain.     |
| `PASSWORD_RESET_FROM` | Verified sender, for example `Sprout <support@sprout-money.ca>`. |
| `NEXT_PUBLIC_APP_URL` | Canonical HTTPS application origin used in reset links.          |

Resend must have the sending domain verified. In development, email delivery is
deliberately skipped and logged without including a reset URL or token.

## Verification and operations

1. Request a reset for a staging account and verify the response does not change
   for an unknown email.
2. Confirm the email link expires after 30 minutes, works once, and that an
   earlier link fails after requesting a replacement.
3. Confirm every signed-in device is redirected to login after a successful
   reset.
4. Monitor server logs for the generic `POST /api/auth/password/forgot email
delivery failed` event. Do not log or share raw reset links.

The schema change is deployed through the generated Drizzle migration. Do not
use `drizzle-kit push` against a shared database.
