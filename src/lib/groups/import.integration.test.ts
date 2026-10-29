import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "@/db";
import { users, groupMembers, groupEntries, transactions, groups } from "@/db/schema";
import { createGroup, getGroup, mutateGroup } from "./repository";
import { importGroup, parseGroupImport } from "./import";
import { exportGroup } from "./export";
import { parseOperation } from "./validation";
import { updateUser } from "@/lib/user/repository";
import { deleteUser } from "@/lib/auth/account";
const url = process.env.GROUP_TEST_DATABASE_URL;
const csv =
  "Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Market,-120,Bank,Expense,Groceries\n2026-10-02,Salary,200,Bank,Income,\n2026-10-03,Card payment,-20,Bank,Transfer,\n2026-10-04,Return,10,Bank,Reimbursement,\n2026-02-30,Invalid,-5,Bank,Expense,";

describe.skipIf(!url)("group imports in isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
  });
  afterAll(async () => {
    await closeDb();
  });
  async function user(name = "Importer") {
    const [row] = await getDb()
      .insert(users)
      .values({ email: `${randomUUID()}@example.test`, name })
      .returning();
    return row.id;
  }
  async function fixture() {
    const a = await user(),
      b = await user("Other payer"),
      g = (await createGroup(a, "Imported household")).id;
    const [payer] = await getDb()
      .insert(groupMembers)
      .values({ groupId: g, userId: b, name: "Other payer" })
      .returning();
    return { a, b, g, payer: payer.id };
  }
  async function input(
    f: Awaited<ReturnType<typeof fixture>>,
    extra: Record<string, unknown> = {},
  ) {
    return parseGroupImport({
      csv,
      preset: "sprout",
      payerId: f.payer,
      settlement: true,
      aiCategorize: false,
      revision: (await getGroup(f.a, f.g, "2026-10")).group.revision,
      mutationId: randomUUID(),
      ...extra,
    });
  }
  it("attributes the selected payer, snapshots shares, and never writes personal transactions", async () => {
    const f = await fixture(),
      request = await input(f);
    const result = await importGroup(f.a, f.g, request);
    expect(result).toMatchObject({ imported: 2, excluded: 3, reconciled: 0 });
    const snapshot = await getGroup(f.a, f.g, "2026-10");
    const expense = snapshot.entries.find((e) => e.kind === "expense")!;
    expect(expense.payerId).toBe(f.payer);
    expect(expense.authorId).toBe(snapshot.group.memberId);
    expect(expense.shares).toEqual([]);
    expect(expense.splitResult).toBeNull();
    expect(snapshot.balances).toEqual({});
    expect(snapshot.summary).toMatchObject({ spendingCents: 12000, incomeCents: 20000 });
    expect(
      await getDb().select().from(transactions).where(eq(transactions.userId, f.a)),
    ).toHaveLength(0);
    expect(await importGroup(f.a, f.g, request)).toEqual(result);
    await getDb()
      .update(groupEntries)
      .set({ merchant: "Edited name" })
      .where(eq(groupEntries.id, expense.id));
    const repeated = await importGroup(f.b, f.g, await input(f));
    expect(repeated).toMatchObject({ imported: 0, reconciled: 2 });
    expect(
      (await getGroup(f.a, f.g, "2026-10")).entries.some((e) => e.merchant === "Edited name"),
    ).toBe(true);
  });
  it("imports shared funds without allocating even when custom defaults exist", async () => {
    const f = await fixture();
    const snapshot = await getGroup(f.a, f.g, "2026-10");
    await mutateGroup(
      f.a,
      f.g,
      parseOperation({
        type: "defaults",
        method: "percentage",
        participants: [
          { memberId: snapshot.group.memberId, weight: 7500 },
          { memberId: f.payer, weight: 2500 },
        ],
        revision: snapshot.group.revision,
        mutationId: randomUUID(),
      }),
    );
    await importGroup(f.a, f.g, await input(f, { payerId: null, settlement: false }));
    const result = await getGroup(f.a, f.g, "2026-10");
    expect(Object.values(result.balances).every((v) => v === 0)).toBe(true);
    expect(
      result.entries
        .find((e) => e.kind === "expense")!
        .shares.map((s) => s.amountCents)
        .sort((a, b) => a - b),
    ).toEqual([]);
    expect(result.summary.spendingCents).toBe(12000);
  });
  it("rejects foreign payers, removed access, stale saves, and archived writes", async () => {
    const f = await fixture(),
      foreign = await fixture();
    await expect(
      importGroup(f.a, f.g, await input(f, { payerId: foreign.payer })),
    ).rejects.toThrow();
    await expect(importGroup(foreign.a, f.g, await input(f))).rejects.toThrow();
    const stale = await input(f);
    await importGroup(f.a, f.g, await input(f));
    await expect(importGroup(f.a, f.g, stale)).rejects.toMatchObject({ status: 409 });
    await getDb()
      .update(groupMembers)
      .set({ status: "removed" })
      .where(eq(groupMembers.id, f.payer));
    await expect(importGroup(f.b, f.g, await input(f))).rejects.toThrow();
    await getDb().update(groups).set({ archivedAt: new Date() }).where(eq(groups.id, f.g));
    await expect(importGroup(f.a, f.g, await input(f))).rejects.toMatchObject({ status: 409 });
  });
  it("serializes competing imports and exports only the authorized group's records", async () => {
    const f = await fixture(),
      request = await input(f);
    const results = await Promise.allSettled([
      importGroup(f.a, f.g, request),
      importGroup(f.a, f.g, { ...request, key: randomUUID() }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await getGroup(f.a, f.g, "2026-10")).totalEntries).toBe(2);
    const exported = await exportGroup(f.a, f.g, { format: "transactions", range: "all" });
    expect(exported).toContain('"-120.00"');
    expect(exported).toContain("Other payer");
    expect(exported).toContain("Payer,Author,Notes");
    await expect(exportGroup(await user(), f.g, { format: "transactions" })).rejects.toThrow();
    const audit = await exportGroup(f.a, f.g);
    expect(audit).toContain("Shares (cents)");
  });
  it("follows Account settings names in group views and exports, retaining anonymized deletion history", async () => {
    const f = await fixture();
    await importGroup(f.a, f.g, await input(f));
    const before = await getGroup(f.a, f.g, "2026-10");
    await updateUser(f.b, { name: "New account display name" });
    const after = await getGroup(f.a, f.g, "2026-10");
    expect(after.members.find((m) => m.id === f.payer)?.name).toBe("New account display name");
    expect(after.group.revision).toBe(before.group.revision);
    expect(after.balances).toEqual(before.balances);
    expect(after.entries.map((e) => e.payerId)).toEqual(before.entries.map((e) => e.payerId));
    for (const format of ["transactions", "audit"] as const) {
      const csv = await exportGroup(f.a, f.g, { format });
      expect(csv).toContain("New account display name");
      expect(csv).not.toContain("Other payer");
    }
    await deleteUser(f.b);
    const detached = await getGroup(f.a, f.g, "2026-10");
    expect(detached.members.find((m) => m.id === f.payer)).toMatchObject({
      userId: null,
      name: "Former member",
    });
    expect(detached.balances).toEqual(before.balances);
    expect(await exportGroup(f.a, f.g)).not.toContain("New account display name");
  });
});
