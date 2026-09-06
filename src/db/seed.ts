import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import { closeDb, getDb } from "./index";
import { seedCategories, seedGoals, seedRecurring, seedTransactions, seedUser } from "./seed-data";
import { categories, goals, recurringItems, transactions, users } from "./schema";

// tsx does not auto-load .env.local — load it so `npm run db:seed` picks up
// DATABASE_URL the same way the drizzle config does.
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

async function seed() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  const db = getDb();

  // Idempotent: wipe Sam's data and re-insert.
  const existing = await db.select().from(users).where(eq(users.email, seedUser.email));
  if (existing[0]) {
    await db.delete(users).where(eq(users.id, existing[0].id)); // cascades to categories + transactions
  }

  // Demo login: sam@sprout.money / password123
  const passwordHash = await hashPassword("password123");
  const [user] = await db
    .insert(users)
    .values({
      name: seedUser.name,
      email: seedUser.email,
      currency: seedUser.currency,
      budgetCycle: seedUser.budgetCycle,
      passwordHash,
    })
    .returning();

  // Insert categories, remembering the seed key -> generated id mapping.
  const idBySeedKey = new Map<string, string>();
  for (let i = 0; i < seedCategories.length; i++) {
    const c = seedCategories[i];
    const [row] = await db
      .insert(categories)
      .values({
        userId: user.id,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        monthlyBudgetCents: c.monthlyBudgetCents,
        budgetGroup: c.budgetGroup,
        sortOrder: i,
      })
      .returning();
    idBySeedKey.set(c.id, row.id);
  }

  // Turn each transaction's daysAgo/hour offset into a real timestamp anchored
  // to today, so the seed is always current-month, month-to-date activity.
  const now = new Date();
  const dateFor = (daysAgo: number, hour: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, 0, 0);

  for (const t of seedTransactions) {
    await db.insert(transactions).values({
      userId: user.id,
      categoryId: t.categoryId ? (idBySeedKey.get(t.categoryId) ?? null) : null,
      merchant: t.merchant,
      amountCents: t.amountCents,
      note: t.note,
      method: t.method,
      status: "posted",
      occurredAt: dateFor(t.daysAgo, t.hour),
    });
  }

  for (let i = 0; i < seedGoals.length; i++) {
    const g = seedGoals[i];
    await db.insert(goals).values({
      userId: user.id,
      name: g.name,
      emoji: g.emoji,
      color: g.color,
      targetCents: g.targetCents,
      savedCents: g.savedCents,
      targetDate: g.targetDate,
      sortOrder: i,
    });
  }

  for (let i = 0; i < seedRecurring.length; i++) {
    const r = seedRecurring[i];
    await db.insert(recurringItems).values({
      userId: user.id,
      name: r.name,
      emoji: r.emoji,
      amountCents: r.amountCents,
      dayOfMonth: r.dayOfMonth,
      categoryId: r.categoryId ? (idBySeedKey.get(r.categoryId) ?? null) : null,
      sortOrder: i,
    });
  }

  console.log(
    `Seeded ${seedCategories.length} categories, ${seedTransactions.length} transactions, ` +
      `${seedGoals.length} goals and ${seedRecurring.length} recurring items for ${user.name}.`,
  );
  await closeDb();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
