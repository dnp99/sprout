import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatMonthYear,
  formatShortDate,
  formatShortDateYear,
  formatWeekday,
  parseMoneyInput,
  spentPercent,
} from "./format";

/** fr-CA number output uses no-break spaces (regular or narrow, ICU-version
 *  dependent) for grouping and before "$" — normalize to plain spaces so
 *  assertions stay legible. */
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

describe("formatMoney", () => {
  it("formats whole dollars without cents", () => {
    expect(formatMoney(248000)).toBe("$2,480");
    expect(formatMoney(52000)).toBe("$520");
  });

  it("shows cents when the amount is not a whole dollar", () => {
    expect(formatMoney(-6420, { signed: true })).toBe("−$64.20");
  });

  it("prefixes a + for signed income and omits cents when whole", () => {
    expect(formatMoney(320000, { signed: true })).toBe("+$3,200");
  });

  it("forces cents when asked", () => {
    expect(formatMoney(320000, { signed: true, forceCents: true })).toBe("+$3,200.00");
  });
});

describe("formatMoney · fr-CA", () => {
  it("renders symbol-after with comma decimals, same CAD cents", () => {
    expect(plain(formatMoney(495802, { locale: "fr-CA" }))).toBe("4 958,02 $");
    expect(plain(formatMoney(52000, { locale: "fr-CA" }))).toBe("520 $");
    expect(plain(formatMoney(-6420, { signed: true, locale: "fr-CA" }))).toBe("−64,20 $");
  });
});

describe("parseMoneyInput", () => {
  it("parses en-CA input, with and without grouping", () => {
    expect(parseMoneyInput("4,958.02")).toBe(495802);
    expect(parseMoneyInput("4958.02")).toBe(495802);
    expect(parseMoneyInput("520")).toBe(52000);
    expect(parseMoneyInput("$1,200")).toBe(120000);
    expect(parseMoneyInput("12.5")).toBe(1250); // one decimal digit = tens of cents
  });

  it("parses fr-CA input across the space family", () => {
    expect(parseMoneyInput("4 958,02", "fr-CA")).toBe(495802); // plain space
    expect(parseMoneyInput("4 958,02", "fr-CA")).toBe(495802); // narrow nbsp
    expect(parseMoneyInput("4958,02", "fr-CA")).toBe(495802);
    expect(parseMoneyInput("520", "fr-CA")).toBe(52000);
  });

  it("rejects malformed, ambiguous, negative, and empty input", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
    expect(parseMoneyInput("-50")).toBeNull();
    expect(parseMoneyInput("4,95")).toBeNull(); // comma off the thousands boundary
    expect(parseMoneyInput("4.958,02")).toBeNull(); // European style in en-CA
    expect(parseMoneyInput("12.345")).toBeNull(); // 3 "decimals"
  });
});

describe("date helpers", () => {
  const jul14 = new Date(2026, 6, 14, 12);

  it("format per locale", () => {
    expect(formatMonthYear(jul14)).toBe("July 2026");
    expect(formatMonthYear(jul14, "fr-CA")).toBe("juillet 2026");
    expect(formatShortDate(jul14)).toBe("Jul 14");
    expect(formatShortDateYear(jul14)).toBe("Jul 14, 2026");
    expect(formatShortDateYear(jul14, "fr-CA")).toBe("14 juill. 2026");
    expect(formatWeekday(jul14, "long", "fr-CA")).toBe("mardi");
  });
});

describe("spentPercent", () => {
  it("computes and clamps to 0–100", () => {
    expect(spentPercent(52000, 60000)).toBe(87);
    expect(spentPercent(31000, 31000)).toBe(100);
    expect(spentPercent(40000, 20000)).toBe(100);
    expect(spentPercent(100, 0)).toBe(0);
  });
});
