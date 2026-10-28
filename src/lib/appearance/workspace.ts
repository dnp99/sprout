/** Keep the larger budget region in the cool family so an account with many
 * flexible categories does not accidentally become a mostly-peach workspace. */
export function cozyBudgetSurface(
  groups: readonly { id: string; rowCount: number }[],
  id: string,
): "mint" | "peach" {
  const dominant = [...groups].sort((a, b) => b.rowCount - a.rowCount)[0];
  return dominant?.id === id ? "mint" : "peach";
}

/** Two cool companions per warm card echo Overview without rigid columns. */
export function cozyPanelSurface(index: number): "mint" | "peach" | "sky" {
  return (["mint", "peach", "sky"] as const)[index % 3];
}
