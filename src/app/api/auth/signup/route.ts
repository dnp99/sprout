import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, users } from "@/db/schema";
import { setSessionCookie } from "@/lib/auth/cookies";
import { toUser } from "@/lib/auth/currentUser";
import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/sessionRepository";
import { validateCredentials } from "@/lib/auth/validation";
import { badRequest, ok, serverError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const validation = validateCredentials(body, true);
    if (!validation.ok) return badRequest(validation.error);
    const { email, password, name } = validation.value;

    const db = getDb();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) return badRequest("That email is already registered.");

    const passwordHash = await hashPassword(password);
    const [row] = await db
      .insert(users)
      .values({ name: name ?? email, email, passwordHash })
      .returning();

    // Give the new user a starter set of categories.
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((c, i) => ({
        userId: row.id,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        monthlyBudgetCents: c.monthlyBudgetCents,
        budgetGroup: c.budgetGroup,
        sortOrder: i,
      })),
    );

    const { token, expiresAt } = await createSession(row.id);
    await setSessionCookie(token, expiresAt);
    return ok({ user: toUser(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/signup failed:", error);
    return serverError();
  }
}
