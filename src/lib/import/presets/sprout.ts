import type { ImportMapping } from "../types";
import type { ImportPreset } from "./types";

/** Sprout's documented fill-in template. It keeps the ubiquitous spreadsheet
 * columns (date, description, signed amount, account, category) while making
 * the format auto-detectable, so users never need to map their own template. */
export const sproutTemplateMapping: ImportMapping = {
  name: "Sprout template",
  date: { column: "Date", format: "YYYY-MM-DD" },
  merchant: { column: "Description" },
  amount: { mode: "signed", column: "Amount" },
  account: { column: "Source" },
  category: { column: "Category" },
  decimal: "period",
};

export const sproutPreset: ImportPreset = {
  id: "sprout",
  label: "Sprout template",
  mapping: sproutTemplateMapping,
  categoryMap: {},
  detection: {
    requiredHeaders: ["Date", "Description", "Amount", "Source", "Category"],
    distinctiveHeaders: ["Description", "Source"],
    filenameHints: ["sprout-template"],
  },
};
