import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { merchantRules } from "../../db/schema";

// Re-exported for existing importers; the implementation is pure (no DB) so it
// can also be used from client components.
export { normalizeMerchant } from "./normalize";

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
  /** Human-readable merchant for the rules manager (optional). */
  label?: string;
}

/** Upsert merchant rules on (user_id, pattern) so a merchant is cached once.
 *  A user's **manual** rule is authoritative: the AI/import path never overwrites
 *  it (the `setWhere` guard skips the update when an existing rule is manual). */
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
        label: sql`coalesce(excluded.label, ${merchantRules.label})`,
        updatedAt: now,
      },
      setWhere: sql`${merchantRules.source} <> 'manual'`,
    });
}
