/** Sprout's built-in category keys (match the default categories). */
export type SproutCategoryKey = "bills" | "groceries" | "dining" | "shopping" | "transport" | "fun";

/** Normalize labels from a CSV and user-owned categories with the exact same
 * rule. This keeps an explicit source label (" Taxi ") reliably attached to
 * the user's "Taxi" category before broad preset or merchant defaults apply. */
export function normalizeCategoryLabel(value: string): string {
  return value.trim().toLowerCase();
}

/** Resolve an explicit category from an import against a user's own categories.
 * The caller provides IDs keyed by normalized names, which keeps this pure and
 * lets imports honour categories that do not belong to Sprout's built-in six. */
export function resolveUserCategoryId(
  sourceCategory: string | null,
  categoryIdByName: ReadonlyMap<string, string>,
): string | null {
  if (!sourceCategory) return null;
  return categoryIdByName.get(normalizeCategoryLabel(sourceCategory)) ?? null;
}

/** Resolve a raw source category to a Sprout key via a preset's map, or null
 *  (unmapped → imported uncategorized, re-mappable later since source_category
 *  is stored). */
export function resolveCategoryKey(
  sourceCategory: string | null,
  map: Record<string, SproutCategoryKey>,
): SproutCategoryKey | null {
  if (!sourceCategory) return null;
  return map[normalizeCategoryLabel(sourceCategory)] ?? null;
}
