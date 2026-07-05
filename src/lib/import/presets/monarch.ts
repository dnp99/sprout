import type { SproutCategoryKey } from "../category-map";
import type { ImportMapping } from "../types";

/** Column mapping for a Monarch `Transactions_*.csv` export. Monarch's Amount is
 *  a single signed column (negative = expense). */
export const monarchMapping: ImportMapping = {
  name: "Monarch",
  date: { column: "Date", format: "YYYY-MM-DD" },
  merchant: { column: "Merchant" },
  amount: { mode: "signed", column: "Amount" },
  category: { column: "Category" },
  account: { column: "Account" },
  notes: { column: "Notes" },
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
