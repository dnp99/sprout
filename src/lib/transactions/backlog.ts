import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb } from "../../db";
import { categories, transactions } from "../../db/schema";
import { categorizeMerchants } from "../import/ai-categorize";
import { isCardOrBillPayment } from "../import/classify";
import {
  loadMerchantRules,
  normalizeMerchant,
  saveMerchantRules,
  type MerchantRuleInput,
} from "../import/merchant-rules";

/** Maintenance passes that re-run the import's classification logic over rows
 *  that are already in the DB — used when a CSV imported with no category/type
 *  data, or to apply improved rules after the fact. Both are reusable by a
 *  future "clean up my transactions" endpoint, not just the CLI. */

/** Flag existing card/bill payments (Amex, Mastercard, "Bill Payment", …) as
 *  excluded from budget. Idempotent — only touches rows not already excluded.
 *  Returns the number of rows updated. */
export async function excludeCardBillPayments(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: transactions.id, merchant: transactions.merchant })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.excludeFromBudget, false)));

  const ids = rows.filter((r) => isCardOrBillPayment(r.merchant)).map((r) => r.id);
  if (ids.length === 0) return 0;

  await db
    .update(transactions)
    .set({ excludeFromBudget: true, kind: "payment", updatedAt: new Date() })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)));
  return ids.length;
}

export interface BacklogResult {
  /** Distinct merchant patterns considered (uncategorized, non-excluded). */
  patterns: number;
  /** Patterns resolved to a category (via cached rule or AI). */
  resolved: number;
  /** Transactions given a category as a result. */
  applied: number;
}

/** Categorize the user's backlog of uncategorized expenses. Groups them by
 *  normalized merchant, applies any cached merchant rule first, then asks Claude
 *  for the rest (caching each result as a rule), and finally writes the resolved
 *  category onto every matching transaction. Excluded rows (internal moves) are
 *  intentionally left uncategorized. Never throws on AI failure — it just
 *  resolves fewer patterns. */
export async function categorizeBacklog(userId: string): Promise<BacklogResult> {
  const db = getDb();
  const cats = await db.select().from(categories).where(eq(categories.userId, userId));
  const idByName = new Map(cats.map((c) => [c.name, c.id]));
  if (idByName.size === 0) return { patterns: 0, resolved: 0, applied: 0 };

  // Candidate rows: expenses with no category that still count toward budget.
  const rows = await db
    .select({ id: transactions.id, merchant: transactions.merchant })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.categoryId),
        eq(transactions.excludeFromBudget, false),
        lt(transactions.amountCents, 0),
      ),
    );

  // Collapse to normalized patterns: one representative display name + the row
  // ids that share it.
  const displayByPattern = new Map<string, string>();
  const idsByPattern = new Map<string, string[]>();
  for (const r of rows) {
    const pattern = normalizeMerchant(r.merchant);
    if (!pattern) continue;
    if (!displayByPattern.has(pattern)) displayByPattern.set(pattern, r.merchant);
    const ids = idsByPattern.get(pattern) ?? [];
    ids.push(r.id);
    idsByPattern.set(pattern, ids);
  }
  if (displayByPattern.size === 0) return { patterns: 0, resolved: 0, applied: 0 };

  // Layer 2: cached merchant rules first (free); AI only for the remainder.
  const cached = await loadMerchantRules(userId);
  const idByPattern = new Map<string, string>();
  const needAi: string[] = [];
  for (const [pattern] of displayByPattern) {
    const cachedId = cached.get(pattern);
    if (cachedId) idByPattern.set(pattern, cachedId);
    else needAi.push(pattern);
  }

  // Layer 3: AI fallback for uncached patterns; cache each result as a rule.
  if (needAi.length > 0) {
    const nameByDisplay = await categorizeMerchants(
      needAi.map((p) => displayByPattern.get(p) as string),
      [...idByName.keys()],
    );
    const newRules: MerchantRuleInput[] = [];
    for (const pattern of needAi) {
      const categoryName = nameByDisplay.get(displayByPattern.get(pattern) as string);
      const categoryId = categoryName ? idByName.get(categoryName) : undefined;
      if (!categoryId) continue;
      idByPattern.set(pattern, categoryId);
      newRules.push({ pattern, categoryId, source: "ai" });
    }
    await saveMerchantRules(userId, newRules);
  }

  // Apply resolved categories to their transactions.
  let applied = 0;
  for (const [pattern, categoryId] of idByPattern) {
    const ids = idsByPattern.get(pattern) ?? [];
    if (ids.length === 0) continue;
    await db
      .update(transactions)
      .set({ categoryId, updatedAt: new Date() })
      .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)));
    applied += ids.length;
  }

  return { patterns: displayByPattern.size, resolved: idByPattern.size, applied };
}
