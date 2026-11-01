import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { toUser } from "@/lib/auth/currentUser";
import type { User } from "@/lib/types";
import type { ProfilePatch } from "./validation";

/** Update the signed-in user's editable profile fields (only those present in
 *  the patch). Returns the updated User, or null if the id no longer exists. */
export async function updateUser(userId: string, patch: ProfilePatch): Promise<User | null> {
  const [row] = await getDb()
    .update(users)
    .set({
      ...patch,
      // An older tab must never undo a newer acknowledgement on another device.
      ...(patch.whatsNewSeenVersion !== undefined
        ? {
            whatsNewSeenVersion: sql<number>`greatest(${users.whatsNewSeenVersion}, ${patch.whatsNewSeenVersion})`,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return row ? toUser(row) : null;
}
