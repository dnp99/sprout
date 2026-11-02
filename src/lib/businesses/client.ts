import { fetchWithTimeout } from "@/lib/api";
import type { Transaction } from "@/lib/types";

/** Load all business pages; account identity is checked on every page, including unassigned activity. */
export async function fetchBusinessActivity(
  businessId: string,
  userId: string,
  signal: AbortSignal,
): Promise<Transaction[]> {
  const rows = new Map<string, Transaction>();
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({ businessId, limit: "500", offset: String(offset) });
    const response = await fetchWithTimeout(`/api/transactions?${params}`, {
      signal,
      cache: "no-store",
    });
    if (!response.ok) throw Error("Business activity could not be loaded.");
    const page = await response.json();
    if (page.userId !== userId || !Array.isArray(page.transactions))
      throw Error("Account changed.");
    for (const row of page.transactions as Transaction[]) rows.set(row.id, row);
    if (!page.hasMore) return [...rows.values()];
    if (!page.transactions.length) throw Error("Incomplete business activity page.");
    offset += page.transactions.length;
  }
}
