import { eq, inArray } from "drizzle-orm";
import { GroupError } from "@/lib/groups/validation";
import { getDb } from "@/db";
import { groups, groupMembers, groupActivity, users } from "@/db/schema";

/** Account-level mutations (password change, deletion). Thin DB wrappers so the
 *  route handlers stay testable by mocking this module. */

/** Set a new bcrypt password hash for a user. */
export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const db = getDb();
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** Delete private account data, detach household identity, and retain shared
 * financial history for the other members. Ownership must be resolved first;
 * the endpoint re-authenticates and explicitly explains this retention. */
export async function deleteUser(userId: string): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    // User-before-group is the same order as household writes: deletion cannot
    // race a new membership and orphan an unarchived household owner.
    await tx.select().from(users).where(eq(users.id, userId)).for("update");
    const memberships = await tx.select().from(groupMembers).where(eq(groupMembers.userId, userId));
    if (memberships.length) {
      const households = await tx
        .select()
        .from(groups)
        .where(
          inArray(
            groups.id,
            memberships.map((m) => m.groupId),
          ),
        )
        .orderBy(groups.id)
        .for("update");
      if (
        memberships.some(
          (m) =>
            m.role === "owner" &&
            m.status === "active" &&
            !households.find((g) => g.id === m.groupId)?.archivedAt,
        )
      ) {
        throw new GroupError(
          "Transfer ownership or archive your groups before deleting your account.",
          409,
        );
      }
      for (const member of memberships) {
        await tx.insert(groupActivity).values({
          groupId: member.groupId,
          actorId: member.id,
          action: "accountDeleted",
          entityId: member.id,
          detail: {},
        });
      }
      await tx
        .update(groupMembers)
        .set({
          userId: null,
          name: "Former member",
          role: "member",
          status: "deleted",
          updatedAt: new Date(),
        })
        .where(eq(groupMembers.userId, userId));
    }
    await tx.delete(users).where(eq(users.id, userId));
  });
}
