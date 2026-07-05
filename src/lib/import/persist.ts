import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { accounts, transactions } from "../../db/schema";
import type { ImportRow } from "./types";

const BATCH = 500;

/** Find-or-create an account by (user, name); returns its id. */
export async function upsertAccount(userId: string, name: string): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.name, name)))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [row] = await db.insert(accounts).values({ userId, name }).returning({ id: accounts.id });
  return row.id;
}

export interface ResolvedRow {
  row: ImportRow;
  categoryId: string | null;
  accountId: string | null;
}

/** Insert import rows, upserting on the (user_id, external_id) partial unique
 *  index so re-running an overlapping export updates instead of duplicating. */
export async function persistTransactions(
  userId: string,
  resolved: ResolvedRow[],
): Promise<number> {
  const db = getDb();
  const now = new Date();
  const values = resolved.map(({ row, categoryId, accountId }) => ({
    userId,
    categoryId,
    accountId,
    merchant: row.merchant,
    amountCents: row.amountCents,
    note: row.note,
    method: "import",
    status: "posted",
    kind: row.kind,
    excludeFromBudget: row.excludeFromBudget,
    externalId: row.externalId,
    sourceCategory: row.sourceCategory,
    sourceAccount: row.sourceAccount,
    importedAt: now,
    occurredAt: new Date(row.occurredAt),
  }));

  for (let i = 0; i < values.length; i += BATCH) {
    await db
      .insert(transactions)
      .values(values.slice(i, i + BATCH))
      .onConflictDoUpdate({
        target: [transactions.userId, transactions.externalId],
        targetWhere: sql`${transactions.externalId} is not null`,
        set: {
          merchant: sql`excluded.merchant`,
          amountCents: sql`excluded.amount_cents`,
          categoryId: sql`excluded.category_id`,
          accountId: sql`excluded.account_id`,
          note: sql`excluded.note`,
          kind: sql`excluded.kind`,
          excludeFromBudget: sql`excluded.exclude_from_budget`,
          sourceCategory: sql`excluded.source_category`,
          sourceAccount: sql`excluded.source_account`,
          occurredAt: sql`excluded.occurred_at`,
          updatedAt: now,
        },
      });
  }

  return values.length;
}
