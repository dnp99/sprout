/** Currency formatting. Money is always handled as integer cents. */

interface FormatOptions {
  /** Prefix "+" / "−" and never show a bare leading "-". */
  signed?: boolean;
  /** Always show 2 decimals, even for whole-dollar amounts. */
  forceCents?: boolean;
}

const MINUS = "−"; // Unicode minus, matches the prototype's &minus;

/**
 * Format signed cents as a display string.
 *
 *   formatMoney(248000)                    -> "$2,480"
 *   formatMoney(-6420, { signed: true })   -> "−$64.20"
 *   formatMoney(320000, { signed: true })  -> "+$3,200"
 *
 * Cents are shown only when the amount isn't a whole dollar, unless
 * `forceCents` is set — matching how the design mixes "$520" and "−$64.20".
 */
export function formatMoney(cents: number, options: FormatOptions = {}): string {
  const { signed = false, forceCents = false } = options;
  const hasCents = cents % 100 !== 0;
  const fractionDigits = forceCents || hasCents ? 2 : 0;

  // en-CA + CAD renders a plain "$" (the app's default currency); en-US would
  // prefix "CA$" instead.
  const amount = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(cents) / 100);

  if (signed) {
    return cents < 0 ? `${MINUS}${amount}` : `+${amount}`;
  }
  return cents < 0 ? `${MINUS}${amount}` : amount;
}

/** Percent of budget spent, clamped to 0–100 for progress bars. */
export function spentPercent(spentCents: number, budgetCents: number): number {
  if (budgetCents <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((spentCents / budgetCents) * 100)));
}

/**
 * Format cents as an editable budget-input string (grouped, no currency symbol).
 * An unset budget (0 or negative) renders **blank** so the field shows its
 * placeholder rather than "0" — 0 means "never set", not "$0.00". See plans/007.
 */
export function formatBudgetInput(cents: number): string {
  if (cents <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Parse a budget-input string to integer cents; 0 for empty/invalid input. */
export function parseBudgetInput(value: string): number {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  if (!isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 100);
}
