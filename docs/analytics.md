# Onboarding analytics

Sprout measures the **activation funnel** — how far new users get from signup to
an active budget — using [PostHog](https://posthog.com). This implements slice 6
of [`plans/007`](../plans/007-signup-and-onboarding-ux.md).

Because Sprout holds financial data, the integration is deliberately minimal and
privacy-first. The whole surface lives in
[`src/lib/analytics.ts`](../src/lib/analytics.ts); nothing else imports
`posthog-js` directly.

## Setup

Set two env vars (see [`.env.example`](../.env.example)):

```
NEXT_PUBLIC_POSTHOG_KEY="phc_..."          # project key from PostHog
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"  # optional; defaults to US cloud
```

**Without `NEXT_PUBLIC_POSTHOG_KEY`, analytics is a complete no-op** — the SDK is
never even imported, and no events are sent. So local dev and un-configured
deploys send nothing by default. Add the key to Vercel's env for the environment
you want to measure.

## Privacy stance

- **Opt-in by env** — see above.
- **No autocapture, no session recording.** We never scrape the DOM, so dollar
  amounts, merchant names, and emails are never swept up. Only the explicit
  events below are sent.
- **Identify by user id (UUID) only** — never email or name.
- **Non-sensitive event props only** — never money, merchant, or category names.
- **Respects Do Not Track**, and only builds person profiles for identified
  (signed-in) users.

> Not yet included (out of scope for this first pass): a cookie/consent banner.
> If Sprout ships to a jurisdiction that requires opt-in consent for analytics,
> gate `initAnalytics()` behind that consent before enabling the key in prod.

## Events

| Event | Fired when | Props |
| --- | --- | --- |
| `signup_completed` | account created (top of funnel) | — |
| `budget_set` | monthly budget goes from unset (`0`) to a real value | — |
| `transaction_added` | a transaction is saved | `mode` (`expense`/`income`), `first` (`"true"`/`"false"`) |
| `activation_item_clicked` | a "Get started" checklist row is tapped | `item` (`budget`/`txn`/`recurring`/`goal`) |

Users are tied to events via `identifyUser(userId)` on signup, login, and
returning-session bootstrap; `resetAnalytics()` clears the identity on logout.

## Building the funnel in PostHog

The core drop-off view is a funnel over, in order: `signup_completed` →
`budget_set` → `transaction_added`. `activation_item_clicked` (broken down by
`item`) shows which prompts drive those conversions. "Return session" can be read
from PostHog's built-in first-seen/returning metrics on identified users.
