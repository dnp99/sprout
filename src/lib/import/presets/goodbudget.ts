import type { SproutCategoryKey } from "../category-map";
import type { ImportMapping } from "../types";
import type { ImportPreset } from "./types";

/** Goodbudget transaction export. Amount is a single signed column (negative =
 *  expense); the Envelope is the source category. Dates are US MM/DD/YYYY.
 *
 *  NOTE: Envelope transfers (moving money between envelopes) must not inflate
 *  spending — `classify` excludes rows whose Envelope/Name reads as a transfer.
 *  Fixtures cover the standard export; verify a real export (and envelope-transfer
 *  rows) before production. */
export const goodbudgetMapping: ImportMapping = {
  name: "Goodbudget",
  date: { column: "Date", format: "MM/DD/YYYY" },
  merchant: { column: "Name" },
  amount: { mode: "signed", column: "Amount" },
  category: { column: "Envelope" },
  account: { column: "Account" },
  notes: { column: "Notes" },
  decimal: "period",
};

/** Goodbudget envelope → Sprout key (lowercased). Envelopes are user-named;
 *  common defaults map, the rest fall through to review. */
export const goodbudgetCategoryMap: Record<string, SproutCategoryKey> = {
  groceries: "groceries",
  dining: "dining",
  "eating out": "dining",
  restaurants: "dining",
  shopping: "shopping",
  clothing: "shopping",
  gas: "transport",
  transportation: "transport",
  transport: "transport",
  fun: "fun",
  entertainment: "fun",
  rent: "bills",
  mortgage: "bills",
  utilities: "bills",
  phone: "bills",
  internet: "bills",
};

export const goodbudgetPreset: ImportPreset = {
  id: "goodbudget",
  label: "Goodbudget",
  mapping: goodbudgetMapping,
  categoryMap: goodbudgetCategoryMap,
  detection: {
    requiredHeaders: ["Date", "Envelope", "Name", "Amount"],
    distinctiveHeaders: ["Status", "Account", "Notes"],
    filenameHints: ["goodbudget"],
  },
};
