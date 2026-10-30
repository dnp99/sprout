/** Normalize a merchant string into a stable match key so small formatting
 *  differences (case, spacing, trailing store numbers/dates) collapse to one
 *  cached rule / one "similar" group. Pure — no DB access, safe to import in
 *  client components. Unit-tested via merchant-rules.test.ts. */
export function normalizeMerchant(merchant: string): string {
  return merchant
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N} ]+/gu, " ") // retain Chinese/accented names; punctuation splits tokens
    .replace(/(?:^|(?<=[^\p{L}\p{N}]))[A-Z0-9]*\d[A-Z0-9]*(?=$|[^\p{L}\p{N}])/gu, " ") // drop ASCII store/ref tokens without erasing adjacent Chinese
    .replace(/\s+/g, " ")
    .trim();
}
