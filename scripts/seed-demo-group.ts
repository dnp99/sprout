import env from "@next/env";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { groupCategories, groupMembers, groups, users } from "../src/db/schema";
import { seedUser } from "../src/db/seed-data";
import { mutateGroup } from "../src/lib/groups/repository";
import { parseOperation, type EntryInput } from "../src/lib/groups/validation";

/** Append through normal validation/audit/revision handling; never reset the demo account. */
async function main() {
  env.loadEnvConfig(process.cwd());
  const groupId = process.argv.find((arg) => arg.startsWith("--group="))?.slice(8);
  if (!groupId) throw new Error("Supply --group=<existing demo group UUID>.");
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, seedUser.email));
  if (!user) throw new Error("Existing demo account required.");
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, "active"),
      ),
    );
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!member || !group || group.archivedAt) throw new Error("Active demo group required.");
  const categories = await db
    .select()
    .from(groupCategories)
    .where(eq(groupCategories.groupId, groupId));
  const active = categories
    .filter((category) => !category.archived)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!active.length) throw new Error("At least one active category required.");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const month = today.slice(0, 7);
  const year = Number(today.slice(0, 4)),
    monthIndex = Number(today.slice(5, 7)) - 1;
  const previous = new Date(Date.UTC(year, monthIndex, 0));
  const previousMonth = previous.toISOString().slice(0, 7);
  const merchants = [
    "Maple Market",
    "Cedar Cafe",
    "Willow Transit",
    "Birch Books",
    "Pine Utilities",
    "Elm Cinema",
  ];
  if (!process.argv.includes("--apply")) {
    console.log(
      `Dry run: append 64 fictional records across ${previousMonth} and ${month}. Use --apply to save.`,
    );
    return;
  }
  const ids: string[] = [];
  async function save(index: number, entry: EntryInput) {
    const [fresh] = await db.select().from(groups).where(eq(groups.id, groupId!));
    // Stable mutation receipts make rerunning this month's fixture safe and non-duplicating.
    const hash = createHash("sha256").update(`demo-group-v1-${month}-${index}`).digest("hex");
    const mutationId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    const result = await mutateGroup(
      user.id,
      groupId!,
      parseOperation({
        mutationId,
        revision: fresh.revision,
        type: "entry",
        entry,
      }),
    );
    if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string")
      throw new Error("Record save returned no identifier.");
    ids.push(result.id);
  }
  for (let i = 0; i < 60; i++) {
    const income = i % 10 === 9;
    const occurredOn =
      i < 36
        ? `${month}-01`
        : `${previousMonth}-${String(1 + ((i * 7) % previous.getUTCDate())).padStart(2, "0")}`;
    await save(i, {
      kind: income ? "income" : "expense",
      amountCents: income ? 35000 + i * 100 : 425 + i * 137,
      merchant: income ? "Maple House contribution" : merchants[i % merchants.length],
      note: `[Demo] ${i + 1}: ${i % 4 === 0 ? "Shared household purchase — sample note for layout and search checks." : "Fictional test record"}`,
      occurredOn,
      categoryId: income || i % 8 === 0 ? null : active[i % active.length].id,
      payerId: i % 3 === 0 ? null : member.id,
      refundOf: null,
      settlement: !income && i % 3 !== 0,
      splitMethod: "equal",
      participants: [],
      reason: "Demo fixture",
    });
  }
  for (let i = 0; i < 4; i++) {
    await save(60 + i, {
      kind: "refund",
      amountCents: 100 + i * 50,
      merchant: "Maple Market return",
      note: "[Demo] Partial refund linked to a fictional expense",
      occurredOn: `${month}-01`,
      categoryId: null,
      payerId: member.id,
      refundOf: ids[i],
      settlement: true,
      splitMethod: "equal",
      participants: [],
      reason: "Demo fixture",
    });
  }
  console.log(
    "Verified 64 fictional records: 54 expenses, 6 income, 4 linked refunds. Existing records preserved.",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo fixture failed.");
    process.exitCode = 1;
  })
  .finally(closeDb);
