import { describe, expect, it } from "vitest";
import { amountToCents, applyMapping } from "./apply-mapping";
import type { AmountMapping, ImportMapping } from "./types";

describe("amountToCents signedByType", () => {
  const mapping: AmountMapping = {
    mode: "signedByType",
    column: "Amount",
    typeColumn: "Transaction Type",
    debitValues: ["debit"],
    creditValues: ["credit"],
  };

  it("makes debits negative and credits positive from a positive magnitude", () => {
    expect(amountToCents({ Amount: "64.20", "Transaction Type": "debit" }, mapping)).toBe(-6420);
    expect(amountToCents({ Amount: "3200.00", "Transaction Type": "credit" }, mapping)).toBe(
      320000,
    );
  });

  it("matches the type case-insensitively", () => {
    expect(amountToCents({ Amount: "5.00", "Transaction Type": "DEBIT" }, mapping)).toBe(-500);
  });

  it("treats an unknown type as an outflow (the preflight rejects it separately)", () => {
    expect(amountToCents({ Amount: "5.00", "Transaction Type": "???" }, mapping)).toBe(-500);
  });
});

describe("applyMapping income source", () => {
  it("maps an optional income-source column without changing the amount", () => {
    const mapping: ImportMapping = {
      name: "test",
      date: { column: "Date" },
      merchant: { column: "Merchant" },
      amount: { mode: "signed", column: "Amount" },
      incomeSource: { column: "Income type" },
    };
    expect(
      applyMapping(
        { Date: "2026-01-02", Merchant: "Acme", Amount: "2500.00", "Income type": "Main job" },
        mapping,
      ).sourceIncome,
    ).toBe("Main job");
  });

  it("maps an explicit transaction-type column independently of amount type", () => {
    const mapping: ImportMapping = {
      name: "test",
      date: { column: "Date" },
      merchant: { column: "Merchant" },
      amount: { mode: "signed", column: "Amount" },
      transactionType: { column: "Transaction Type" },
    };
    expect(
      applyMapping(
        {
          Date: "2026-01-02",
          Merchant: "Employer",
          Amount: "100.00",
          "Transaction Type": "Income",
        },
        mapping,
      ).sourceTransactionType,
    ).toBe("Income");
  });
});

describe("amountToCents existing modes still work", () => {
  it("signed / debitCredit / inflowOutflow", () => {
    expect(amountToCents({ A: "-5.00" }, { mode: "signed", column: "A" })).toBe(-500);
    expect(
      amountToCents(
        { D: "5.00", C: "" },
        { mode: "debitCredit", debitColumn: "D", creditColumn: "C" },
      ),
    ).toBe(-500);
    expect(
      amountToCents(
        { In: "", Out: "5.00" },
        { mode: "inflowOutflow", inflowColumn: "In", outflowColumn: "Out" },
      ),
    ).toBe(-500);
  });
});
