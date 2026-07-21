import type { SproutCategoryKey } from "../category-map";
import type { ImportMapping } from "../types";
import type { ImportPreset } from "./types";

/** Column mapping for a Monarch `Transactions_*.csv` export. Monarch's Amount is
 *  a single signed column (negative = expense), in US period notation. */
export const monarchMapping: ImportMapping = {
  name: "Monarch",
  date: { column: "Date", format: "YYYY-MM-DD" },
  merchant: { column: "Merchant" },
  amount: { mode: "signed", column: "Amount" },
  category: { column: "Category" },
  account: { column: "Account" },
  notes: { column: "Notes" },
  decimal: "period",
};

/** Monarch category → Sprout key. Keys are lowercased. Internal categories
 *  (Transfer, Credit Card Payment, Loan Repayment) are intentionally absent —
 *  `classify` handles those and excludes them from the budget. */
export const monarchCategoryMap: Record<string, SproutCategoryKey> = {
  groceries: "groceries",
  "restaurants & bars": "dining",
  "coffee shops": "dining",
  "food & dining": "dining",
  shopping: "shopping",
  clothing: "shopping",
  electronics: "shopping",
  gas: "transport",
  "auto & transport": "transport",
  "public transit": "transport",
  rideshare: "transport",
  parking: "transport",
  "entertainment & recreation": "fun",
  streaming: "fun",
  "movies & dvds": "fun",
  hobbies: "fun",
  rent: "bills",
  mortgage: "bills",
  utilities: "bills",
  "internet & cable": "bills",
  phone: "bills",
  insurance: "bills",
};

export const monarchPreset: ImportPreset = {
  id: "monarch",
  label: "Monarch",
  mapping: monarchMapping,
  categoryMap: monarchCategoryMap,
  detection: {
    // Distinctive headers are DISJOINT from required, so a generic
    // Date/Merchant/Amount bank export scores 0 → Custom (not misread as Monarch).
    requiredHeaders: ["Date", "Merchant", "Amount"],
    distinctiveHeaders: ["Category", "Account", "Notes"],
    filenameHints: ["monarch", "transactions_"],
  },
};
