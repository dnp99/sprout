import type { GroupListItem } from "./dto";

/** Mirror shared member permissions for controls; the API remains the authority. */
export function canRecordRepayment(group: Pick<GroupListItem, "archivedAt">): boolean {
  return !group.archivedAt;
}
