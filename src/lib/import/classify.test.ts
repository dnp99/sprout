import { describe, expect, it } from "vitest";
import { classify, isCardOrBillPayment } from "./classify";

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

  it("honours an explicit spreadsheet transaction type over the amount heuristic", () => {
    expect(classify("Unassigned income", 10000, "Employer", "Reimbursement")).toEqual({
      kind: "reimbursement",
      excludeFromBudget: false,
    });
    expect(classify("Groceries", -10000, "Move", "Transfer")).toEqual({
      kind: "transfer",
      excludeFromBudget: true,
    });
  });

  it("catches card/bill payments by merchant when the export has no category", () => {
    expect(classify(null, -120000, "Bill Payment")).toEqual({
      kind: "payment",
      excludeFromBudget: true,
    });
    expect(classify(null, -90000, "Mastercard Payment")).toEqual({
      kind: "payment",
      excludeFromBudget: true,
    });
  });
});

describe("isCardOrBillPayment", () => {
  it("matches credit-card and issuer bill payments", () => {
    for (const m of [
      "Amex",
      "American Express",
      "Mastercard Payment",
      "Credit Card Payment",
      "Bill Payment",
      "National Bank of Canada",
    ]) {
      expect(isCardOrBillPayment(m)).toBe(true);
    }
  });

  it("leaves real spending alone, including 'Mobile Bill Payment' (a phone bill)", () => {
    for (const m of [
      "Mobile Bill Payment",
      "Uber Eats",
      "Farm Boy",
      "Mortgage Loan Payment", // real housing expense per user's choice
      "Interac",
      "Amazon",
    ]) {
      expect(isCardOrBillPayment(m)).toBe(false);
    }
  });
});
