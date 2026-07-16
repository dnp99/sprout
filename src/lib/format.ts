import { DEFAULT_LOCALE, type AppLocale } from "./locale";

/** Currency + date formatting. Money is always handled as integer cents; the
 *  currency itself stays CAD (plan 013 — only *formatting* localizes). Every
 *  helper takes an explicit `locale` (defaulting to en-CA so untouched call
 *  sites render exactly as before); nothing reads mutable global state. */

interface FormatOptions {
  /** Prefix "+" / "−" and never show a bare leading "-". */
  signed?: boolean;
  /** Always show 2 decimals, even for whole-dollar amounts. */
  forceCents?: boolean;
  /** Display locale — storage is CAD cents regardless. */
  locale?: AppLocale;
}

const MINUS = "−"; // Unicode minus, matches the prototype's &minus;

/**
 * Format signed cents as a display string.
 *
 *   formatMoney(248000)                        -> "$2,480"
 *   formatMoney(-6420, { signed: true })       -> "−$64.20"
 *   formatMoney(495802, { locale: "fr-CA" })   -> "4 958,02 $"
 *
 * Cents are shown only when the amount isn't a whole dollar, unless
 * `forceCents` is set — matching how the design mixes "$520" and "−$64.20".
 */
export function formatMoney(cents: number, options: FormatOptions = {}): string {
  const { signed = false, forceCents = false, locale = DEFAULT_LOCALE } = options;
  const hasCents = cents % 100 !== 0;
  const fractionDigits = forceCents || hasCents ? 2 : 0;

  // en-CA + CAD renders a plain "$" (the app's default currency); fr-CA puts
  // the symbol after with comma decimals ("4 958,02 $").
  const amount = new Intl.NumberFormat(locale, {
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
export function formatBudgetInput(cents: number, locale: AppLocale = DEFAULT_LOCALE): string {
  if (cents <= 0) return "";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** The decimal + group separators a locale's numbers use, discovered from the
 *  formatter itself so parsing stays symmetric with formatting. */
function numberSeparators(locale: AppLocale): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
    group: parts.find((p) => p.type === "group")?.value ?? ",",
  };
}

/**
 * Parse a user-typed money string to integer cents, honouring the locale's
 * separators ("4,958.02" in en-CA; "4 958,02" in fr-CA — regular, no-break, and
 * narrow no-break spaces all count as grouping). Grouping, when present, must
 * sit on thousands boundaries; ambiguous or malformed input (and negatives —
 * budget amounts are never negative) returns `null`, which the inputs treat as
 * "unset".
 */
export function parseMoneyInput(value: string, locale: AppLocale = DEFAULT_LOCALE): number | null {
  const { decimal } = numberSeparators(locale);
  // Currency clutter is fine; a minus sign is not.
  const cleaned = value.replace(/\$|CAD/gi, "").trim();
  if (!cleaned || /[−-]/.test(cleaned)) return null;

  // Split off the fraction at the locale decimal ("," in fr-CA, "." in en-CA).
  const escapedDecimal = decimal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cleaned.match(new RegExp(`^(.+?)(?:${escapedDecimal}(\\d{1,2}))?$`));
  if (!match) return null;
  const [, wholeRaw, fraction = ""] = match;

  // The whole part is digits with optional thousands grouping — comma or any
  // space-family character (fr-CA's separator is a narrow no-break space, but
  // people type plain spaces).
  const whole = wholeRaw.trim();
  const digitsOnly = whole.replace(/[,\s  ]/g, "");
  if (!/^\d+$/.test(digitsOnly)) return null;
  const grouped = /^\d{1,3}([,\s  ]\d{3})+$/.test(whole);
  if (whole !== digitsOnly && !grouped) return null; // separators off the thousands boundaries

  const cents = Number(digitsOnly) * 100 + Number(fraction.padEnd(2, "0") || "0");
  if (!isFinite(cents) || cents <= 0) return null;
  return cents;
}

/** Parse a budget-input string to integer cents; 0 for empty/invalid input.
 *  Locale-aware `parseMoneyInput` with the legacy "0 = unset" contract. */
export function parseBudgetInput(value: string, locale: AppLocale = DEFAULT_LOCALE): number {
  return parseMoneyInput(value, locale) ?? 0;
}

/* ------------------------------------------------------------------ dates
 * The formatDate family replaces the inline `toLocaleDateString("en-US", …)`
 * call sites (plan 013 §B) so month/weekday names follow the app locale. All
 * helpers are UTC-stable where the caller's data is a month key / ISO date. */

/** "July 2026" — month + year, for headers and month pills. */
export function formatMonthYear(date: Date, locale: AppLocale = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/** "Jul 2026" — compact month + year, for steppers. */
export function formatShortMonthYear(date: Date, locale: AppLocale = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, { month: "short", year: "numeric", timeZone: "UTC" });
}

/** "Jul" — bare short month, for chart axis labels. */
export function formatShortMonth(date: Date, locale: AppLocale = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, { month: "short", timeZone: "UTC" });
}

/** "Jul 11" — short month + day, for transaction rows and due labels. */
export function formatShortDate(date: Date, locale: AppLocale = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

/** "Tuesday, Jul 14" — the mobile header's today line. */
export function formatWeekdayDate(date: Date, locale: AppLocale = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
}

/** "Friday" / "Fri" — weekday name (payday banner). */
export function formatWeekday(
  date: Date,
  width: "long" | "short",
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return date.toLocaleDateString(locale, { weekday: width });
}
