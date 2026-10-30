import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { getDb, closeDb } from "@/db";
import { users, groupMembers } from "@/db/schema";
import { createGroup, getGroup, mutateGroup } from "./repository";
import { importGroup, parseGroupImport } from "./import";
import { parseOperation } from "./validation";
import {
  categoryTreeDraft,
  mergeGroupCategory,
  moveGroupCategory,
  type CategoryTreeDraft,
} from "./category-tree";
import { exportGroup } from "./export";
const url = process.env.GROUP_TEST_DATABASE_URL;
describe.skipIf(!url)("group category trees in isolated PostgreSQL", () => {
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
        ["Tree owner", "Tree member"].map((name) => ({
          name,
          email: `${randomUUID()}@example.test`,
        })),
      )
      .returning();
    const g = (await createGroup(a.id, "Tree household")).id;
    await getDb().insert(groupMembers).values({ groupId: g, userId: b.id, name: b.name });
    const snapshot = (month = "2026-10") => getGroup(a.id, g, month);
    async function save(draft: CategoryTreeDraft, expectedRevision?: number, actor = a.id) {
      const data = await snapshot();
      return mutateGroup(
        actor,
        g,
        parseOperation({
          type: "categoryTree",
          draft,
          expectedRevision: expectedRevision ?? data.group.revision,
          revision: data.group.revision,
          mutationId: randomUUID(),
        }),
      );
    }
    return { a: a.id, b: b.id, g, snapshot, save };
  }
  it("persists promotion/demotion and atomically merges records and monthly budgets without altering money or shares", async () => {
    const f = await fixture(),
      initial = await f.snapshot(),
      food = initial.categories.find((c) => c.name === "Groceries")!,
      dining = initial.categories.find((c) => c.name === "Dining out")!;
    await importGroup(
      f.a,
      f.g,
      parseGroupImport({
        csv: "Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Market,-100,Bank,Expense,Groceries\n2026-10-02,Cafe,-50,Bank,Expense,Dining out",
        preset: "sprout",
        payerId: initial.group.memberId,
        settlement: true,
        aiCategorize: false,
        revision: initial.group.revision,
        mutationId: randomUUID(),
      }),
    );
    for (const month of ["2026-09", "2026-10"]) {
      const data = await f.snapshot();
      await mutateGroup(
        f.a,
        f.g,
        parseOperation({
          type: "budget",
          month,
          poolCents: 30000,
          allocations: { [food.id]: 10000, [dining.id]: 5000 },
          revision: data.group.revision,
          mutationId: randomUUID(),
        }),
      );
    }
    const before = await f.snapshot(),
      originalShares = before.entries.map((e) => e.shares);
    const moved = moveGroupCategory(categoryTreeDraft(before.categories), food.id, dining.id);
    moved.recordChoices = [{ categoryId: food.id, action: "keep" }];
    await f.save(moved);
    expect((await f.snapshot()).categories.find((c) => c.id === food.id)?.parentId).toBe(dining.id);
    const csv = await exportGroup(f.a, f.g, { format: "transactions" });
    expect(csv).toContain("Dining out / Groceries");
    const afterMove = await f.snapshot();
    let draft = moveGroupCategory(categoryTreeDraft(afterMove.categories), food.id, null);
    const fresh = randomUUID();
    draft.nodes.push({
      id: fresh,
      name: "Everyday",
      emoji: "🏷️",
      color: food.color,
      parentId: null,
    });
    draft = mergeGroupCategory(
      draft,
      food.id,
      fresh,
      before.categories.map((c) => c.id),
    );
    draft = mergeGroupCategory(
      draft,
      dining.id,
      fresh,
      before.categories.map((c) => c.id),
    );
    const rev = afterMove.group.revision,
      request = parseOperation({
        type: "categoryTree",
        draft,
        expectedRevision: rev,
        revision: rev,
        mutationId: randomUUID(),
      });
    const result = await mutateGroup(f.a, f.g, request);
    expect(await mutateGroup(f.a, f.g, request)).toEqual(result);
    const after = await f.snapshot();
    expect(after.entries.every((e) => e.categoryId === fresh && e.version === 1)).toBe(true);
    expect(after.entries.map((e) => e.shares)).toEqual(originalShares);
    expect(after.balances).toEqual(before.balances);
    expect(after.summary.spendingCents).toBe(before.summary.spendingCents);
    expect(
      after.categories.filter((c) => [food.id, dining.id].includes(c.id)).every((c) => c.archived),
    ).toBe(true);
    for (const month of ["2026-09", "2026-10"]) {
      const data = await f.snapshot(month);
      expect(data.budget.allocations).toEqual({ [fresh]: 15000 });
      expect(data.budget.poolCents).toBe(30000);
    }
  });
  it("rejects member writes, foreign parents, omitted categories and stale drafts without partial writes", async () => {
    const f = await fixture(),
      other = await fixture(),
      before = await f.snapshot(),
      foreign = (await other.snapshot()).categories[0].id;
    const draft = categoryTreeDraft(before.categories);
    await expect(f.save(draft, undefined, f.b)).rejects.toMatchObject({ status: 403 });
    await expect(
      f.save({
        ...draft,
        nodes: draft.nodes.map((n, i) => (i === 0 ? { ...n, parentId: foreign } : n)),
      }),
    ).rejects.toThrow();
    await expect(f.save({ ...draft, nodes: draft.nodes.slice(1) })).rejects.toThrow();
    await f.save(moveGroupCategory(draft, draft.nodes[0].id, draft.nodes[1].id));
    await expect(f.save(draft, before.group.revision)).rejects.toMatchObject({ status: 409 });
    const after = await f.snapshot();
    expect(after.categories).toHaveLength(before.categories.length);
    expect(after.categories.find((c) => c.id === draft.nodes[0].id)?.parentId).toBe(
      draft.nodes[1].id,
    );
  });
});
