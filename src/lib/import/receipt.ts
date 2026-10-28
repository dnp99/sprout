export interface ReceiptDraft {
  merchant: string;
  date: string;
  totalCents: number | null;
  items: { description: string; amountCents: number }[];
}
/** Ignore invented/invalid model fields. Totals are metadata, never another
 * item: importing both would double count the receipt. Tax may be its own row. */
export function validateReceipt(value: unknown): ReceiptDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.merchant !== "string" || !Array.isArray(raw.items) || raw.items.length > 100)
    return null;
  const items: ReceiptDraft["items"] = [];
  for (const item of raw.items) {
    if (
      !item ||
      typeof item.description !== "string" ||
      !item.description.trim() ||
      !Number.isSafeInteger(item.amountCents) ||
      item.amountCents <= 0 ||
      item.amountCents > 100000000
    )
      return null;
    items.push({
      description: item.description.trim().slice(0, 120),
      amountCents: item.amountCents,
    });
  }
  if (!items.length) return null;
  const date =
    typeof raw.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.date) &&
    isFinite(Date.parse(raw.date)) &&
    new Date(raw.date).toISOString().slice(0, 10) === raw.date
      ? raw.date
      : "";
  return {
    merchant: raw.merchant.trim().slice(0, 120),
    date,
    items,
    totalCents:
      Number.isSafeInteger(raw.totalCents) && Number(raw.totalCents) > 0
        ? Number(raw.totalCents)
        : null,
  };
}
