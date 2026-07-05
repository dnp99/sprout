import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { merchantRules } from "../../db/schema";

/** Normalize a merchant string into a stable match key so small formatting
 *  differences (case, spacing, trailing store numbers/dates) collapse to one
 *  cached rule. Pure — unit-tested. */
export function normalizeMerchant(merchant: string): string {
  return merchant
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ") // punctuation (#, *, -) → space, splitting tokens
    .replace(/\b[A-Z0-9]*\d[A-Z0-9]*\b/g, " ") // drop any token with a digit (store/ref numbers)
    .replace(/\s+/g, " ")
    .trim();
}

/** Load a user's cached merchant → categoryId rules, keyed by normalized
 *  pattern. A rule may point at a null category (kept, but not useful). */
export async function loadMerchantRules(userId: string): Promise<Map<string, string | null>> {
  const db = getDb();
  const rows = await db
    .select({ pattern: merchantRules.pattern, categoryId: merchantRules.categoryId })
    .from(merchantRules)
    .where(eq(merchantRules.userId, userId));
  return new Map(rows.map((r) => [r.pattern, r.categoryId]));
}

export interface MerchantRuleInput {
  pattern: string;
  categoryId: string;
  source?: "ai" | "manual";
}

/** Upsert merchant rules on (user_id, pattern) so a merchant is cached once. */
export async function saveMerchantRules(userId: string, rules: MerchantRuleInput[]): Promise<void> {
  if (rules.length === 0) return;
  const db = getDb();
  const now = new Date();
  await db
    .insert(merchantRules)
    .values(rules.map((r) => ({ userId, ...r, source: r.source ?? "ai" })))
    .onConflictDoUpdate({
      target: [merchantRules.userId, merchantRules.pattern],
      set: {
        categoryId: sql`excluded.category_id`,
        source: sql`excluded.source`,
        updatedAt: now,
      },
    });
}
