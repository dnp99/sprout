import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { resolveCategoryKey, type SproutCategoryKey } from "../lib/import/category-map";
import { persistTransactions, upsertAccount, type ResolvedRow } from "../lib/import/persist";
import { buildImportRows } from "../lib/import/pipeline";
import { monarchCategoryMap, monarchMapping } from "../lib/import/presets/monarch";
import { readCsv } from "../lib/import/read-csv";
import type { ImportMapping } from "../lib/import/types";
import { closeDb, getDb } from "./index";
import { categories, users } from "./schema";

// tsx does not auto-load .env.local — load it (same as db:seed).
function loadEnvFile(relativePath: string) {
  const fullPath = resolve(process.cwd(), relativePath);
  if (!existsSync(fullPath)) return;
  for (const line of readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!key || process.env[key] !== undefined) continue;
    const raw = trimmed.slice(eqIdx + 1).trim();
    process.env[key] =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
  }
}

/** Default category names per Sprout key (match the seeded / default set). */
const KEY_TO_NAME: Record<SproutCategoryKey, string> = {
  bills: "Bills & rent",
  groceries: "Groceries",
  dining: "Dining out",
  shopping: "Shopping",
  transport: "Transport",
  fun: "Fun",
};

function parseArgs(argv: string[]) {
  let email = "sam@sprout.money";
  let mapPath: string | undefined;
  let csvPath: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") email = argv[++i];
    else if (a === "--map") mapPath = argv[++i];
    else if (a === "--preset")
      i++; // only "monarch" for now
    else if (!a.startsWith("--")) csvPath = a;
  }
  return { email, mapPath, csvPath };
}

async function run() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const { email, mapPath, csvPath } = parseArgs(process.argv.slice(2));
  if (!csvPath) {
    console.error(
      "Usage: npm run db:import -- <path.csv> [--preset monarch|--map map.json] [--email <user>]",
    );
    process.exit(1);
  }

  const mapping: ImportMapping = mapPath
    ? (JSON.parse(readFileSync(resolve(process.cwd(), mapPath), "utf8")) as ImportMapping)
    : monarchMapping;
  const categoryMap = mapPath ? {} : monarchCategoryMap;

  const csvText = readFileSync(resolve(process.cwd(), csvPath), "utf8");
  const rows = buildImportRows(readCsv(csvText), mapping);

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`No user with email ${email}. Seed or sign up first.`);
    process.exit(1);
  }

  // Resolve category keys -> the user's category ids (by name).
  const userCategories = await db.select().from(categories).where(eq(categories.userId, user.id));
  const idByName = new Map(userCategories.map((c) => [c.name, c.id]));

  // Upsert every distinct source account once.
  const accountIdByName = new Map<string, string>();
  for (const name of new Set(rows.map((r) => r.sourceAccount).filter((n): n is string => !!n))) {
    accountIdByName.set(name, await upsertAccount(user.id, name));
  }

  const resolved: ResolvedRow[] = rows.map((row) => {
    const key = resolveCategoryKey(row.sourceCategory, categoryMap);
    const categoryId = key ? (idByName.get(KEY_TO_NAME[key]) ?? null) : null;
    const accountId = row.sourceAccount ? (accountIdByName.get(row.sourceAccount) ?? null) : null;
    return { row, categoryId, accountId };
  });

  const count = await persistTransactions(user.id, resolved);
  const excluded = rows.filter((r) => r.excludeFromBudget).length;
  const uncategorized = resolved.filter(
    (r) => r.categoryId === null && !r.row.excludeFromBudget,
  ).length;

  console.log(
    `Imported ${count} transactions for ${user.name} — ${excluded} excluded from budget, ` +
      `${uncategorized} uncategorized, ${accountIdByName.size} account(s).`,
  );
  await closeDb();
}

run().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
