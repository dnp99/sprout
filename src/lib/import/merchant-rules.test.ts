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
