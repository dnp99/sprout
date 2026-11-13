/** Exact category selections are an OR set. All clears only this dimension. */
export function toggleCategorySelection(selected: readonly string[], id: string): string[] {
  if (id === "all") return [];
  return selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
}
