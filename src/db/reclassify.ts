import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { categorizeBacklog, excludeCardBillPayments } from "../lib/transactions/backlog";
import { closeDb, getDb } from "./index";
import { users } from "./schema";

/** Maintenance CLI: re-classify an existing transaction backlog.
 *
 *   npm run db:reclassify -- [--email <user>] [--exclude] [--ai]
 *
 *  --exclude  flag card/bill payments as excluded from budget (default: on)
 *  --ai       AI-categorize the uncategorized expense backlog (Haiku)
 *  With no flags, runs the exclusion pass only.
 */

// tsx does not auto-load .env.local — load it (same as db:seed / db:import).
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
  let ai = false;
  let exclude = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") email = argv[++i];
    else if (a === "--ai") ai = true;
    else if (a === "--exclude") exclude = true;
  }
  // Default to the exclusion pass when no pass is named.
  if (!ai && !exclude) exclude = true;
  return { email, ai, exclude };
}

async function run() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const { email, ai, exclude } = parseArgs(process.argv.slice(2));
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`No user with email ${email}.`);
    process.exit(1);
  }

  if (exclude) {
    const n = await excludeCardBillPayments(user.id);
    console.log(`Excluded ${n} card/bill payment transaction(s) from budget.`);
  }

  if (ai) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set — skipping AI categorization.");
    } else {
      const r = await categorizeBacklog(user.id);
      console.log(
        `AI backlog: ${r.resolved}/${r.patterns} merchant patterns resolved, ` +
          `${r.applied} transaction(s) categorized.`,
      );
    }
  }

  await closeDb();
}

run().catch((error) => {
  console.error("Reclassify failed:", error);
  process.exit(1);
});
