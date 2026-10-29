import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "@/db";
import { users, groupMembers } from "@/db/schema";
import { createGroup, getGroup, mutateGroup } from "./repository";
import { importGroup, parseGroupImport } from "./import";
import { parseOperation } from "./validation";
const url = process.env.GROUP_TEST_DATABASE_URL;
describe.skipIf(!url)("category splits in isolated PostgreSQL", () => {
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
      .values(["Owner", "Member"].map((name) => ({ name, email: `${randomUUID()}@example.test` })))
      .returning();
    const g = (await createGroup(a.id, "Category splits")).id;
    const [member] = await getDb()
      .insert(groupMembers)
      .values({ groupId: g, userId: b.id, name: b.name })
      .returning();
    const snapshot = () => getGroup(a.id, g, "2026-10");
    const initial = await snapshot();
    const food = initial.categories.find((c) => c.name === "Groceries")!;
    async function change(
      method: string,
      categoryId: string | null,
      ownerWeight = 7500,
      actor = a.id,
    ) {
      const data = await snapshot();
      return mutateGroup(
        actor,
        g,
        parseOperation({
          type: "defaults",
          method,
          categoryId,
          participants: [
            { memberId: initial.group.memberId, weight: ownerWeight },
            { memberId: member.id, weight: 10000 - ownerWeight },
          ],
          revision: data.group.revision,
          mutationId: randomUUID(),
        }),
      );
    }
    async function imported(description: string, category = "Groceries") {
      const data = await snapshot();
      const result = await importGroup(
        a.id,
        g,
        parseGroupImport({
          csv: `Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,${description},-100,Bank,Expense,${category}`,
          preset: "sprout",
          payerId: member.id,
          settlement: true,
          aiCategorize: false,
          revision: data.group.revision,
          mutationId: randomUUID(),
        }),
      );
      const current = await snapshot();
      const entry = current.entries.find((e) => e.merchant === description)!;
      expect(entry.shares).toEqual([]);
      await mutateGroup(
        a.id,
        g,
        parseOperation({
          type: "split",
          entries: [{ id: entry.id, version: entry.version, decision: "include" }],
          revision: current.group.revision,
          mutationId: randomUUID(),
        }),
      );
      return result;
    }
    return { a, b, g, member, initial, food, snapshot, change, imported };
  }
  it("persists category overrides and explicitly calculates imported records with inheritance", async () => {
    const f = await fixture();
    await f.change("percentage", null, 6000);
    await f.change("percentage", f.food.id, 7500);
    expect((await f.snapshot()).categorySplits).toMatchObject([
      { categoryId: f.food.id, method: "percentage", valid: true },
    ]);
    await f.imported("Category expense");
    await f.imported("Fallback expense", "");
    let data = await f.snapshot();
    const shares = (label: string) =>
      data.entries
        .find((e) => e.merchant === label)!
        .splitResult!.snapshot.shares.find((s) => s.memberId === f.initial.group.memberId)!
        .amountCents;
    expect(shares("Category expense")).toBe(7500);
    expect(shares("Fallback expense")).toBe(6000);
    await f.change("equal", f.food.id);
    await f.imported("Equal category");
    data = await f.snapshot();
    expect(shares("Equal category")).toBe(5000);
    expect(shares("Category expense")).toBe(7500);
    await f.change("inherit", f.food.id);
    await f.imported("Inherited category");
    data = await f.snapshot();
    expect(data.categorySplits).toEqual([]);
    expect(shares("Inherited category")).toBe(6000);
    expect(shares("Category expense")).toBe(7500);
  });
  it("rejects foreign categories, member writes and bad totals; allows uncalculated imports while saved splits need membership review", async () => {
    const f = await fixture(),
      foreign = await fixture();
    await expect(f.change("percentage", foreign.food.id)).rejects.toThrow("category");
    await expect(f.change("percentage", f.food.id, 7500, f.b.id)).rejects.toMatchObject({
      status: 403,
    });
    await expect(f.change("percentage", f.food.id, 10001)).rejects.toThrow();
    await f.change("percentage", null);
    await f.change("equal", f.food.id);
    await getDb()
      .update(groupMembers)
      .set({ status: "left" })
      .where(eq(groupMembers.id, f.member.id));
    // Use shared funds after the payer leaves; category-equal stays valid while group percentages require review.
    const data = await f.snapshot();
    expect(data.splitDefaults.valid).toBe(false);
    expect(data.categorySplits![0].valid).toBe(true);
    const input = (category: string) =>
      parseGroupImport({
        csv: `Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Expense ${category},-100,Bank,Expense,${category}`,
        preset: "sprout",
        payerId: null,
        settlement: false,
        aiCategorize: false,
        revision: data.group.revision,
        mutationId: randomUUID(),
      });
    await expect(importGroup(f.a.id, f.g, input(""))).resolves.toMatchObject({ imported: 1 });
    const updated = await f.snapshot();
    const second = input("Groceries");
    second.revision = updated.group.revision;
    await expect(importGroup(f.a.id, f.g, second)).resolves.toMatchObject({
      imported: 1,
    });
  });
});
