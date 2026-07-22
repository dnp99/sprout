import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, merchantRules, transactions } from "@/db/schema";
import { normalizeMerchant } from "@/lib/import/normalize";
import { ruleMatches } from "./match";

/** A rule as shown in the manager: readable label + resolved category. */
export interface RuleView {
  id: string;
  label: string;
  pattern: string;
  categoryId: string | null;
  categoryName: string | null;
  source: "ai" | "manual";
}

/** List a user's merchant rules, newest-relevant first (alphabetical by label). */
export async function listRules(userId: string): Promise<RuleView[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: merchantRules.id,
      pattern: merchantRules.pattern,
      label: merchantRules.label,
      categoryId: merchantRules.categoryId,
      source: merchantRules.source,
      categoryName: categories.name,
    })
    .from(merchantRules)
    .leftJoin(categories, eq(merchantRules.categoryId, categories.id))
    .where(eq(merchantRules.userId, userId));

  return rows
    .map((r) => ({
      id: r.id,
      pattern: r.pattern,
      label: r.label ?? r.pattern,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      source: r.source === "manual" ? ("manual" as const) : ("ai" as const),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Create (or update) a user's manual rule for a merchant. Manual rules are
 *  authoritative — this upsert intentionally overwrites an existing rule for the
 *  same normalized merchant. Returns the rule's id + pattern, or null if the
 *  merchant normalizes to nothing (too generic to key on). */
export async function upsertManualRule(
  userId: string,
  merchant: string,
  categoryId: string,
): Promise<{ id: string; pattern: string } | null> {
  const pattern = normalizeMerchant(merchant);
  if (!pattern) return null;
  const db = getDb();
  const label = merchant.trim();
  const [row] = await db
    .insert(merchantRules)
    .values({ userId, pattern, label, categoryId, source: "manual" })
    .onConflictDoUpdate({
      target: [merchantRules.userId, merchantRules.pattern],
      set: { categoryId, label, source: "manual", updatedAt: new Date() },
    })
    .returning({ id: merchantRules.id, pattern: merchantRules.pattern });
  return row ?? null;
}

/** Recategorize a rule (editing an AI rule promotes it to manual). */
export async function updateRuleCategory(
  userId: string,
  id: string,
  categoryId: string,
): Promise<{ pattern: string } | null> {
  const db = getDb();
  const [row] = await db
    .update(merchantRules)
    .set({ categoryId, source: "manual", updatedAt: new Date() })
    .where(and(eq(merchantRules.id, id), eq(merchantRules.userId, userId)))
    .returning({ pattern: merchantRules.pattern });
  return row ?? null;
}

/** Delete a rule. Existing transactions keep their category. */
export async function deleteRule(userId: string, id: string): Promise<boolean> {
  const db = getDb();
  const removed = await db
    .delete(merchantRules)
    .where(and(eq(merchantRules.id, id), eq(merchantRules.userId, userId)))
    .returning({ id: merchantRules.id });
  return removed.length > 0;
}

/** Apply a rule to existing transactions: set `categoryId` on every
 *  categorizable transaction (not income, not excluded) whose merchant
 *  normalizes to `pattern`. Returns how many rows changed. */
export async function applyRuleToExisting(
  userId: string,
  pattern: string,
  categoryId: string,
): Promise<number> {
  if (!pattern) return 0;
  const db = getDb();
  const rows = await db
    .select({
      id: transactions.id,
      merchant: transactions.merchant,
      amountCents: transactions.amountCents,
      excludeFromBudget: transactions.excludeFromBudget,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  const ids = rows
    .filter((r) => r.amountCents < 0 && !r.excludeFromBudget && ruleMatches(r.merchant, pattern))
    .map((r) => r.id);
  if (ids.length === 0) return 0;

  await db
    .update(transactions)
    .set({ categoryId, updatedAt: new Date() })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)));
  return ids.length;
}
