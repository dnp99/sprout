import { describe, expect, it } from "vitest";
import { transactionRequiredIssues } from "./requirements";
import { validateCreateTransaction } from "./validation";

describe("shared manual transaction requirements", () => {
  it.each([undefined, null, 0, -100, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid amount %s",
    (amountCents) => {
      expect(transactionRequiredIssues({ amountCents, categoryId: "groceries" })).toContain(
        "amountRequired",
      );
    },
  );
  it.each([undefined, null, "", "  ", 42])("rejects missing category %s", (categoryId) => {
    expect(transactionRequiredIssues({ amountCents: 1250, categoryId })).toEqual([
      "categoryRequired",
    ]);
  });
  it.each([-1250, 1250])("accepts expense/income signed cents %s", (amountCents) => {
    expect(
      transactionRequiredIssues({ amountCents, categoryId: "groceries", signedAmount: true }),
    ).toEqual([]);
  });
  it.each(["expense", "income", "reimbursement"])(
    "requires categories for manual %s while preserving ingest",
    (kind) => {
      const input = {
        merchant: "Maple Market",
        amountCents: kind === "expense" ? -1200 : 1200,
        kind,
      };
      expect(validateCreateTransaction(input, { requireCategory: true }).ok).toBe(false);
      expect(
        validateCreateTransaction({ ...input, categoryId: "groceries" }, { requireCategory: true })
          .ok,
      ).toBe(true);
      if (kind !== "reimbursement") expect(validateCreateTransaction(input).ok).toBe(true);
    },
  );
});
