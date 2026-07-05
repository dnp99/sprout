import { cookies } from "next/headers";
import type { UserRow } from "@/db/schema";
import type { User } from "@/lib/types";
import { SESSION_COOKIE } from "./session";
import { findUserByToken } from "./sessionRepository";

/** Map a DB user row to the app-facing User shape. */
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    greetingName: row.name.split(" ")[0],
    email: row.email,
    currency: row.currency,
    budgetCycle: (row.budgetCycle as User["budgetCycle"]) ?? "monthly",
  };
}

/** Resolve the logged-in user from the session cookie, or null. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await findUserByToken(token);
  return row ? toUser(row) : null;
}
