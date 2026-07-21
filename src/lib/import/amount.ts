/** Money parsing for the import pipeline. Handles "$", thousands separators, a
 *  leading/trailing minus, and accounting parentheses. Decimal notation is
 *  declared by the caller (a preset) so a decimal comma can't silently change a
 *  value; undeclared input defaults to period (US) and is validated strictly by
 *  the preflight, which rejects genuinely ambiguous separators. */

export type DecimalNotation = "period" | "comma";

export type MoneyResult = { ok: true; cents: number } | { ok: false; reason: string };

const CURRENCY_STRIP = /[^0-9.,\s]/g;

/** Strip sign markers, currency, and normalize to a bare numeric string using
 *  the declared decimal separator. Returns the sign and the cleaned digits. */
function clean(raw: string, decimal: DecimalNotation): { negative: boolean; digits: string } {
  let s = raw.trim();
  let negative = false;

  // Accounting negatives: (27.74)
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-") || s.endsWith("-")) negative = true;

  // Drop currency symbols and stray letters, keep digits + separators.
  s = s.replace(CURRENCY_STRIP, "");

  if (decimal === "comma") {
    // Comma is the decimal; period/space are thousands separators.
    s = s.replace(/[.\s]/g, "").replace(",", ".");
  } else {
    // Period is the decimal; comma/space are thousands separators.
    s = s.replace(/[,\s]/g, "");
  }
  return { negative, digits: s };
}

/** Parse money into signed integer cents. Lenient — returns 0 for empty/garbage
 *  (used by the mapping pipeline, which the preflight validates separately). */
export function parseAmountToCents(
  raw: string | undefined | null,
  decimal: DecimalNotation = "period",
): number {
  if (!raw) return 0;
  const { negative, digits } = clean(raw, decimal);
  if (digits === "" || digits === ".") return 0;
  const value = Number(digits);
  // NaN guard via self-comparison (the isNaN helpers are blocked by es-compat).
  if (value !== value) return 0;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

/** Absolute magnitude in cents (for debit/credit + inflow/outflow columns). */
export function parseMagnitudeCents(
  raw: string | undefined | null,
  decimal: DecimalNotation = "period",
): number {
  return Math.abs(parseAmountToCents(raw, decimal));
}

/** Strict parse for the preflight: rejects empty, non-numeric, and — for
 *  undeclared/custom input — a lone thousands-style group (e.g. `1,234`) that
 *  could mean either 1.234 or 1,234. Declared presets never hit the ambiguity
 *  path because their separator is known. */
export function parseMoney(raw: string | undefined | null, decimal?: DecimalNotation): MoneyResult {
  const s = (raw ?? "").trim();
  if (s === "") return { ok: false, reason: "empty amount" };

  // Ambiguity: a single comma group with exactly 3 trailing digits and no other
  // separator (e.g. "1,234") is thousands-or-decimal ambiguous when undeclared.
  if (decimal === undefined) {
    const bareComma = s.replace(CURRENCY_STRIP, "");
    if (/^\d{1,3},\d{3}$/.test(bareComma)) {
      return { ok: false, reason: `ambiguous separator in "${s}" — declare decimal notation` };
    }
  }

  const notation = decimal ?? "period";
  const { negative, digits } = clean(s, notation);
  if (digits === "" || digits === ".") return { ok: false, reason: `not a number: "${s}"` };
  const value = Number(digits);
  if (value !== value) return { ok: false, reason: `not a number: "${s}"` };
  const cents = Math.round(value * 100);
  return { ok: true, cents: negative ? -cents : cents };
}
