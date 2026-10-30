import { isAppLocale } from "@/lib/locale";

/** Only known Web Push providers may receive server-side delivery requests. */
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const u = new URL(value),
      host = u.hostname;
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      (host === "fcm.googleapis.com" ||
        host === "updates.push.services.mozilla.com" ||
        host === "push.services.mozilla.com" ||
        host.endsWith(".push.apple.com") ||
        host === "web.push.apple.com" ||
        host.endsWith(".notify.windows.com"))
    );
  } catch {
    return false;
  }
}
export function parseSubscription(value: unknown) {
  if (!value || typeof value !== "object") throw Error("Invalid subscription.");
  const s = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (
    !validPushEndpoint(s.endpoint) ||
    typeof s.keys?.p256dh !== "string" ||
    !/^[\w-]{87}=?$/.test(s.keys.p256dh) ||
    typeof s.keys.auth !== "string" ||
    !/^[\w-]{22}={0,2}$/.test(s.keys.auth)
  )
    throw Error("Invalid subscription.");
  return { endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth };
}
export function parsePreferences(value: unknown) {
  if (!value || typeof value !== "object") throw Error("Invalid preferences.");
  const p = value as Record<string, unknown>;
  if (
    typeof p.groupActivity !== "boolean" ||
    typeof p.weeklyReminder !== "boolean" ||
    !isAppLocale(p.locale) ||
    typeof p.timeZone !== "string" ||
    p.timeZone.length > 100
  )
    throw Error("Invalid preferences.");
  try {
    new Intl.DateTimeFormat("en", { timeZone: p.timeZone }).format();
  } catch {
    throw Error("Invalid timezone.");
  }
  return {
    groupActivity: p.groupActivity,
    weeklyReminder: p.weeklyReminder,
    locale: p.locale,
    timeZone: p.timeZone,
  };
}
