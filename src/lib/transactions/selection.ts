/** Search narrows visible results, never the user's accumulated selection. */
export function hiddenSelectionCount(selectedIds: Iterable<string>, visibleIds: Iterable<string>) {
  const visible = new Set(visibleIds);
  return [...new Set(selectedIds)].filter((id) => !visible.has(id)).length;
}
