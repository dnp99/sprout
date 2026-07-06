import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { toUser } from "@/lib/auth/currentUser";
import type { User } from "@/lib/types";
import type { ProfileUpdateInput } from "./validation";

/** Update the signed-in user's editable profile fields. Returns the updated
 *  User, or null if the id no longer exists. */
export async function updateUser(userId: string, input: ProfileUpdateInput): Promise<User | null> {
  const [row] = await getDb()
    .update(users)
    .set({
      name: input.name,
      currency: input.currency,
      budgetCycle: input.budgetCycle,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return row ? toUser(row) : null;
}
