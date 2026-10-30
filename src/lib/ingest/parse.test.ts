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

describe("capture language is independent of interface language", () => {
  it.each([
    ["今天午饭花了35元", "午饭", -3500, "2026-07-09"],
    ["昨天午餐花了35元", "午餐", -3500, "2026-07-08"],
    ["昨天咖啡十二元五角", "咖啡", -1250, "2026-07-08"],
    ["今日咖啡十二點五元", "咖啡", -1250, "2026-07-09"],
    ["昨天收到公司工资8000元", "公司", 800000, "2026-07-08"],
    ["今天收到公司薪資八千元", "公司", 800000, "2026-07-09"],
    ["星巴克 １２．５０元", "星巴克", -1250, undefined],
    ["coffee 咖啡 12.50 CAD", "Coffee 咖啡", -1250, undefined],
    ["花店 35元", "花店", -3500, undefined],
    ["元气寿司 35元", "元气寿司", -3500, undefined],
    ["午饭花35元", "午饭", -3500, undefined],
    ["咖啡 12块5", "咖啡", -1250, undefined],
    ["咖啡 12元5角6分", "咖啡", -1256, undefined],
    ["hier café 12,50 dollars", "Café", -1250, "2026-07-08"],
    ["salaire entreprise 3200", "Entreprise", 320000, undefined],
  ])("parses %s without a locale parameter", (text, merchant, cents, date) => {
    const draft = parseCapture(text, NOW);
    expect(draft.merchant).toBe(merchant);
    expect(draft.amountCents).toBe(cents);
    expect(draft.occurredAt).toBe(date);
    expect(draft.raw).toBe(text);
  });

  it("keeps Chinese names without inventing amounts from their numerals", () => {
    const draft = parseCapture("三星购物", NOW);
    expect(draft.merchant).toBe("三星购物");
    expect(draft.needsClarification).toBe(true);
  });
});

it("treats explicitly paid Chinese wages as an expense", () => {
  expect(parseCapture("支付员工工资8000元", NOW).amountCents).toBe(-800000);
});

it.each(["10月29日午饭35元", "咖啡12.345元", "咖啡一百二元", "午饭35元咖啡12元"])(
  "defers ambiguous input instead of writing the first number: %s",
  (text) => {
    expect(parseCapture(text, NOW).needsClarification).toBe(true);
  },
);
