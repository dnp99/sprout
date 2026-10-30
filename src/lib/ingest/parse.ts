import { parseMagnitudeCents } from "../import/amount";
import {
  CAPTURE_EXPENSE,
  CAPTURE_INCOME,
  normalizeCaptureText,
  stripCaptureGrammar,
} from "./capture-language";

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
  "salaire",
  "revenu",
  "reçu",
  "reçue",
  "remboursement",
  "remboursé",
  "prime",
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
  "dépensé",
  "depense",
  "payé",
  "pour",
  "chez",
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "un",
  "une",
  "j’ai",
  "ai",
  "euros",
  "euro",
]);

// First money-like token: optional "$", digits with thousands/decimals, and an
// optional trailing currency word — matched whole (so we can cut it out) with
// the numeric part captured in group 1.
const MONEY =
  /[$¥￥]?\s?(\d[\d,]*(?:\.\d+)?)\s?(?:bucks?|dollars?|usd|cad|加元|加币|加幣|美元|港元|人民币|人民幣|块钱|塊錢|块|塊|元)?/i;

/** Parse a line of natural language into a draft transaction. Deterministic —
 *  no API cost, always works. Anything it can't confidently split comes back
 *  with `needsClarification` so the caller can ask instead of guessing (the
 *  Haiku fallback layers on top of this in a later slice). */
export function parseCapture(text: string, now = new Date()): CaptureDraft {
  const raw = text;
  let working = ` ${normalizeCaptureText(text).toLowerCase().trim()} `;

  // Income vs expense from keywords (checked before fillers/amount are removed).
  const isIncome =
    !CAPTURE_EXPENSE.test(working) &&
    (CAPTURE_INCOME.test(working) || INCOME_WORDS.some((w) => wordRe(w).test(working)));

  // Relative dates: "today" / "yesterday" resolve against `now` and are stripped
  // from the merchant. Weekday parsing ("on Tuesday") is left to the AI fallback.
  let occurredAt: string | undefined;
  if (/\byesterday\b|昨天|昨日|\bhier\b/.test(working)) {
    occurredAt = isoDate(addDays(now, -1));
    working = working.replace(/\byesterday\b|昨天|昨日|\bhier\b/g, " ");
  } else if (/\btoday\b|今天|今日|aujourd’hui|aujourd'hui/.test(working)) {
    occurredAt = isoDate(now);
    working = working.replace(/\btoday\b|今天|今日|aujourd’hui|aujourd'hui/g, " ");
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

  // Dates, multiple prices and over-precise amounts require interpretation.
  // A partial regex match must never quietly turn a date into spending.
  const validAmount = /^\d+(?:,\d{3})*(?:\.\d{1,2})?$/.test(money[1]);
  if (!validAmount || /\d/.test(working) || !Number.isSafeInteger(magnitude)) {
    return {
      merchant: cleanMerchant(working),
      amountCents: 0,
      confidence: 0.2,
      needsClarification: true,
      raw,
    };
  }

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
  const words = stripCaptureGrammar(s)
    .replace(/\$/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w && !FILLER.has(w) && !INCOME_WORDS.includes(w));
  return words.join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function wordRe(word: string): RegExp {
  return new RegExp(`(?:^|[^\\p{L}])${word}(?=$|[^\\p{L}])`, "u");
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
