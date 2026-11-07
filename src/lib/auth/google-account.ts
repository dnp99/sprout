import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, categories } from "@/db/schema";
import { buildDefaultCategories } from "@/lib/categories/default-tree";

export class GoogleAccountExists extends Error {}
/** Never silently merge financial accounts by email. A subject match can sign in,
 * while new accounts and their category tree are provisioned atomically. Unique
 * constraints fail closed when concurrent signups race. */
export async function googleAccount(identity: { subject: string; email: string; name: string }) {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.googleSubject, identity.subject))
      .limit(1);
    if (existing) return existing;
    const [emailMatch] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, identity.email))
      .limit(1);
    if (emailMatch) throw new GoogleAccountExists();
    const [created] = await tx
      .insert(users)
      .values({ name: identity.name, email: identity.email, googleSubject: identity.subject })
      .returning();
    await tx
      .insert(categories)
      .values(
        buildDefaultCategories(randomUUID).map((category) => ({ ...category, userId: created.id })),
      );
    return created;
  });
}
