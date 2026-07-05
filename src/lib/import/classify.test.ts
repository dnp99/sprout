import { describe, expect, it } from "vitest";
import { classify } from "./classify";

describe("classify", () => {
  it("excludes internal moves from the budget", () => {
    expect(classify("Transfer", -1000)).toEqual({ kind: "transfer", excludeFromBudget: true });
    expect(classify("Credit Card Payment", -50000)).toEqual({
      kind: "payment",
      excludeFromBudget: true,
    });
    expect(classify("Loan Repayment", -185000)).toEqual({
      kind: "payment",
      excludeFromBudget: true,
    });
  });

  it("classifies income vs expense by amount sign", () => {
    expect(classify("Groceries", -6420)).toEqual({ kind: "expense", excludeFromBudget: false });
    expect(classify("Paycheck", 320000)).toEqual({ kind: "income", excludeFromBudget: false });
  });
});
