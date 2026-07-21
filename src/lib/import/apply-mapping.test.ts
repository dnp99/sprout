import { describe, expect, it } from "vitest";
import { amountToCents } from "./apply-mapping";
import type { AmountMapping } from "./types";

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
