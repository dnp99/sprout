import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { categories } from "../../db/schema";
import { resolveCategoryKey, type SproutCategoryKey } from "./category-map";
import { persistTransactions, upsertAccount, type ResolvedRow } from "./persist";
import { buildImportRows } from "./pipeline";
import { readCsv } from "./read-csv";
import type { ImportMapping } from "./types";

/** Default category names per Sprout key (match the seeded / default set). */
export const KEY_TO_NAME: Record<SproutCategoryKey, string> = {
  bills: "Bills & rent",
  groceries: "Groceries",
  dining: "Dining out",
  shopping: "Shopping",
  transport: "Transport",
  fun: "Fun",
};

export interface ImportSummary {
  imported: number;
  excluded: number;
  uncategorized: number;
  accounts: number;
}

/** Parse a CSV, map + classify + dedupe, resolve accounts/categories, and
 *  upsert for a user. Shared by the `db:import` script and `POST /api/import`. */
export async function runImport(
  userId: string,
  csvText: string,
  mapping: ImportMapping,
  categoryMap: Record<string, SproutCategoryKey>,
): Promise<ImportSummary> {
  const rows = buildImportRows(readCsv(csvText), mapping);
  const db = getDb();

  const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
  const idByName = new Map(userCategories.map((c) => [c.name, c.id]));

  const accountIdByName = new Map<string, string>();
  for (const name of new Set(rows.map((r) => r.sourceAccount).filter((n): n is string => !!n))) {
    accountIdByName.set(name, await upsertAccount(userId, name));
  }

  const resolved: ResolvedRow[] = rows.map((row) => {
    const key = resolveCategoryKey(row.sourceCategory, categoryMap);
    const categoryId = key ? (idByName.get(KEY_TO_NAME[key]) ?? null) : null;
    const accountId = row.sourceAccount ? (accountIdByName.get(row.sourceAccount) ?? null) : null;
    return { row, categoryId, accountId };
  });

  const imported = await persistTransactions(userId, resolved);
  return {
    imported,
    excluded: rows.filter((r) => r.excludeFromBudget).length,
    uncategorized: resolved.filter((r) => r.categoryId === null && !r.row.excludeFromBudget).length,
    accounts: accountIdByName.size,
  };
}
