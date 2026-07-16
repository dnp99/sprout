import { describe, expect, it } from "vitest";
import type { Category, Transaction } from "@/lib/types";
import { reconcileTransactionPatch } from "./reconcile";

const bills: Category = {
  id: "bills",
  name: "Bills",
  emoji: "💰",
  color: "#000000",
  monthlyBudgetCents: 0,
  spentCents: 0,
};

function transaction(id: string, merchant: string): Transaction {
  return {
    id,
    merchant,
    emoji: "🧾",
    categoryId: null,
    categoryName: "Uncategorized",
    amountCents: -1000,
    method: "",
    status: "posted",
    dateLabel: "",
    occurredAt: "2026-07-01T12:00:00.000Z",
    isIncome: false,
  };
}

describe("reconcileTransactionPatch", () => {
  it("immediately applies a category to normalized merchant matches", () => {
    const edited = {
      ...transaction("a", "American Express"),
      categoryId: bills.id,
      categoryName: bills.name,
      emoji: bills.emoji,
    };
    const result = reconcileTransactionPatch(
      [
        transaction("a", "American Express"),
        transaction("b", "AMERICAN EXPRESS #1234"),
        transaction("c", "Different merchant"),
      ],
      edited,
      { merchant: "American Express", categoryId: bills.id, applyToMerchant: true },
      [bills],
    );

    expect(result[0]).toBe(edited);
    expect(result[1]).toMatchObject({ categoryId: "bills", categoryName: "Bills", emoji: "💰" });
    expect(result[2].categoryId).toBeNull();
  });

  it("only replaces the edited row when merchant propagation is off", () => {
    const original = [transaction("a", "American Express"), transaction("b", "American Express")];
    const edited = { ...original[0], categoryId: bills.id, categoryName: bills.name };
    const result = reconcileTransactionPatch(
      original,
      edited,
      { merchant: "American Express", categoryId: bills.id },
      [bills],
    );

    expect(result[0]).toBe(edited);
    expect(result[1]).toBe(original[1]);
  });
});
