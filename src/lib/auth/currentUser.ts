import { cookies } from "next/headers";
import type { User } from "@/lib/types";
import { SESSION_COOKIE } from "./session";
import { findUserByToken } from "./sessionRepository";

/** Resolve the logged-in user from the session cookie, or null. This is the
 *  session-based replacement for the old "first user" resolver; API routes
 *  switch to it in slice 3. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await findUserByToken(token);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    greetingName: row.name.split(" ")[0],
    email: row.email,
    currency: row.currency,
    budgetCycle: (row.budgetCycle as User["budgetCycle"]) ?? "monthly",
  };
}
