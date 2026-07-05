/** Sprout's built-in category keys (match the default categories). */
export type SproutCategoryKey = "bills" | "groceries" | "dining" | "shopping" | "transport" | "fun";

/** Resolve a raw source category to a Sprout key via a preset's map, or null
 *  (unmapped → imported uncategorized, re-mappable later since source_category
 *  is stored). */
export function resolveCategoryKey(
  sourceCategory: string | null,
  map: Record<string, SproutCategoryKey>,
): SproutCategoryKey | null {
  if (!sourceCategory) return null;
  return map[sourceCategory.toLowerCase().trim()] ?? null;
}
