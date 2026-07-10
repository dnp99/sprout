import { parseMagnitudeCents } from "../import/amount";

/** A parsed capture from a line of natural language ("spent 12 bucks on lunch").
 *
 *  The **sign of `amountCents`** carries income-vs-expense; there is deliberately
 *  no `kind` field — `classify` in the write path is the single source of truth
 *  for `kind`/`excludeFromBudget`, so exactly one place decides transaction type
 *  (see plans/008). Pure + unit-tested; `now` is injectable. */
export interface CaptureDraft {
  merchant: string;
  /** Signed integer cents: negative expense, positive income. 0 when unknown. */
  amountCents: number;
  /** ISO date ("2026-07-09") when the text named a day; omit → caller uses now. */
  occurredAt?: string;
  /** 0–1 confidence in the parse; low → the channel should ask, not guess. */
  confidence: number;
  /** True when no amount could be extracted (nothing to log yet). */
  needsClarification?: boolean;
  /** The original text, preserved for logging/debugging. */
  raw: string;
}

// A capture is income (positive) when it names one of these; otherwise expense.
const INCOME_WORDS = [
  "paid",
  "salary",
  "refund",
  "refunded",
  "deposit",
  "income",
  "received",
  "bonus",
  "reimbursed",
  "reimbursement",
];

// Noise tokens stripped from the leftover text to leave a clean merchant name.
const FILLER = new Set([
  "spent",
  "spend",
  "on",
  "for",
  "from",
  "got",
  "a",
  "an",
  "the",
  "at",
  "of",
  "to",
  "my",
  "me",
  "i",
  "was",
  "is",
  "dollar",
  "dollars",
  "buck",
  "bucks",
  "usd",
  "cad",
]);

// First money-like token: optional "$", digits with thousands/decimals, and an
// optional trailing currency word — matched whole (so we can cut it out) with
// the numeric part captured in group 1.
const MONEY = /\$?\s?(\d[\d,]*(?:\.\d{1,2})?)\s?(?:bucks?|dollars?|usd|cad)?/i;

/** Parse a line of natural language into a draft transaction. Deterministic —
 *  no API cost, always works. Anything it can't confidently split comes back
 *  with `needsClarification` so the caller can ask instead of guessing (the
 *  Haiku fallback layers on top of this in a later slice). */
export function parseCapture(text: string, now = new Date()): CaptureDraft {
  const raw = text;
  let working = ` ${text.toLowerCase().trim()} `;

  // Income vs expense from keywords (checked before fillers/amount are removed).
  const isIncome = INCOME_WORDS.some((w) => wordRe(w).test(working));

  // Relative dates: "today" / "yesterday" resolve against `now` and are stripped
  // from the merchant. Weekday parsing ("on Tuesday") is left to the AI fallback.
  let occurredAt: string | undefined;
  if (/\byesterday\b/.test(working)) {
    occurredAt = isoDate(addDays(now, -1));
    working = working.replace(/\byesterday\b/g, " ");
  } else if (/\btoday\b/.test(working)) {
    occurredAt = isoDate(now);
    working = working.replace(/\btoday\b/g, " ");
  }

  // Amount — the first money-like token. No number → nothing to log yet.
  const money = working.match(MONEY);
  if (!money || money.index === undefined) {
    return {
      merchant: cleanMerchant(working) || (isIncome ? "Income" : ""),
      amountCents: 0,
      confidence: 0.2,
      needsClarification: true,
      raw,
    };
  }
  const magnitude = parseMagnitudeCents(money[1]);
  working = `${working.slice(0, money.index)} ${working.slice(money.index + money[0].length)}`;

  // Merchant = whatever's left once fillers/income words are removed.
  let merchant = cleanMerchant(working);
  const defaulted = merchant === "";
  if (defaulted) merchant = isIncome ? "Income" : "Expense";

  return {
    merchant,
    amountCents: isIncome ? magnitude : -magnitude,
    occurredAt,
    // Confident only with a real amount AND a real (non-defaulted) merchant.
    confidence: magnitude === 0 ? 0.3 : defaulted ? 0.6 : 0.9,
    raw,
  };
}

/** Strip "$", punctuation, filler + income words; title-case the remainder. */
function cleanMerchant(s: string): string {
  const words = s
    .replace(/\$/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w]+|[^\w]+$/g, ""))
    .filter((w) => w && !FILLER.has(w) && !INCOME_WORDS.includes(w));
  return words.join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function wordRe(word: string): RegExp {
  return new RegExp(`\\b${word}\\b`);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
