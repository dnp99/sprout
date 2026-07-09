/**
 * Onboarding analytics — a thin, privacy-first wrapper around PostHog.
 *
 * Sprout is a budgeting app, so the stance is deliberately conservative (see
 * docs/analytics.md):
 *  - **Opt-in by env.** Nothing loads unless `NEXT_PUBLIC_POSTHOG_KEY` is set,
 *    so local/dev and un-configured deploys send nothing.
 *  - **No autocapture, no session recording.** We never scrape the DOM (which
 *    would sweep up dollar amounts, merchant names, emails). Only the explicit
 *    events below are sent, with non-sensitive properties only.
 *  - **Identify by user id (UUID) only** — never email or name.
 *  - **Respect Do Not Track.**
 *
 * Components/state never import `posthog-js` directly — they call these helpers,
 * so the tool is swappable and the privacy config lives in exactly one place.
 */

import type { PostHog } from "posthog-js";

/** Non-sensitive onboarding funnel events. Keep names + props free of PII and
 *  money — the point is drop-off measurement, not behavioural surveillance. */
export type AnalyticsEvent =
  "signup_completed" | "budget_set" | "transaction_added" | "activation_item_clicked";

let client: PostHog | null = null;

/** Initialize PostHog once, in the browser, only if a key is configured.
 *  Safe to call on every mount — it no-ops after the first success. */
export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined" || client) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const posthog = (await import("posthog-js")).default;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    // Finance app: capture nothing implicitly. Only our explicit events.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    respect_dnt: true,
    // Only create person profiles for signed-in (identified) users.
    person_profiles: "identified_only",
  });
  client = posthog;
}

/** Tie subsequent events to a user by their UUID (never email/name). */
export function identifyUser(userId: string): void {
  if (client && userId) client.identify(userId);
}

/** Send a funnel event. Props must be non-sensitive (no money/merchant/email). */
export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number>): void {
  if (client) client.capture(event, props);
}

/** Clear the identified user + queued state on logout. */
export function resetAnalytics(): void {
  if (client) client.reset();
}
