/** Keep cents-style keyboard and keypad entry consistent across independent ledgers. */
export function appendAmountKey(cents: number, key: string): number {
  if (key === "back") return Math.floor(cents / 10);
  if (key === "00") return Math.min(cents * 100, 9_999_999);
  if (!/^[0-9]$/.test(key)) return cents;
  return Math.min(cents * 10 + Number(key), 9_999_999);
}
