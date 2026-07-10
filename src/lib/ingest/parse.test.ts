import { describe, expect, it } from "vitest";
import { parseCapture } from "./parse";

// Fixed "now" so the relative-date cases are deterministic.
const NOW = new Date(2026, 6, 9); // Thu Jul 9 2026

describe("parseCapture — expenses", () => {
  it("splits 'coffee 4.50' into a merchant and negative cents", () => {
    const d = parseCapture("coffee 4.50", NOW);
    expect(d.merchant).toBe("Coffee");
    expect(d.amountCents).toBe(-450);
    expect(d.confidence).toBeGreaterThanOrEqual(0.9);
    expect(d.needsClarification).toBeUndefined();
  });

  it("handles a leading '$' and merchant after the amount ('$12 lunch')", () => {
    const d = parseCapture("$12 lunch", NOW);
    expect(d.merchant).toBe("Lunch");
    expect(d.amountCents).toBe(-1200);
  });

  it("handles a currency word ('12 bucks groceries')", () => {
    const d = parseCapture("12 bucks groceries", NOW);
    expect(d.merchant).toBe("Groceries");
    expect(d.amountCents).toBe(-1200);
  });

  it("drops filler words ('spent 12 on lunch')", () => {
    const d = parseCapture("spent 12 on lunch", NOW);
    expect(d.merchant).toBe("Lunch");
    expect(d.amountCents).toBe(-1200);
  });

  it("keeps money as exact integer cents, never float ('chipotle 19.99')", () => {
    const d = parseCapture("chipotle 19.99", NOW);
    expect(d.amountCents).toBe(-1999);
  });

  it("parses thousands separators ('rent $1,850')", () => {
    const d = parseCapture("rent $1,850", NOW);
    expect(d.merchant).toBe("Rent");
    expect(d.amountCents).toBe(-185000);
  });
});

describe("parseCapture — income", () => {
  it("treats income words as positive ('got paid 3200')", () => {
    const d = parseCapture("got paid 3200", NOW);
    expect(d.amountCents).toBe(320000);
    expect(d.merchant).toBe("Income"); // leftover was only filler/income words
    expect(d.confidence).toBeCloseTo(0.6); // defaulted merchant → lower confidence
  });

  it("keeps a named income source ('refund from amazon 25.99')", () => {
    const d = parseCapture("refund from amazon 25.99", NOW);
    expect(d.amountCents).toBe(2599);
    expect(d.merchant).toBe("Amazon");
  });
});

describe("parseCapture — dates", () => {
  it("resolves 'yesterday' against now and strips it from the merchant", () => {
    const d = parseCapture("yesterday coffee 3", NOW);
    expect(d.occurredAt).toBe("2026-07-08");
    expect(d.merchant).toBe("Coffee");
    expect(d.amountCents).toBe(-300);
  });

  it("resolves 'today' to now", () => {
    const d = parseCapture("today lunch 15", NOW);
    expect(d.occurredAt).toBe("2026-07-09");
  });

  it("omits occurredAt when no date is named", () => {
    expect(parseCapture("coffee 4.50", NOW).occurredAt).toBeUndefined();
  });
});

describe("parseCapture — needs clarification", () => {
  it("flags input with no amount and logs nothing", () => {
    const d = parseCapture("did i spend too much", NOW);
    expect(d.needsClarification).toBe(true);
    expect(d.amountCents).toBe(0);
    expect(d.confidence).toBeLessThan(0.5);
  });
});
