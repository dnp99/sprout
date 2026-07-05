import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie } from "@/lib/auth/cookies";
import { toUser } from "@/lib/auth/currentUser";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/sessionRepository";
import { validateCredentials } from "@/lib/auth/validation";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const validation = validateCredentials(body);
    if (!validation.ok) return badRequest(validation.error);
    const { email, password } = validation.value;

    const db = getDb();
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!row || !row.passwordHash || !(await verifyPassword(password, row.passwordHash))) {
      return unauthorized("Wrong email or password.");
    }

    const { token, expiresAt } = await createSession(row.id);
    await setSessionCookie(token, expiresAt);
    return ok({ user: toUser(row) });
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return serverError();
  }
}
