import { getPreset, verifyPresetHeaders } from "./presets";
import { parseCsv } from "./read-csv";
import type { ImportMapping } from "./types";

/** Both ledgers resolve presets on the server; custom mappings must contain
 * bounded string fields before parsers can use them as column names. */
export function resolveImportSource(body: { csv: string; preset?: unknown; mapping?: unknown }) {
  if (typeof body.preset === "string") {
    const preset = getPreset(body.preset);
    if (!preset || !verifyPresetHeaders(preset, parseCsv(body.csv)[0] ?? []))
      throw new Error("This file does not match a supported source.");
    return { mapping: preset.mapping, categoryMap: preset.categoryMap };
  }
  const m = body.mapping as ImportMapping | undefined;
  const column = (value: unknown) =>
    typeof value === "string" && value.length > 0 && value.length <= 256;
  if (
    !m ||
    typeof m !== "object" ||
    !column(m.date?.column) ||
    !column(m.merchant?.column) ||
    !m.amount
  )
    throw new Error("Provide a valid preset or column mapping.");
  const a = m.amount;
  const valid =
    a.mode === "signed"
      ? column(a.column) &&
        (a.expensesArePositive === undefined || typeof a.expensesArePositive === "boolean")
      : a.mode === "debitCredit"
        ? column(a.debitColumn) && column(a.creditColumn)
        : a.mode === "inflowOutflow"
          ? column(a.inflowColumn) && column(a.outflowColumn)
          : a.mode === "signedByType" &&
            column(a.column) &&
            column(a.typeColumn) &&
            [a.debitValues, a.creditValues].every(
              (values) => Array.isArray(values) && values.length <= 50 && values.every(column),
            );
  if (
    !valid ||
    [m.category, m.transactionType, m.incomeSource, m.notes].some(
      (field) => field !== undefined && !column(field?.column),
    ) ||
    (m.account &&
      !("fixedName" in m.account ? column(m.account.fixedName) : column(m.account.column))) ||
    (m.date.format !== undefined && !column(m.date.format)) ||
    (m.decimal !== undefined && !["period", "comma"].includes(m.decimal))
  )
    throw new Error("Provide a valid column mapping.");
  return { mapping: m, categoryMap: {} };
}
