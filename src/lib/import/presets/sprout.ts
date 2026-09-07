import type { ImportMapping } from "../types";
import type { ImportPreset } from "./types";

/** Sprout's documented fill-in template. It keeps the ubiquitous spreadsheet
 * columns (date, description, signed amount, account, category) while making
 * the format auto-detectable, so users never need to map their own template. */
export const sproutTemplateMapping: ImportMapping = {
  name: "Sprout template",
  // Excel / Google Sheets exports commonly render this template's Date column
  // as `1-Jan-26`; strict parsing supports that alongside ISO dates.
  date: { column: "Date", format: "D-MMM-YY" },
  merchant: { column: "Description" },
  amount: { mode: "signed", column: "Amount" },
  account: { column: "Source" },
  category: { column: "Category" },
  transactionType: { column: "Transaction Type" },
  decimal: "period",
};

export const sproutPreset: ImportPreset = {
  id: "sprout",
  label: "Sprout template",
  mapping: sproutTemplateMapping,
  categoryMap: {},
  detection: {
    requiredHeaders: ["Date", "Description", "Amount", "Source", "Transaction Type", "Category"],
    distinctiveHeaders: ["Description", "Source"],
    filenameHints: ["sprout-template"],
  },
};
