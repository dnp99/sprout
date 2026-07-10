import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { monarchCategoryMap, monarchMapping } from "../lib/import/presets/monarch";
import { runImport } from "../lib/import/run";
import type { ImportMapping } from "../lib/import/types";
import { closeDb, getDb } from "./index";
import { users } from "./schema";

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

function parseArgs(argv: string[]) {
  let email = "sam@sprout.money";
  let mapPath: string | undefined;
  let csvPath: string | undefined;
  let ai = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") email = argv[++i];
    else if (a === "--map") mapPath = argv[++i];
    else if (a === "--ai") ai = true;
    else if (a === "--preset")
      i++; // only "monarch" for now
    else if (!a.startsWith("--")) csvPath = a;
  }
  return { email, mapPath, csvPath, ai };
}

async function run() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const { email, mapPath, csvPath, ai } = parseArgs(process.argv.slice(2));
  if (!csvPath) {
    console.error(
      "Usage: npm run db:import -- <path.csv> [--preset monarch|--map map.json] [--email <user>] [--ai]",
    );
    process.exit(1);
  }

  const mapping: ImportMapping = mapPath
    ? (JSON.parse(readFileSync(resolve(process.cwd(), mapPath), "utf8")) as ImportMapping)
    : monarchMapping;
  const categoryMap = mapPath ? {} : monarchCategoryMap;
  const csvText = readFileSync(resolve(process.cwd(), csvPath), "utf8");

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`No user with email ${email}. Seed or sign up first.`);
    process.exit(1);
  }

  const s = await runImport(user.id, csvText, mapping, categoryMap, { aiCategorize: ai });
  console.log(
    `Imported ${s.imported} transactions for ${user.name} — ${s.excluded} excluded from budget, ` +
      `${s.uncategorized} uncategorized, ${s.reconciled} reconciled, ${s.accounts} account(s)` +
      (ai ? `, ${s.aiCategorized} AI-categorized.` : "."),
  );
  await closeDb();
}

run().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
