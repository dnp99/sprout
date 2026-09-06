import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { categories, incomeSources, transactions } from "../../db/schema";
import { categorizeMerchants } from "./ai-categorize";
import {
  normalizeCategoryLabel,
  resolveCategoryKey,
  resolveUserCategoryId,
  type SproutCategoryKey,
} from "./category-map";
import {
  loadMerchantRules,
  normalizeMerchant,
  saveMerchantRules,
  type MerchantRuleInput,
} from "./merchant-rules";
import { persistTransactions, upsertAccount, type ResolvedRow } from "./persist";
import { partitionReconciled, type ReconcileCandidate } from "./reconcile";
import { buildImportRows } from "./pipeline";
import { readCsv } from "./read-csv";
import type { ImportMapping, ImportSummary } from "./types";

/** Default category names per Sprout key (match the seeded / default set). */
export const KEY_TO_NAME: Record<SproutCategoryKey, string> = {
  bills: "Bills & rent",
  groceries: "Groceries",
  dining: "Dining out",
  shopping: "Shopping",
  transport: "Transport",
  fun: "Fun",
};

export interface ImportOptions {
  /** Run the Claude fallback for merchants left uncategorized after the static
   *  map + cached merchant rules. Best-effort; never blocks the import. */
  aiCategorize?: boolean;
}

/** Parse a CSV, map + classify + dedupe, resolve accounts/categories, and
 *  upsert for a user. Shared by the `db:import` script and `POST /api/import`. */
export async function runImport(
  userId: string,
  csvText: string,
  mapping: ImportMapping,
  categoryMap: Record<string, SproutCategoryKey>,
  options: ImportOptions = {},
): Promise<ImportSummary> {
  const rows = buildImportRows(readCsv(csvText), mapping);
  const db = getDb();

  const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
  const idByName = new Map(userCategories.map((c) => [c.name, c.id]));
  const categoryIdByNormalizedName = new Map(
    userCategories.map((category) => [normalizeCategoryLabel(category.name), category.id]),
  );
  const userIncomeSources = await db
    .select()
    .from(incomeSources)
    .where(eq(incomeSources.userId, userId));
  const incomeSourceIdByName = new Map(
    userIncomeSources.map((source) => [source.name.trim().toLocaleLowerCase(), source.id]),
  );

  const accountIdByName = new Map<string, string>();
  for (const name of new Set(rows.map((r) => r.sourceAccount).filter((n): n is string => !!n))) {
    accountIdByName.set(name, await upsertAccount(userId, name));
  }

  // Layer 1 (static map) + layer 2 (cached merchant rules).
  const ruleByPattern = await loadMerchantRules(userId);
  const resolved: ResolvedRow[] = rows.map((row) => {
    // The file's explicit category is the most specific signal. It must win
    // over a broad preset mapping or "Uber → Transport" merchant rule, so a
    // user who has a Taxi category keeps their spreadsheet's Taxi rows there.
    const explicitCategoryId = resolveUserCategoryId(
      row.sourceCategory,
      categoryIdByNormalizedName,
    );
    const key = explicitCategoryId ? null : resolveCategoryKey(row.sourceCategory, categoryMap);
    let categoryId = explicitCategoryId ?? (key ? (idByName.get(KEY_TO_NAME[key]) ?? null) : null);
    if (categoryId === null && !row.excludeFromBudget) {
      categoryId = ruleByPattern.get(normalizeMerchant(row.merchant)) ?? null;
    }
    const accountId = row.sourceAccount ? (accountIdByName.get(row.sourceAccount) ?? null) : null;
    // Imported source labels resolve only to user-managed sources. An unknown
    // label stays unassigned, which avoids silently proliferating sources.
    const incomeSourceId =
      row.amountCents > 0 && row.sourceIncome
        ? (incomeSourceIdByName.get(row.sourceIncome.trim().toLocaleLowerCase()) ?? null)
        : null;
    return { row, categoryId, incomeSourceId, accountId };
  });

  // Layer 3 (AI fallback): categorize merchants still uncategorized, then cache
  // each result as a merchant rule and apply it to this run's rows.
  let aiCategorized = 0;
  if (options.aiCategorize) {
    aiCategorized = await applyAiCategorization(userId, resolved, [...idByName.entries()]);
  }

  // Reconcile against prior channel captures (WhatsApp/Siri): a purchase both
  // captured and present in this CSV is skipped, so it isn't double-counted
  // (plans/008). Manual/imported rows aren't reconciliation candidates.
  const captures = await loadChannelCaptures(userId);
  const { toWrite, reconciled } = partitionReconciled(
    resolved,
    (entry) => ({ amountCents: entry.row.amountCents, occurredAt: entry.row.occurredAt }),
    captures,
  );

  const imported = await persistTransactions(userId, toWrite);
  return {
    imported,
    excluded: toWrite.filter((r) => r.row.excludeFromBudget).length,
    uncategorized: toWrite.filter((r) => r.categoryId === null && !r.row.excludeFromBudget).length,
    reconciled,
    accounts: accountIdByName.size,
    aiCategorized,
  };
}

/** Prior channel captures (WhatsApp/Siri) for reconciliation — just the money +
 *  time needed to spot a CSV row that duplicates one. */
async function loadChannelCaptures(userId: string): Promise<ReconcileCandidate[]> {
  const db = getDb();
  return db
    .select({
      id: transactions.id,
      amountCents: transactions.amountCents,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), inArray(transactions.source, ["whatsapp", "siri"])),
    );
}

/** Ask Claude to categorize the still-uncategorized merchants, cache the results
 *  as merchant rules, and fill them into `resolved` in place. Returns how many
 *  distinct merchant patterns the AI resolved. */
async function applyAiCategorization(
  userId: string,
  resolved: ResolvedRow[],
  categoryEntries: [string, string][],
): Promise<number> {
  // One representative merchant name per normalized pattern still missing a
  // category (skip internal moves — they're intentionally uncategorized).
  const displayByPattern = new Map<string, string>();
  for (const { row, categoryId } of resolved) {
    if (categoryId !== null || row.excludeFromBudget) continue;
    const pattern = normalizeMerchant(row.merchant);
    if (pattern && !displayByPattern.has(pattern)) displayByPattern.set(pattern, row.merchant);
  }
  if (displayByPattern.size === 0) return 0;

  const idByName = new Map(categoryEntries);
  const nameByDisplay = await categorizeMerchants(
    [...displayByPattern.values()],
    [...idByName.keys()],
  );

  // Map each resolved merchant back to its pattern → categoryId.
  const idByPattern = new Map<string, string>();
  const rules: MerchantRuleInput[] = [];
  for (const [pattern, display] of displayByPattern) {
    const categoryName = nameByDisplay.get(display);
    const categoryId = categoryName ? idByName.get(categoryName) : undefined;
    if (!categoryId) continue;
    idByPattern.set(pattern, categoryId);
    // `display` is a real merchant string for this pattern — store it as the
    // readable label so the rules manager shows "Amazon", not "AMAZON".
    rules.push({ pattern, categoryId, source: "ai", label: display });
  }
  if (idByPattern.size === 0) return 0;

  for (const entry of resolved) {
    if (entry.categoryId !== null || entry.row.excludeFromBudget) continue;
    const categoryId = idByPattern.get(normalizeMerchant(entry.row.merchant));
    if (categoryId) entry.categoryId = categoryId;
  }

  await saveMerchantRules(userId, rules);
  return idByPattern.size;
}
