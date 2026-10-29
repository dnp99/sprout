import type { GroupMember, GroupSnapshot, GroupSplitDefault } from "./dto";

type Member = Pick<GroupMember, "id" | "status">;
type Weight = { memberId: string; weight: number };
/** A membership change requires owner review instead of silently renormalizing percentages. */
export function splitDefault(
  method: string,
  participants: Weight[],
  members: Member[],
): GroupSplitDefault {
  const active = members.filter((m) => m.status === "active");
  const valid =
    method === "equal" ||
    (method === "percentage" &&
      participants.length === active.length &&
      new Set(participants.map((p) => p.memberId)).size === participants.length &&
      participants.every(
        (p) =>
          active.some((m) => m.id === p.memberId) &&
          Number.isInteger(p.weight) &&
          p.weight >= 0 &&
          p.weight <= 10000,
      ) &&
      participants.reduce((sum, p) => sum + p.weight, 0) === 10000);
  return {
    method,
    valid,
    participants:
      method === "equal" ? active.map((m) => ({ memberId: m.id, weight: 1 })) : participants,
  };
}
/** Category rules override group defaults, including explicitly equal category splits. */
export function resolveGroupSplit(
  data: Pick<GroupSnapshot, "splitDefaults" | "categorySplits"> &
    Partial<Pick<GroupSnapshot, "categories">>,
  categoryId: string | null,
): GroupSplitDefault {
  const parentId = data.categories?.find((c) => c.id === categoryId)?.parentId;
  return (
    data.categorySplits?.find((s) => s.categoryId === categoryId) ??
    (parentId ? data.categorySplits?.find((s) => s.categoryId === parentId) : undefined) ??
    data.splitDefaults
  );
}
/** Zero-percent members start unchecked in manual drafts. */
export function splitDraft(split: GroupSplitDefault, members: Member[]) {
  const effective =
    split.valid && split.method !== "equal" ? split : splitDefault("equal", [], members);
  return {
    method: effective.method,
    participants: Object.fromEntries(
      effective.participants
        .filter((p) => p.weight > 0)
        .map((p) => [p.memberId, String(effective.method === "percentage" ? p.weight / 100 : 0)]),
    ),
  };
}
