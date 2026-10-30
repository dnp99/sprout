/** Only large record deletions interrupt with a second confirmation. Whole-group
 * closure has its own confirmation independent of this record-count policy. */
export function requiresDeleteConfirmation(count: number): boolean {
  return count > 5;
}
