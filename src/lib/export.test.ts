import { describe, expect, it } from "vitest";
import { exportRangeStart, transactionsToCsv } from "./export";

const NOW = new Date(2026, 6, 15); // July 15 2026

describe("exportRangeStart", () => {
  it("computes range starts", () => {
    expect(exportRangeStart("month", NOW)).toEqual(new Date(2026, 6, 1));
    expect(exportRangeStart("year", NOW)).toEqual(new Date(2026, 0, 1));
    expect(exportRangeStart("quarter", NOW)).toEqual(new Date(2026, 6, 15 - 90));
    expect(exportRangeStart("all", NOW)).toBeNull();
  });
});

describe("transactionsToCsv", () => {
  it("writes a header, transaction types, and signed-dollar amounts", () => {
    const csv = transactionsToCsv([
      {
        date: "2026-07-03",
        merchant: "Uber Eats",
        category: "Dining out",
        transactionType: "expense",
        amountCents: -2774,
      },
      {
        date: "2026-07-03",
        merchant: "Openlane",
        category: "Income",
        transactionType: "income",
        amountCents: 222938,
      },
    ]);
    expect(csv.split("\n")).toEqual([
      "Date,Merchant,Category,Transaction Type,Amount",
      "2026-07-03,Uber Eats,Dining out,Expense,-27.74",
      "2026-07-03,Openlane,Income,Income,2229.38",
    ]);
  });

  it("quotes cells containing commas or quotes", () => {
    const csv = transactionsToCsv([
      {
        date: "2026-07-03",
        merchant: 'Bob\'s "Diner", LLC',
        category: "Dining out",
        transactionType: "expense",
        amountCents: -1000,
      },
    ]);
    expect(csv.split("\n")[1]).toBe('2026-07-03,"Bob\'s ""Diner"", LLC",Dining out,Expense,-10.00');
  });
});
