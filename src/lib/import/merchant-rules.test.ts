import { describe, expect, it } from "vitest";
import { normalizeMerchant } from "./merchant-rules";

describe("normalizeMerchant", () => {
  it("collapses case and whitespace", () => {
    expect(normalizeMerchant("  Uber   Eats ")).toBe("UBER EATS");
    expect(normalizeMerchant("uber eats")).toBe("UBER EATS");
  });

  it("drops trailing store/reference suffixes", () => {
    expect(normalizeMerchant("UBER EATS #123")).toBe("UBER EATS");
    expect(normalizeMerchant("SHELL *8842")).toBe("SHELL");
  });

  it("strips long digit runs and punctuation", () => {
    expect(normalizeMerchant("AMZN Mktp US*2X4Y9")).toBe("AMZN MKTP US");
    expect(normalizeMerchant("SQ *COFFEE-BAR")).toBe("SQ COFFEE BAR");
  });

  it("maps formatting variants of one merchant to the same key", () => {
    expect(normalizeMerchant("STARBUCKS #451")).toBe(normalizeMerchant("Starbucks  451"));
  });

  it("returns an empty string for a digits-only merchant", () => {
    expect(normalizeMerchant("000123")).toBe("");
  });
});

it("keeps multilingual merchants distinct and normalizes full-width forms", () => {
  expect(normalizeMerchant("星巴克 #123")).toBe("星巴克");
  expect(normalizeMerchant("大统华")).toBe("大统华");
  expect(normalizeMerchant("星巴克")).not.toBe(normalizeMerchant("大统华"));
  expect(normalizeMerchant("café Montréal")).toBe("CAFÉ MONTRÉAL");
  expect(normalizeMerchant("Ｔｉｍ 星巴克 #１２３")).toBe("TIM 星巴克");
  expect(normalizeMerchant("cafe\u0301")).toBe(normalizeMerchant("café"));
});
