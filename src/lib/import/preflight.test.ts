import { describe, expect, it } from "vitest";
import { preflight } from "./preflight";
import { readCsv } from "./read-csv";
import type { ImportMapping } from "./types";
import type { SproutCategoryKey } from "./category-map";

const MAPPING: ImportMapping = {
  name: "Test",
  date: { column: "Date", format: "YYYY-MM-DD" },
  merchant: { column: "Merchant" },
  amount: { mode: "signed", column: "Amount" },
  category: { column: "Category" },
  decimal: "period",
};

const CATS: Record<string, SproutCategoryKey> = { groceries: "groceries" };

const detection = { presetId: "custom" as const, confidence: "none" as const };

describe("preflight", () => {
  it("counts valid rows, sums signed amounts, and flags unmatched categories", () => {
    const csv = [
      "Date,Merchant,Category,Amount",
      "2026-06-01,Whole Foods,Groceries,-64.20",
      "2026-06-02,Mystery,Widgets,-10.00",
    ].join("\n");
    const pf = preflight(readCsv(csv), MAPPING, CATS, detection);
    expect(pf.totalRows).toBe(2);
    expect(pf.validRows).toBe(2);
    expect(pf.amountTotalCents).toBe(-7420);
    expect(pf.unmatchedCategories).toBe(1); // Widgets
  });

  it("recognizes an explicit match to a user's custom category", () => {
    const csv = ["Date,Merchant,Category,Amount", "2026-06-01,Uber,Taxi,-18.00"].join("\n");
    const pf = preflight(readCsv(csv), MAPPING, CATS, detection, ["Taxi"]);
    expect(pf.unmatchedCategories).toBe(0);
  });

  it("rejects rows with a missing merchant, bad date, or bad amount", () => {
    const csv = [
      "Date,Merchant,Category,Amount",
      "2026-06-01,,Groceries,-1.00", // no merchant
      "2026-13-01,Store,Groceries,-1.00", // impossible month
      "2026-06-01,Store,Groceries,abc", // bad amount
      "2026-06-01,Store,Groceries,-5.00", // ok
    ].join("\n");
    const pf = preflight(readCsv(csv), MAPPING, CATS, detection);
    expect(pf.totalRows).toBe(4);
    expect(pf.validRows).toBe(1);
    expect(pf.invalidRows.length).toBe(3);
    expect(pf.invalidRows[0].row).toBe(2); // 1-based, header is line 1
    expect(pf.amountTotalCents).toBe(-500);
  });
});
