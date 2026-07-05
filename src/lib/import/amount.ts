/** Parse a money string into signed integer cents. Handles "$", thousands
 *  separators, a leading/trailing minus, and accounting parentheses. */
export function parseAmountToCents(raw: string | undefined | null): number {
  if (!raw) return 0;
  let s = raw.trim();
  if (s === "") return 0;

  let negative = false;
  // Accounting negatives: (27.74)
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-") || s.endsWith("-")) negative = true;

  // Keep digits and a decimal point only.
  s = s.replace(/[^0-9.]/g, "");
  if (s === "" || s === ".") return 0;

  const value = Number(s);
  // NaN guard via self-comparison (the isNaN helpers are blocked by es-compat).
  if (value !== value) return 0;

  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

/** Absolute magnitude in cents (for debit/credit + inflow/outflow columns). */
export function parseMagnitudeCents(raw: string | undefined | null): number {
  return Math.abs(parseAmountToCents(raw));
}
