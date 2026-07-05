import { describe, expect, it } from "vitest";
import { buildImportRows } from "./pipeline";
import { monarchMapping } from "./presets/monarch";
import { readCsv } from "./read-csv";

const CSV = [
  "Date,Merchant,Category,Account,Notes,Amount",
  "2026-06-01,Whole Foods,Groceries,Chequing,weekly,-64.20",
  "2026-06-01,Paycheck,Income,Chequing,,3200.00",
  '2026-06-02,"Amex Payment",Credit Card Payment,Chequing,,-500.00',
  "2026-06-03,Uber Eats,Restaurants & Bars,Amex,,-27.74",
  "2026-06-03,Uber Eats,Restaurants & Bars,Amex,,-27.74",
].join("\n");

describe("buildImportRows via the Monarch preset", () => {
  const rows = buildImportRows(readCsv(CSV), monarchMapping);

  it("maps amounts to signed cents, preserves source fields, and classifies", () => {
    expect(rows[0]).toMatchObject({
      merchant: "Whole Foods",
      amountCents: -6420,
      sourceCategory: "Groceries",
      sourceAccount: "Chequing",
      note: "weekly",
      kind: "expense",
      excludeFromBudget: false,
    });
    expect(rows[1]).toMatchObject({ amountCents: 320000, kind: "income" });
    expect(rows[2]).toMatchObject({ kind: "payment", excludeFromBudget: true });
  });

  it("gives same-day identical charges distinct external ids", () => {
    expect(rows[3].externalId).not.toBe(rows[4].externalId);
  });

  it("is idempotent — re-running yields identical external ids", () => {
    const again = buildImportRows(readCsv(CSV), monarchMapping);
    expect(again.map((r) => r.externalId)).toEqual(rows.map((r) => r.externalId));
  });
});
