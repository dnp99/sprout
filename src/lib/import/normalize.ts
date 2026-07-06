/** Normalize a merchant string into a stable match key so small formatting
 *  differences (case, spacing, trailing store numbers/dates) collapse to one
 *  cached rule / one "similar" group. Pure — no DB access, safe to import in
 *  client components. Unit-tested via merchant-rules.test.ts. */
export function normalizeMerchant(merchant: string): string {
  return merchant
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ") // punctuation (#, *, -) → space, splitting tokens
    .replace(/\b[A-Z0-9]*\d[A-Z0-9]*\b/g, " ") // drop any token with a digit (store/ref numbers)
    .replace(/\s+/g, " ")
    .trim();
}
