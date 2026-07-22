import { describe, expect, it } from "vitest";
import { normalizeMerchant } from "@/lib/import/normalize";
import { matchingTransactionIds, ruleMatches } from "./match";

const txn = (id: string, merchant: string, isIncome = false, excludeFromBudget = false) => ({
  id,
  merchant,
  isIncome,
  excludeFromBudget,
});

describe("ruleMatches", () => {
  it("matches on the normalized merchant (case/store-number insensitive)", () => {
    const pattern = normalizeMerchant("Uber Eats");
    expect(ruleMatches("UBER EATS", pattern)).toBe(true);
    expect(ruleMatches("Uber Eats #4821", pattern)).toBe(true); // store number dropped
    expect(ruleMatches("Ubereats", pattern)).toBe(false); // different token
  });
});

describe("matchingTransactionIds", () => {
  const pattern = normalizeMerchant("Uber");

  it("returns categorizable expenses with the same normalized merchant", () => {
    const txns = [
      txn("a", "Uber"),
      txn("b", "Uber #4821"), // store number dropped → normalizes to "UBER"
      txn("c", "Lyft"),
      txn("d", "Uber", true), // income → skip
      txn("e", "Uber", false, true), // excluded → skip
    ];
    expect(matchingTransactionIds(txns, pattern)).toEqual(["a", "b"]);
  });

  it("returns nothing for an empty pattern", () => {
    expect(matchingTransactionIds([txn("a", "Uber")], "")).toEqual([]);
  });
});
