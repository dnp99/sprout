import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "@/db";
import { users, groupMembers, groupEntries, groups, transactions } from "@/db/schema";
import { createGroup, getGroup, mutateGroup } from "./repository";
import { importGroup, parseGroupImport } from "./import";
import { bulkGroup } from "./bulk";
import { parseGroupBulk } from "./bulk-validation";
import { parseOperation } from "./validation";
const url = process.env.GROUP_TEST_DATABASE_URL;
describe.skipIf(!url)("group bulk actions in isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
  });
  afterAll(async () => {
    await closeDb();
  });
  async function fixture() {
    const [a, b] = await getDb()
      .insert(users)
      .values(
        ["Bulk owner", "Bulk member"].map((name) => ({
          name,
          email: `${randomUUID()}@example.test`,
        })),
      )
      .returning();
    const source = (await createGroup(a.id, "Source")).id,
      target = (await createGroup(a.id, "Destination")).id;
    await getDb()
      .insert(groupMembers)
      .values([source, target].map((groupId) => ({ groupId, userId: b.id, name: b.name })));
    const snapshot = (id = source) => getGroup(a.id, id, "2026-10");
    const initial = await snapshot();
    await importGroup(
      a.id,
      source,
      parseGroupImport({
        csv: "Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Market,-100,Bank,Expense,Groceries\n2026-10-02,Salary,200,Bank,Income,",
        preset: "sprout",
        payerId: initial.group.memberId,
        settlement: true,
        aiCategorize: false,
        revision: initial.group.revision,
        mutationId: randomUUID(),
      }),
    );
    async function request(
      action: Record<string, unknown>,
      rows?: { id: string; version: number }[],
    ) {
      const data = await snapshot();
      return parseGroupBulk({
        mutationId: randomUUID(),
        revision: data.group.revision,
        entries: rows ?? data.entries.map(({ id, version }) => ({ id, version })),
        ...action,
      });
    }
    return { a: a.id, b: b.id, source, target, snapshot, request };
  }
  it("exports only explicit authorized rows; metadata edits preserve shares; stale and invalid batches roll back", async () => {
    const f = await fixture(),
      before = await f.snapshot(),
      expense = before.entries.find((e) => e.kind === "expense")!;
    const chosen = [{ id: expense.id, version: expense.version }];
    const exported = await bulkGroup(f.a, f.source, await f.request({ action: "export" }, chosen));
    expect(exported.csv).toContain("Market");
    expect(exported.csv).not.toContain("Salary");
    await expect(
      bulkGroup(
        f.a,
        f.source,
        await f.request({ action: "date", occurredOn: "2026-10-10" }, [
          ...chosen,
          { id: randomUUID(), version: 0 },
        ]),
      ),
    ).rejects.toThrow();
    expect((await f.snapshot()).entries.find((e) => e.id === expense.id)?.occurredOn).toBe(
      "2026-10-01",
    );
    const stale = await f.request({ action: "date", occurredOn: "2026-10-12" });
    await bulkGroup(f.b, f.source, await f.request({ action: "date", occurredOn: "2026-10-10" }));
    await expect(bulkGroup(f.a, f.source, stale)).rejects.toMatchObject({ status: 409 });
    const category = before.categories.find((c) => c.name === "Dining out")!;
    await bulkGroup(
      f.b,
      f.source,
      await f.request({ action: "category", categoryId: category.id }),
    );
    const after = await f.snapshot();
    expect(
      after.entries.every(
        (e) => e.categoryId === category.id && e.occurredOn === "2026-10-10" && e.version === 2,
      ),
    ).toBe(true);
    expect(after.entries.find((e) => e.id === expense.id)?.shares).toEqual(expense.shares);
    expect(after.balances).toEqual(before.balances);
  });
  it("copies with destination payer/defaults atomically and idempotently, isolating source and personal finances", async () => {
    const f = await fixture(),
      dest = await f.snapshot(f.target),
      before = await f.snapshot();
    const member = dest.members.find((m) => m.userId === f.b)!;
    await mutateGroup(
      f.a,
      f.target,
      parseOperation({
        type: "defaults",
        method: "percentage",
        participants: dest.members.map((m) => ({
          memberId: m.id,
          weight: m.userId === f.b ? 2500 : 7500,
        })),
        revision: dest.group.revision,
        mutationId: randomUUID(),
      }),
    );
    const request = await f.request({
      action: "copy",
      targetId: f.target,
      targetRevision: (await f.snapshot(f.target)).group.revision,
      payerId: member.id,
      settlement: true,
    });
    const result = await bulkGroup(f.a, f.source, request);
    expect(await bulkGroup(f.a, f.source, request)).toEqual(result);
    const copied = await f.snapshot(f.target),
      source = await f.snapshot();
    expect(copied.totalEntries).toBe(2);
    expect(
      copied.entries.every((e) => e.payerId === member.id && e.authorId === dest.group.memberId),
    ).toBe(true);
    const expense = copied.entries.find((e) => e.kind === "expense")!;
    expect(expense.shares.map((s) => s.amountCents).sort((a, b) => a - b)).toEqual([2500, 7500]);
    expect(expense.categoryId).toBe(copied.categories.find((c) => c.name === "Groceries")!.id);
    expect(source.entries).toEqual(before.entries);
    expect(source.balances).toEqual(before.balances);
    expect(
      await getDb().select().from(transactions).where(eq(transactions.userId, f.a)),
    ).toHaveLength(0);
    const stale = await f.request({
      action: "copy",
      targetId: f.target,
      targetRevision: dest.group.revision,
      payerId: member.id,
      settlement: true,
    });
    await expect(bulkGroup(f.a, f.source, stale)).rejects.toMatchObject({ status: 409 });
    expect((await f.snapshot(f.target)).totalEntries).toBe(2);
  });
  it("enforces delete authority, source/destination membership, payer ownership and archived groups", async () => {
    const f = await fixture(),
      other = await fixture(),
      dest = await f.snapshot(f.target);
    await expect(
      bulkGroup(f.b, f.source, await f.request({ action: "delete", reason: "Duplicate" })),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      bulkGroup(other.a, f.source, await f.request({ action: "export" })),
    ).rejects.toThrow();
    await expect(
      bulkGroup(
        f.a,
        f.source,
        await f.request({
          action: "copy",
          targetId: other.target,
          targetRevision: 0,
          payerId: null,
          settlement: false,
        }),
      ),
    ).rejects.toThrow();
    await expect(
      bulkGroup(
        f.a,
        f.source,
        await f.request({
          action: "copy",
          targetId: f.target,
          targetRevision: dest.group.revision,
          payerId: randomUUID(),
          settlement: true,
        }),
      ),
    ).rejects.toThrow();
    expect((await f.snapshot(f.target)).totalEntries).toBe(0);
    await getDb().update(groups).set({ archivedAt: new Date() }).where(eq(groups.id, f.target));
    await expect(
      bulkGroup(
        f.a,
        f.source,
        await f.request({
          action: "copy",
          targetId: f.target,
          targetRevision: dest.group.revision,
          payerId: null,
          settlement: false,
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    await bulkGroup(
      f.a,
      f.source,
      await f.request({ action: "delete", reason: "Duplicate import" }),
    );
    expect((await f.snapshot()).totalEntries).toBe(0);
    const rows = await getDb()
      .select()
      .from(groupEntries)
      .where(eq(groupEntries.groupId, f.source));
    expect(rows).toHaveLength(2);
    expect(rows.every((e) => e.voidedAt && e.version === 1)).toBe(true);
  });
});
