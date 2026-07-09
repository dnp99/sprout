import { describe, expect, it } from "vitest";
import { findLikelyCaptureDuplicate, type ReconcileCandidate } from "./reconcile";

const capture = (o: Partial<ReconcileCandidate>): ReconcileCandidate => ({
  id: "cap1",
  amountCents: -450,
  occurredAt: "2026-07-09",
  ...o,
});

describe("findLikelyCaptureDuplicate", () => {
  it("matches an exact-amount CSV row on the same day", () => {
    const cands = [capture({})];
    const hit = findLikelyCaptureDuplicate(cands, { amountCents: -450, occurredAt: "2026-07-09" });
    expect(hit?.id).toBe("cap1");
  });

  it("matches within the ±window (posting lag)", () => {
    const cands = [capture({ occurredAt: "2026-07-09" })];
    // CSV posts 3 days later — inside the default 4-day window.
    const hit = findLikelyCaptureDuplicate(cands, { amountCents: -450, occurredAt: "2026-07-12" });
    expect(hit?.id).toBe("cap1");
  });

  it("does not match outside the window", () => {
    const cands = [capture({ occurredAt: "2026-07-09" })];
    const miss = findLikelyCaptureDuplicate(cands, { amountCents: -450, occurredAt: "2026-07-20" });
    expect(miss).toBeNull();
  });

  it("requires exact cents (off-by-one is not a match)", () => {
    const cands = [capture({ amountCents: -450 })];
    expect(
      findLikelyCaptureDuplicate(cands, { amountCents: -451, occurredAt: "2026-07-09" }),
    ).toBeNull();
  });

  it("requires matching sign (a +$4.50 refund is not a −$4.50 spend)", () => {
    const cands = [capture({ amountCents: -450 })];
    expect(
      findLikelyCaptureDuplicate(cands, { amountCents: 450, occurredAt: "2026-07-09" }),
    ).toBeNull();
  });

  it("returns the first matching candidate and tolerates Date inputs", () => {
    const cands = [
      capture({ id: "a", occurredAt: new Date("2026-07-08") }),
      capture({ id: "b", occurredAt: new Date("2026-07-09") }),
    ];
    const hit = findLikelyCaptureDuplicate(cands, {
      amountCents: -450,
      occurredAt: new Date("2026-07-09"),
    });
    expect(hit?.id).toBe("a");
  });

  it("returns null with no candidates", () => {
    expect(
      findLikelyCaptureDuplicate([], { amountCents: -450, occurredAt: "2026-07-09" }),
    ).toBeNull();
  });
});
