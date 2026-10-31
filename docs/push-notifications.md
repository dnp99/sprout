# Installed-app notifications

Sprout offers two separate opt-ins in Personal and Group Settings:

- New transactions saved by **other** active group members. Imports/copies produce
  one alert for the batch. Edits, retries, settlements and the author's own saves
  do not generate another alert.
- A Sunday evening reminder to add transactions, due from **7 pm in the saved
  local timezone**. The browser's IANA timezone is saved with preferences and
  follows daylight saving. Save preferences again after changing timezone.

Open installed Sprout, select the desired options, then press Enable
notifications. This click requests OS/browser permission; neither installation
nor sign-in requests permission automatically. Blocked permission must be changed
in device/browser settings. Disable on this device removes its server subscription
and browser subscription. Account preferences apply across devices; permission
and subscriptions are device/session specific. All consent UI uses theme tokens
and all four supported locales. Group notifications use the group name as their
title and show the recording member, action, amount and merchant in the body,
including on the lock screen. Notification presentation itself is controlled
by the OS and cannot use Sprout's visual theme.

For example: **The Love Nest** — “Jing added an expense of $23.95 at Farm Boy.”
Income and refund records use their respective action labels. Imports and copies
produce one count-based summary per batch. The actor is the recording member,
not the selected payer. Names come from current account/group settings; amount,
merchant and type come from the current, non-voided ledger entry. Voided or
missing entries are skipped if their alert has not yet been delivered. Blank
merchants omit the merchant phrase; long labels are bounded for push payloads.
Weekly reminder text is unchanged.

## Delivery and authorization

The additive schema in `src/db/notification-schema.ts` stores preferences, Web
Push subscriptions, and a durable per-device outbox. Subscription endpoints and
encryption credentials must be treated as secrets: never log them or return them
in account exports. Authenticated, same-origin APIs validate known push-provider
HTTPS endpoints and keys, limit devices, and derive account/session identity from
the HttpOnly cookie. Existing endpoint credentials are required to rebind a
browser subscription after an account change; registration is always explicit.

A new group activity event enqueues notifications in the **same database
transaction** as the save. Mutation replay therefore cannot add phantom alerts.
Next.js `after()` drains the queue after successful group writes; delivery failures
never undo financial writes. The scheduled endpoint retries pending work. Before
each send, delivery rechecks session expiry, consent and current group membership
and archive state. Revoking/logging out a session cascades its subscriptions and
jobs; deleting an account or group also removes related records. Expired push
endpoints (404/410) are removed automatically.

Workers lease jobs under PostgreSQL row locks, skip locked rows, and retry up to
five times with backoff. Push is **at least once**, not exactly once: a crash after
provider acceptance can repeat a send; a stable notification tag replaces the
previous OS notification. Weekly jobs are unique per device and local Sunday. Group details are resolved
from the committed audit event referenced by the existing outbox dedupe key, only
after recipient authorization; no duplicate financial payload or migration is needed.
Delivery batches are bounded at 100 per run, with ten concurrent network sends
and four-second timeouts. Old work expires after a day; records are cleaned after
30 days. A busy queue or delayed scheduler can delay alerts. Push provider/OS
acceptance is not proof that a person saw a message. Native installed-device
checks are still needed before rollout.

`public/push-sw.js` handles push display and click only. It has **no fetch
handler, caches, financial storage or background mutation queue**. Clicking opens
the group ledger or transactions. It focuses an existing matching page, otherwise
opens a new window so a draft in another window is not navigated away from.
Session/membership checks still apply when opening the destination.

## Deployment setup (required before live delivery)

1. Generate VAPID keys once with `npx web-push generate-vapid-keys --json`.
   Keep the private key private. Set Vercel server environment variables
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a production
   contact URL or `mailto:` address). Never prefix private material with
   `NEXT_PUBLIC_`. Rotate keys only with a subscription migration plan.
2. Set a long random `CRON_SECRET` in Vercel. In GitHub repository Actions
   secrets, set `SPROUT_CRON_SECRET` to the **same** value. Set the repository
   Actions variable `SPROUT_APP_URL` to the canonical HTTPS production origin,
   without an authentication wall or redirect. Do not put the secret in a URL.
3. Deploy the generated Drizzle migration using the normal migration workflow.
   Merge `.github/workflows/notifications.yml` onto the default branch and enable
   scheduled Actions. It calls `/api/cron/notifications` hourly at minute 7.
   Missing GitHub configuration makes the workflow a no-op; missing VAPID keys
   disables subscription registration and delivery. Settings explains that the
   server needs configuration.
4. Test from an installed iOS/iPadOS PWA and supported Android/desktop PWA:
   permission accept/deny, two-member delivery, Sunday timezone/DST, logout,
   device revoke, membership removal, and tapping while another window has a draft.

This GitHub Actions schedule works alongside Vercel Hobby without adding an
unsupported hourly Vercel cron. Scheduled Actions run on the default branch,
can be delayed, and consume the repository's Actions allowance. The reminder is
eligible from 7 pm until local midnight, so later hourly runs can catch a delayed
run that evening. A schedule delayed beyond that evening skips the stale weekly
reminder. There is no exact-time or guaranteed-delivery promise.

References: [Apple Web Push](https://webkit.org/blog/13878/),
[Web Push library](https://github.com/web-push-libs/web-push),
[Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), and
[GitHub scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Verification

Unit tests cover consent/input validation, provider URL restrictions, weekly
local dates and DST. `node scripts/test-groups-db.mjs notifications` migrates a
throwaway database and checks recipient exclusion, delivery-time authorization,
logout cascades, expired sessions/endpoints, and weekly deduplication with the
provider transport mocked. It never sends to real devices. Generated migrations
are tracked normally; do not hand-write SQL or use `drizzle-kit push`.
