import { expect, it } from "vitest";
import { notificationCopy } from "./messages";
import { formatMoney } from "@/lib/format";
import type { GroupNotificationDetails } from "./group-details";
const details: GroupNotificationDetails = {
  actor: "Jing",
  group: "The Love Nest",
  action: "expense",
  amountCents: -2395,
  merchant: "Farm Boy",
};
it("includes the recording person, action, group, amount and merchant", () => {
  expect(notificationCopy("en-CA", details)).toEqual({
    title: "The Love Nest",
    body: "Jing added an expense of $23.95 at Farm Boy.",
  });
  expect(
    notificationCopy("en-CA", {
      ...details,
      action: "income",
      amountCents: 250000,
      merchant: "Payroll",
    }).body,
  ).toBe("Jing added income of $2,500.00 · Payroll.");
  expect(notificationCopy("en-CA", { ...details, action: "refund", amountCents: 2395 }).body).toBe(
    "Jing recorded a refund of $23.95 from Farm Boy.",
  );
});
it("uses translated actions and recipient money formatting in every supported locale", () => {
  for (const locale of ["en-CA", "fr-CA", "zh-Hans", "zh-Hant"] as const) {
    const result = notificationCopy(locale, details);
    expect(result.title).toBe(details.group);
    expect(result.body).toContain(details.actor);
    expect(result.body).toContain(details.merchant);
    expect(result.body).toContain(formatMoney(2395, { locale, forceCents: true }));
    expect(result.body).not.toContain("{actor}");
  }
  expect(notificationCopy("unknown", details)).toEqual(notificationCopy("en-CA", details));
});
it("summarizes imports and copies with correct singular/plural counts", () => {
  const batch = { actor: "Deep", group: "Household", action: "imported" as const, count: 1 };
  expect(notificationCopy("en-CA", batch)).toEqual({
    title: "Household",
    body: "Deep imported 1 transaction.",
  });
  expect(notificationCopy("en-CA", { ...batch, count: 12 }).body).toBe(
    "Deep imported 12 transactions.",
  );
  expect(notificationCopy("en-CA", { ...batch, action: "copied", count: 2 }).body).toBe(
    "Deep copied 2 transactions into this group.",
  );
});
it("handles empty merchants, long names and line breaks without changing weekly reminders", () => {
  expect(notificationCopy("en-CA", { ...details, merchant: "  " }).body).toBe(
    "Jing added an expense of $23.95.",
  );
  const long = notificationCopy("en-CA", {
    ...details,
    merchant: "x".repeat(5000),
    actor: "Jing\nDeep",
    group: "A\nB",
  });
  expect(long.title).toBe("A B");
  expect(long.body).toContain("Jing Deep");
  expect(long.body.length).toBeLessThan(250);
  expect(long.body).not.toContain("\n");
  expect(notificationCopy("en-CA")).toEqual({
    title: "Your weekly Sprout check-in",
    body: "Take a moment to add this week’s transactions and keep your budget up to date.",
  });
});
