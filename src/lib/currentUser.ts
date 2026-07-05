import { getDb } from "@/db";
import { users } from "@/db/schema";
import type { User } from "./types";

/**
 * Resolves the "current" user. Authentication isn't built yet, so for now we
 * use the single seeded account. This is the one seam to replace when auth
 * (sessions / Neon-backed login) lands.
 */
export async function getCurrentUser(): Promise<User | null> {
  const db = getDb();
  const [row] = await db.select().from(users).limit(1);
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
