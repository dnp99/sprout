import type { GroupEntry } from "./dto";

/** Keep refund families together and never replace an existing manual category. */
export function groupCategoryCandidates(entries: GroupEntry[], limit = 200): GroupEntry[] {
  const active = entries.filter((e) => !e.voidedAt);
  const result: GroupEntry[] = [];
  for (const expense of active) {
    if (expense.kind !== "expense" || expense.categoryId || !expense.merchant.trim()) continue;
    const family = [expense, ...active.filter((e) => e.refundOf === expense.id)];
    if (family.some((e) => e.categoryId) || result.length + family.length > limit) continue;
    result.push(...family);
  }
  return result;
}

/** Refunds inherit the original merchant's answer, never a separate AI guess. */
export function groupCategoryAssignments(entries: GroupEntry[], answers: Map<string, string>) {
  const assignments = new Map<string, string>();
  for (const entry of groupCategoryCandidates(entries)) {
    const original = entry.refundOf ? entries.find((e) => e.id === entry.refundOf) : entry;
    const categoryId = original && answers.get(original.merchant);
    if (categoryId) assignments.set(entry.id, categoryId);
  }
  return assignments;
}
