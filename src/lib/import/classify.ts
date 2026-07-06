import type { TxnKind } from "./types";

/** Merchant names that are internal card/bill payments (paying off a credit
 *  card or a registered bill payee) rather than new spending. Detected by
 *  merchant because many exports carry no category. Kept deliberately tight to
 *  avoid catching real bills: e.g. "Mobile Bill Payment" (a phone bill) must
 *  NOT match, so "bill payment" only matches as the whole merchant. Pure —
 *  unit-tested. */
export function isCardOrBillPayment(merchant: string): boolean {
  const m = merchant.toLowerCase().replace(/\s+/g, " ").trim();
  if (!m) return false;
  // Unambiguous card-payment phrases, anywhere in the name.
  if (m.includes("card payment")) return true; // mastercard / credit card / visa card payment
  if (m.includes("american express")) return true;
  if (/\bamex\b/.test(m)) return true;
  // Issuer / generic bill payments — only when they ARE the whole merchant, so
  // "mobile bill payment" (a real phone bill) is left alone.
  return m === "bill payment" || m === "national bank of canada";
}

/** Derive kind + budget-exclusion for an imported row. Internal moves
 *  (transfers, card/loan/mortgage payments) are excluded from budget math;
 *  everything else is income (positive) or expense (negative). `sourceCategory`
 *  is used when the export provides one; `merchant` catches card/bill payments
 *  in exports that carry no category. */
export function classify(
  sourceCategory: string | null,
  amountCents: number,
  merchant = "",
): { kind: TxnKind; excludeFromBudget: boolean } {
  const c = (sourceCategory ?? "").toLowerCase();

  if (c.includes("transfer")) {
    return { kind: "transfer", excludeFromBudget: true };
  }
  if (
    c.includes("credit card payment") ||
    c.includes("card payment") ||
    c.includes("loan repayment") ||
    c.includes("loan payment") ||
    c.includes("mortgage payment")
  ) {
    return { kind: "payment", excludeFromBudget: true };
  }
  // Category gave us nothing — fall back to the merchant name.
  if (isCardOrBillPayment(merchant)) {
    return { kind: "payment", excludeFromBudget: true };
  }
  if (amountCents > 0) {
    return { kind: "income", excludeFromBudget: false };
  }
  return { kind: "expense", excludeFromBudget: false };
}
