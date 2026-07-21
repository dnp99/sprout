import type { SproutCategoryKey } from "../category-map";
import type { ImportMapping } from "../types";
import type { ImportPreset } from "./types";

/** Legacy Mint transaction export. Mint stores a POSITIVE Amount plus a
 *  "Transaction Type" column (debit/credit), so the sign comes from the type,
 *  not the number — the `signedByType` mode. Dates are US MM/DD/YYYY.
 *
 *  NOTE: Mint is discontinued; this targets previously-downloaded exports. Headers
 *  are from the well-known Mint CSV format and are covered by fixtures, but a real
 *  legacy export should be verified before this is relied on in production. */
export const mintMapping: ImportMapping = {
  name: "Mint (legacy export)",
  date: { column: "Date", format: "MM/DD/YYYY" },
  merchant: { column: "Description" },
  amount: {
    mode: "signedByType",
    column: "Amount",
    typeColumn: "Transaction Type",
    debitValues: ["debit"],
    creditValues: ["credit"],
  },
  category: { column: "Category" },
  account: { column: "Account Name" },
  notes: { column: "Notes" },
  decimal: "period",
};

/** Mint category → Sprout key (lowercased). Internal moves (Transfer, Credit
 *  Card Payment) are intentionally absent — `classify` excludes them. */
export const mintCategoryMap: Record<string, SproutCategoryKey> = {
  groceries: "groceries",
  restaurants: "dining",
  "coffee shops": "dining",
  "fast food": "dining",
  food: "dining",
  shopping: "shopping",
  clothing: "shopping",
  electronics: "shopping",
  gas: "transport",
  "gas & fuel": "transport",
  "auto & transport": "transport",
  "public transportation": "transport",
  parking: "transport",
  entertainment: "fun",
  movies: "fun",
  music: "fun",
  hobbies: "fun",
  rent: "bills",
  mortgage: "bills",
  utilities: "bills",
  "mobile phone": "bills",
  internet: "bills",
};

export const mintPreset: ImportPreset = {
  id: "mint",
  label: "Mint (legacy export)",
  mapping: mintMapping,
  categoryMap: mintCategoryMap,
  detection: {
    requiredHeaders: ["Date", "Description", "Amount", "Transaction Type"],
    distinctiveHeaders: ["Original Description", "Account Name", "Labels"],
    filenameHints: ["mint", "transactions"],
  },
};
