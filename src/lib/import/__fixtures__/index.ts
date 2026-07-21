/** Synthetic import fixtures + expected-results manifests (plan 014, Gate 0).
 *
 *  These are hand-authored to model each source's documented export format —
 *  NOT real user data. Headers/date/decimal/sign conventions match the known
 *  formats, but a real export in the target locale should still be verified
 *  before a source is treated as production-grade. Each manifest records the
 *  exact expected totals the parser/preflight/pipeline must reproduce. */

import type { PresetId } from "../presets/types";

export interface FixtureManifest {
  /** Expected detection from headers + filename. */
  detect: { presetId: PresetId | "custom"; confidence: "high" | "ambiguous" | "none" };
  totalRows: number;
  validRows: number;
  invalidRows: number;
  /** Signed sum of valid rows, in cents. */
  amountTotalCents: number;
  /** Valid rows whose source category didn't map to a Sprout category. */
  unmatchedCategories: number;
  /** Rows excluded from budget (transfers / card payments) after classify. */
  excluded: number;
}

export interface Fixture {
  preset: PresetId;
  filename: string;
  csv: string;
  manifest: FixtureManifest;
}

/** Monarch — signed Amount, ISO dates, comma CSV. */
export const monarchFixture: Fixture = {
  preset: "monarch",
  filename: "transactions_2026.csv",
  csv: [
    "Date,Merchant,Category,Account,Notes,Amount",
    "2026-06-01,Whole Foods,Groceries,Chequing,weekly,-64.20",
    "2026-06-01,Paycheck,Income,Chequing,,3200.00",
    "2026-06-02,Amex Payment,Credit Card Payment,Chequing,,-500.00",
    "2026-06-03,Uber Eats,Restaurants & Bars,Amex,,-27.74",
  ].join("\n"),
  manifest: {
    detect: { presetId: "monarch", confidence: "high" },
    totalRows: 4,
    validRows: 4,
    invalidRows: 0,
    amountTotalCents: -6420 + 320000 - 50000 - 2774,
    unmatchedCategories: 2, // Income, Credit Card Payment don't map to a Sprout key
    excluded: 1, // Credit Card Payment
  },
};

/** Legacy Mint — positive Amount + Transaction Type (signedByType), MM/DD/YYYY. */
export const mintFixture: Fixture = {
  preset: "mint",
  filename: "mint_transactions.csv",
  csv: [
    "Date,Description,Original Description,Amount,Transaction Type,Category,Account Name,Labels,Notes",
    "06/01/2026,Whole Foods,WHOLEFDS #123,64.20,debit,Groceries,Checking,,weekly",
    "06/01/2026,Paycheck,ACH DEPOSIT,3200.00,credit,Income,Checking,,",
    "06/03/2026,Starbucks,STARBUCKS,5.75,debit,Coffee Shops,Checking,,",
  ].join("\n"),
  manifest: {
    detect: { presetId: "mint", confidence: "high" },
    totalRows: 3,
    validRows: 3,
    invalidRows: 0,
    amountTotalCents: -6420 + 320000 - 575,
    unmatchedCategories: 1, // Income
    excluded: 0,
  },
};

/** YNAB — Outflow/Inflow columns, TAB-separated (locale variant), MM/DD/YYYY. */
export const ynabFixture: Fixture = {
  preset: "ynab",
  filename: "MyBudget-Register.tsv",
  csv: [
    "Account\tFlag\tDate\tPayee\tCategory\tMemo\tOutflow\tInflow\tCleared",
    "Checking\t\t06/01/2026\tWhole Foods\tGroceries\tweekly\t64.20\t\tCleared",
    "Checking\t\t06/01/2026\tEmployer\tInflow: Ready to Assign\t\t\t3200.00\tCleared",
    "Checking\t\t06/03/2026\tTransit\tTransportation\t\t2.75\t\tCleared",
  ].join("\n"),
  manifest: {
    detect: { presetId: "ynab", confidence: "high" },
    totalRows: 3,
    validRows: 3,
    invalidRows: 0,
    amountTotalCents: -6420 + 320000 - 275,
    unmatchedCategories: 1, // "Inflow: Ready to Assign"
    excluded: 0,
  },
};

/** Goodbudget — signed Amount, Envelope as category, MM/DD/YYYY. Envelope
 *  "Transfer" is an internal move and must be excluded from spending. */
export const goodbudgetFixture: Fixture = {
  preset: "goodbudget",
  filename: "goodbudget-export.csv",
  csv: [
    "Date,Envelope,Account,Name,Notes,Amount,Status",
    "06/01/2026,Groceries,Checking,Whole Foods,weekly,-64.20,Cleared",
    "06/05/2026,Transfer,Checking,Envelope Fill,,-100.00,Cleared",
    "06/03/2026,Dining,Checking,Chipotle,,-12.50,Cleared",
  ].join("\n"),
  manifest: {
    detect: { presetId: "goodbudget", confidence: "high" },
    totalRows: 3,
    validRows: 3,
    invalidRows: 0,
    amountTotalCents: -6420 - 10000 - 1250,
    unmatchedCategories: 1, // Transfer
    excluded: 1, // Transfer envelope
  },
};

export const FIXTURES: readonly Fixture[] = [
  monarchFixture,
  mintFixture,
  ynabFixture,
  goodbudgetFixture,
];
