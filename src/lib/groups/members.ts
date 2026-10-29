import { eq } from "drizzle-orm";
import { groupMembers, users } from "@/db/schema";
import type { GroupTx } from "./context";

/** Account settings own display names. Membership names are only a fallback
 * for detached/deleted accounts, whose anonymized history must stay intact.
 * Call only after authorizing the group; never select other account fields. */
export async function listGroupMembers(tx: GroupTx, groupId: string) {
  const rows = await tx
    .select({ member: groupMembers, accountName: users.name })
    .from(groupMembers)
    .leftJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
  return rows.map(({ member, accountName }) => ({ ...member, name: accountName ?? member.name }));
}
