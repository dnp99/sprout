import type { SproutCategoryKey } from "../category-map";
import type { ImportMapping } from "../types";
import type { ImportPreset } from "./types";

/** YNAB register export. Money is split across Outflow and Inflow columns
 *  (both positive magnitudes), so `inflowOutflow`. YNAB may export CSV or TSV by
 *  locale (handled by the reader). Dates follow the budget's date setting; we
 *  assume US MM/DD/YYYY here.
 *
 *  NOTE: YNAB's date format and split-transaction rows are locale/plan dependent.
 *  Fixtures cover the common US register export; a real export in the target
 *  locale should be verified (and split handling confirmed) before production. */
export const ynabMapping: ImportMapping = {
  name: "YNAB",
  date: { column: "Date", format: "MM/DD/YYYY" },
  merchant: { column: "Payee" },
  amount: { mode: "inflowOutflow", inflowColumn: "Inflow", outflowColumn: "Outflow" },
  category: { column: "Category" },
  account: { column: "Account" },
  notes: { column: "Memo" },
  decimal: "period",
};

/** YNAB category → Sprout key (lowercased). YNAB categories are user-defined;
 *  this maps the common defaults, unmatched ones fall through to review. */
export const ynabCategoryMap: Record<string, SproutCategoryKey> = {
  groceries: "groceries",
  "dining out": "dining",
  restaurants: "dining",
  "coffee shops": "dining",
  shopping: "shopping",
  clothing: "shopping",
  transportation: "transport",
  gas: "transport",
  "public transit": "transport",
  fun: "fun",
  entertainment: "fun",
  hobbies: "fun",
  rent: "bills",
  "rent/mortgage": "bills",
  mortgage: "bills",
  "electric/gas": "bills",
  water: "bills",
  internet: "bills",
  phone: "bills",
};

export const ynabPreset: ImportPreset = {
  id: "ynab",
  label: "YNAB",
  mapping: ynabMapping,
  categoryMap: ynabCategoryMap,
  detection: {
    requiredHeaders: ["Date", "Payee", "Outflow", "Inflow"],
    distinctiveHeaders: ["Memo", "Cleared", "Flag"],
    filenameHints: ["ynab", "register"],
  },
};
