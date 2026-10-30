import { expect, it } from "vitest";
import { parsePreferences, parseSubscription, validPushEndpoint } from "./validation";
import { weeklyReminderKey } from "./schedule";

it("rejects arbitrary delivery URLs and malformed device encryption keys", () => {
  for (const endpoint of [
    "http://localhost/x",
    "https://127.0.0.1/x",
    "https://fcm.googleapis.com.evil.test/x",
    "https://fcm.googleapis.com:8443/x",
    "https://user:pass@fcm.googleapis.com/x",
  ])
    expect(validPushEndpoint(endpoint)).toBe(false);
  const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test",
    keys: { p256dh: "B".repeat(87), auth: "a".repeat(22) },
  };
  expect(parseSubscription(subscription).endpoint).toBe(subscription.endpoint);
  expect(() => parseSubscription({ ...subscription, keys: { auth: "bad" } })).toThrow();
});
it("validates explicit consent, locale and real timezone IDs", () => {
  const p = {
    groupActivity: true,
    weeklyReminder: false,
    locale: "en-CA",
    timeZone: "America/Toronto",
  };
  expect(parsePreferences(p)).toEqual(p);
  expect(() => parsePreferences({ ...p, timeZone: "Nowhere/Unknown" })).toThrow();
  expect(() => parsePreferences({ ...p, groupActivity: "yes" })).toThrow();
  expect(() => parsePreferences({ ...p, locale: "xx" })).toThrow();
});
it("follows Sunday 7 pm across daylight saving and fractional-hour timezones", () => {
  expect(weeklyReminderKey(new Date("2026-10-25T22:59:00Z"), "America/Toronto")).toBeNull();
  expect(weeklyReminderKey(new Date("2026-10-25T23:07:00Z"), "America/Toronto")).toBe(
    "weekly:2026-10-25",
  );
  expect(weeklyReminderKey(new Date("2026-11-02T00:07:00Z"), "America/Toronto")).toBe(
    "weekly:2026-11-01",
  );
  expect(weeklyReminderKey(new Date("2026-11-02T05:07:00Z"), "America/Toronto")).toBeNull();
  expect(weeklyReminderKey(new Date("2026-10-25T14:07:00Z"), "Asia/Kolkata")).toBe(
    "weekly:2026-10-25",
  );
  expect(weeklyReminderKey(new Date(), "bad")).toBeNull();
});
