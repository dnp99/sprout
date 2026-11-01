import type { GroupListItem } from "./dto";

/** Mirror server participation rules for controls; the API remains the authority. */
export function canRecordRepayment(
  group: Pick<GroupListItem, "role" | "memberId" | "archivedAt">,
  sender: string,
  recipient: string,
): boolean {
  return (
    !group.archivedAt && (group.role === "owner" || [sender, recipient].includes(group.memberId))
  );
}
