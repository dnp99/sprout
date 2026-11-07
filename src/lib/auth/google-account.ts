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

export class GoogleLinkError extends Error {
  constructor(public reason: "email" | "conflict") {
    super(reason);
  }
}
export async function googleLinkStatus(userId: string) {
  const [user] = await getDb()
    .select({ subject: users.googleSubject })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return !!user?.subject;
}
/** Linking changes only the authenticated user's identity column, never account
 * ownership or records. Lock the user row so concurrent links cannot replace an
 * identity; the unique subject constraint also protects races across accounts. */
export async function linkGoogleAccount(
  userId: string,
  identity: { subject: string; email: string },
) {
  await getDb().transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!user || user.email.trim().toLowerCase() !== identity.email)
      throw new GoogleLinkError("email");
    if (user.googleSubject && user.googleSubject !== identity.subject)
      throw new GoogleLinkError("conflict");
    const [owner] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.googleSubject, identity.subject))
      .limit(1);
    if (owner && owner.id !== userId) throw new GoogleLinkError("conflict");
    await tx
      .update(users)
      .set({ googleSubject: identity.subject, updatedAt: new Date() })
      .where(eq(users.id, userId));
  });
}
