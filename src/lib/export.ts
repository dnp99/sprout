/** CSV export helpers. Pure — no DB/React. Shared by the export API route (data
 *  source) and the client (range chips + row count). */

export type ExportRange = "month" | "quarter" | "year" | "all";

export const EXPORT_RANGES: { value: ExportRange; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

/** Start date for a range (inclusive), or null for "all time". */
export function exportRangeStart(range: ExportRange, now = new Date()): Date | null {
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "quarter") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

export interface ExportRow {
  /** ISO date, "2026-07-03". */
  date: string;
  merchant: string;
  category: string;
  /** Signed cents. */
  amountCents: number;
}

/** RFC-4180 cell quoting: wrap in quotes if it contains a comma, quote or newline. */
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize rows to a CSV string: Date, Merchant, Category, Amount (signed
 *  dollars). Amount stays exact — cents / 100 to 2 dp — so it round-trips back
 *  through the importer. */
export function transactionsToCsv(rows: ExportRow[]): string {
  const header = "Date,Merchant,Category,Amount";
  const lines = rows.map((r) =>
    [r.date, r.merchant, r.category, (r.amountCents / 100).toFixed(2)]
      .map((v) => csvCell(String(v)))
      .join(","),
  );
  return [header, ...lines].join("\n");
}
