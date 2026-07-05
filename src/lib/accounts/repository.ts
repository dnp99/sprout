import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts } from "@/db/schema";
import type { ConnectedAccount } from "@/lib/types";
import { toConnectedAccount } from "./dto";

/** A user's accounts (created by CSV import), in display order. */
export async function listAccounts(userId: string): Promise<ConnectedAccount[]> {
  const rows = await getDb()
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.sortOrder), asc(accounts.name));
  return rows.map(toConnectedAccount);
}
