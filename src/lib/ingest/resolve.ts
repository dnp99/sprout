import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { categorizeMerchants } from "@/lib/import/ai-categorize";
import {
  loadMerchantRules,
  normalizeMerchant,
  saveMerchantRules,
} from "@/lib/import/merchant-rules";

/** Resolve a single merchant → categoryId, reusing import's layers 2–3: cached
 *  `merchant_rules` first, then the Haiku categorizer (`categorizeMerchants`),
 *  writing a confident result back as a rule so it's one-time per merchant.
 *
 *  Import categorizes a whole batch in one AI call; ingest resolves one merchant
 *  at a time (low volume), so this is the per-merchant sibling of that path — the
 *  shared primitive is `categorizeMerchants`. Best-effort: any AI failure (or no
 *  key) resolves to null and the row stays uncategorized, exactly like import. */
export async function resolveMerchantCategory(
  userId: string,
  merchant: string,
): Promise<string | null> {
  const pattern = normalizeMerchant(merchant);
  if (!pattern) return null;

  // Layer 2 — cached merchant rule.
  const rules = await loadMerchantRules(userId);
  const cached = rules.get(pattern);
  if (cached) return cached;

  // Layer 3 — Haiku, mapped to one of the user's own categories, then cached.
  const db = getDb();
  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  if (cats.length === 0) return null;

  const idByName = new Map(cats.map((c) => [c.name, c.id]));
  const nameByDisplay = await categorizeMerchants([merchant], [...idByName.keys()]);
  const categoryName = nameByDisplay.get(merchant);
  const categoryId = categoryName ? idByName.get(categoryName) : undefined;
  if (!categoryId) return null;

  await saveMerchantRules(userId, [{ pattern, categoryId, source: "ai" }]);
  return categoryId;
}
