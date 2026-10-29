import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { getDb, closeDb } from "@/db";
import { groupEntries, groupEntryShares, groupRepayments } from "@/db/schema";
import { randomUUID } from "node:crypto";
import { bulkGroup } from "./bulk";
import { parseGroupBulk } from "./bulk-validation";
import { categoryTreeDraft, mergeGroupCategory } from "./category-tree";
import { eq } from "drizzle-orm";
import { snapshot, mutate, fixture, entry } from "./integration-fixtures";
const url = process.env.GROUP_TEST_DATABASE_URL;
// A separate, explicitly named test database is mandatory; ordinary npm test skips this suite.
describe.skipIf(!url)("split workspace on isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
  });
  afterAll(async () => {
    await closeDb();
  });
  it("keeps originals independent and acknowledges edits without reapplying excluded versions", async () => {
    const f = await fixture();
    const result = await entry(f, {}, false);
    let row = (await snapshot(f.a, f.g)).entries.find((e) => e.id === result.id)!;
    expect(row.shares).toEqual([]);
    expect(row.splitResult).toBeNull();
    expect((await snapshot(f.a, f.g)).balances).toEqual({});
    const split = () =>
      mutate(f.b, f.g, {
        type: "split",
        entries: [{ id: row.id, version: row.version, decision: "include" }],
      });
    await split();
    await split();
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(6000);
    const edit = async (amount: number, includeNextSplit = true) => {
      await entry(
        f,
        { id: row.id, version: row.version, amountCents: amount, includeNextSplit },
        false,
      );
      row = (await snapshot(f.a, f.g)).entries.find((e) => e.id === row.id)!;
    };
    await edit(18000);
    expect(row.splitResult?.review).toBe("pending");
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(6000);
    await mutate(f.b, f.g, {
      type: "split",
      entries: [{ id: row.id, version: row.version, decision: "exclude" }],
    });
    row = (await snapshot(f.a, f.g)).entries.find((e) => e.id === row.id)!;
    expect(row.splitResult?.review).toBe("excluded");
    await edit(20000, false);
    expect(row.splitResult?.review).toBe("excluded");
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(6000);
    await edit(22000);
    expect(row.splitResult?.review).toBe("pending");
    await split();
    row = (await snapshot(f.a, f.g)).entries.find((e) => e.id === row.id)!;
    expect(row.splitResult?.review).toBe("current");
    expect(row.amountCents).toBe(-22000);
    expect(row.shares).toEqual([]);
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(11000);
    await expect(
      mutate(f.a, f.g, {
        type: "split",
        entries: [{ id: row.id, version: row.version - 1, decision: "include" }],
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("persists hierarchical rules, enforces depth and keeps replicas group scoped", async () => {
    const f = await fixture();
    const child = (await mutate(f.a, f.g, {
      type: "category",
      name: "Food",
      emoji: "x",
      color: "#000000",
      archived: false,
    })) as { id: string };
    const before = await snapshot(f.a, f.g);
    const nodes = before.categories
      .filter((c) => !c.archived)
      .map((c) => ({ ...c, parentId: c.id === child.id ? f.category : (c.parentId ?? null) }));
    await mutate(f.a, f.g, {
      type: "categoryTree",
      expectedRevision: before.group.revision,
      draft: { nodes, merges: [] },
    });
    const changed = await snapshot(f.a, f.g);
    await expect(
      mutate(f.a, f.g, {
        type: "categoryTree",
        expectedRevision: changed.group.revision,
        draft: {
          nodes: nodes.map((c) => ({
            ...c,
            parentId: c.id === f.category ? child.id : c.parentId,
          })),
          merges: [],
        },
      }),
    ).rejects.toThrow();
    const participants = [
      { memberId: f.am, weight: 4000 },
      { memberId: f.bm, weight: 6000 },
    ];
    await expect(
      mutate(f.b, f.g, { type: "splitRules", participants, categories: [] }),
    ).rejects.toMatchObject({ status: 403 });
    await mutate(f.a, f.g, {
      type: "splitRules",
      participants,
      categories: [
        {
          categoryId: f.category,
          participants: [
            { memberId: f.am, weight: 10000 },
            { memberId: f.bm, weight: 0 },
          ],
        },
      ],
    });
    const result = await entry(f, { categoryId: child.id });
    const current = await snapshot(f.a, f.g);
    expect(current.categorySplitRules).toHaveLength(1);
    expect(
      current.entries
        .find((e) => e.id === result.id)
        ?.splitResult?.snapshot.shares.find((p) => p.memberId === f.bm)?.amountCents,
    ).toBe(0);
    await mutate(f.a, f.g, { type: "splitRules", participants, categories: [] });
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(0);
  });
  it("preserves originals and actual repayments across repeated splits and rejects foreign records", async () => {
    const f = await fixture();
    const result = await entry(f);
    const originals = await getDb()
      .select()
      .from(groupEntries)
      .where(eq(groupEntries.id, result.id));
    const shares = await getDb()
      .select()
      .from(groupEntryShares)
      .where(eq(groupEntryShares.entryId, result.id));
    await mutate(f.b, f.g, {
      type: "repayment",
      senderId: f.bm,
      recipientId: f.am,
      amountCents: 1000,
      occurredOn: "2026-10-26",
      note: "Paid",
      reason: "",
      duplicateIds: [],
    });
    const payments = await getDb()
      .select()
      .from(groupRepayments)
      .where(eq(groupRepayments.groupId, f.g));
    await mutate(f.b, f.g, {
      type: "split",
      entries: [{ id: result.id, version: 0, decision: "include" }],
    });
    expect(await getDb().select().from(groupEntries).where(eq(groupEntries.id, result.id))).toEqual(
      originals,
    );
    expect(
      await getDb().select().from(groupEntryShares).where(eq(groupEntryShares.entryId, result.id)),
    ).toEqual(shares);
    expect(
      await getDb().select().from(groupRepayments).where(eq(groupRepayments.groupId, f.g)),
    ).toEqual(payments);
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(5000);
    const other = await fixture();
    const foreign = await entry(other);
    await expect(
      mutate(f.a, f.g, {
        type: "split",
        entries: [{ id: foreign.id, version: 0, decision: "include" }],
      }),
    ).rejects.toMatchObject({ status: 409 });
    const own = await snapshot(f.a, f.g);
    await expect(
      mutate(f.a, f.g, {
        type: "categoryTree",
        expectedRevision: own.group.revision,
        draft: {
          nodes: own.categories
            .filter((c) => !c.archived)
            .map((c) => ({
              ...c,
              parentId: c.id === f.category ? other.category : (c.parentId ?? null),
            })),
          merges: [],
        },
      }),
    ).rejects.toThrow();
  });
  it("queues review after bulk category edits and category merges without replacing saved debt", async () => {
    const f = await fixture();
    const result = await entry(f);
    let current = await snapshot(f.a, f.g);
    const target = current.categories.find((c) => c.id !== f.category)!;
    await bulkGroup(
      f.a,
      f.g,
      parseGroupBulk({
        action: "category",
        categoryId: target.id,
        entries: [{ id: result.id, version: 0 }],
        revision: current.group.revision,
        mutationId: randomUUID(),
      }),
    );
    current = await snapshot(f.a, f.g);
    const edited = current.entries.find((e) => e.id === result.id)!;
    expect(edited.splitResult?.review).toBe("pending");
    expect(edited.splitResult?.snapshot.categoryId).toBe(f.category);
    expect(current.balances[f.am]).toBe(6000);
    await mutate(f.a, f.g, {
      type: "split",
      entries: [{ id: edited.id, version: edited.version, decision: "exclude" }],
    });
    current = await snapshot(f.a, f.g);
    const draft = mergeGroupCategory(
      categoryTreeDraft(current.categories),
      target.id,
      f.category,
      current.categories.map((c) => c.id),
    );
    await mutate(f.a, f.g, {
      type: "categoryTree",
      expectedRevision: current.group.revision,
      draft,
    });
    const merged = await snapshot(f.a, f.g);
    expect(merged.entries.find((e) => e.id === result.id)?.splitResult?.review).toBe("pending");
    expect(merged.balances[f.am]).toBe(6000);
  });
});
