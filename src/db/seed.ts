import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { mockCategories, mockTransactions, mockUser } from "../lib/mock";
import { closeDb, getDb } from "./index";
import { categories, transactions, users } from "./schema";

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
  const existing = await db.select().from(users).where(eq(users.email, mockUser.email));
  if (existing[0]) {
    await db.delete(users).where(eq(users.id, existing[0].id)); // cascades to categories + transactions
  }

  const [user] = await db
    .insert(users)
    .values({
      name: mockUser.name,
      email: mockUser.email,
      currency: mockUser.currency,
      budgetCycle: mockUser.budgetCycle,
    })
    .returning();

  // Insert categories, remembering the mock id -> generated id mapping.
  const idByMockId = new Map<string, string>();
  for (let i = 0; i < mockCategories.length; i++) {
    const c = mockCategories[i];
    const [row] = await db
      .insert(categories)
      .values({
        userId: user.id,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        monthlyBudgetCents: c.monthlyBudgetCents,
        sortOrder: i,
      })
      .returning();
    idByMockId.set(c.id, row.id);
  }

  // The mock transactions carry display labels, not real timestamps, so derive a
  // descending occurredAt (most recent first) that preserves their order.
  const now = Date.now();
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  for (let i = 0; i < mockTransactions.length; i++) {
    const t = mockTransactions[i];
    const parsed = t.occurredAt ? new Date(t.occurredAt) : null;
    const occurredAt = parsed && parsed.getTime() > 0 ? parsed : new Date(now - i * SIX_HOURS);
    await db.insert(transactions).values({
      userId: user.id,
      categoryId: t.categoryId ? (idByMockId.get(t.categoryId) ?? null) : null,
      merchant: t.merchant,
      amountCents: t.amountCents,
      note: t.note ?? null,
      method: t.method,
      status: t.status,
      occurredAt,
    });
  }

  console.log(
    `Seeded ${mockCategories.length} categories and ${mockTransactions.length} transactions for ${user.name}.`,
  );
  await closeDb();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
