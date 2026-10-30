import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { getDb, closeDb } from "@/db";
import { goals, recurringItems, transactions, groupEntries } from "@/db/schema";
import { snapshot, mutate, fixture, entry } from "./integration-fixtures";
import { categoryTreeDraft, moveGroupCategory } from "./category-tree";
import { createCategory, deleteCategory } from "@/lib/categories/repository";
import { organizeCategories } from "@/lib/categories/organize-repository";
import { categoryRevision } from "@/lib/categories/tree-policy";
import { eq } from "drizzle-orm";
const url = process.env.GROUP_TEST_DATABASE_URL;
describe.skipIf(!url)("category and feature parity in isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
  });
  afterAll(async () => {
    await closeDb();
  });
  it("shares goal and recurring workflows without touching personal rows; completion and roundups are idempotent", async () => {
    const f = await fixture();
    await mutate(f.b, f.g, {
      type: "goal",
      value: {
        name: "Trip",
        emoji: "🎯",
        color: "#123456",
        targetCents: 50000,
        savedCents: 0,
        targetDate: null,
        isRoundupTarget: true,
      },
    });
    await mutate(f.b, f.g, {
      type: "recurring",
      value: {
        name: "Rent",
        emoji: "🏠",
        amountCents: -12345,
        cadence: "monthly",
        dayOfMonth: 1,
        dayOfWeek: null,
        monthOfYear: null,
        categoryId: f.category,
        paused: false,
      },
    });
    let data = await snapshot(f.a, f.g);
    const schedule = data.recurring![0];
    await expect(
      mutate(f.c, f.g, { type: "recurringPaid", id: schedule.id, dueDate: "2026-10-01" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      mutate(f.b, f.g, { type: "recurringPaid", id: schedule.id, dueDate: "2026-10-02" }),
    ).rejects.toThrow();
    await mutate(f.b, f.g, { type: "recurringPaid", id: schedule.id, dueDate: "2026-10-01" });
    await mutate(f.b, f.g, { type: "recurringPaid", id: schedule.id, dueDate: "2026-10-01" });
    data = await snapshot(f.a, f.g);
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0]).toMatchObject({
      amountCents: -12345,
      payerId: f.bm,
      recurringItemId: schedule.id,
      splitResult: null,
    });
    expect(data.balances).toEqual({});
    await mutate(f.a, f.g, { type: "roundupSweep" });
    await mutate(f.b, f.g, { type: "roundupSweep" });
    expect((await snapshot(f.a, f.g)).goals![0].savedCents).toBe(55);
    expect(await getDb().select().from(goals).where(eq(goals.userId, f.a))).toEqual([]);
    expect(
      await getDb().select().from(recurringItems).where(eq(recurringItems.userId, f.a)),
    ).toEqual([]);
    expect(await getDb().select().from(transactions).where(eq(transactions.userId, f.a))).toEqual(
      [],
    );
    await mutate(f.a, f.g, { type: "settings", name: "Closed", archived: true });
    await expect(mutate(f.a, f.g, { type: "goalDelete", id: data.goals![0].id })).rejects.toThrow();
  });
  it("requires level-change decisions and category deletion preserves financial and split snapshots", async () => {
    const f = await fixture();
    await entry(f, { amountCents: 12345 });
    let data = await snapshot(f.a, f.g);
    const draft = moveGroupCategory(
      categoryTreeDraft(data.categories),
      f.category,
      data.categories[1].id,
    );
    await expect(
      mutate(f.a, f.g, { type: "categoryTree", draft, expectedRevision: data.group.revision }),
    ).rejects.toThrow();
    draft.recordChoices = [{ categoryId: f.category, action: "uncategorize" }];
    await mutate(f.a, f.g, { type: "categoryTree", draft, expectedRevision: data.group.revision });
    data = await snapshot(f.a, f.g);
    expect(data.entries[0]).toMatchObject({
      categoryId: null,
      amountCents: -12345,
      splitResult: { review: "pending", snapshot: { categoryId: f.category } },
    });
    await expect(
      mutate(f.b, f.g, { type: "categoryDelete", id: f.category }),
    ).rejects.toMatchObject({ status: 403 });
    await mutate(f.a, f.g, { type: "categoryDelete", id: f.category });
    expect((await snapshot(f.a, f.g)).entries).toHaveLength(1);
    expect(
      (await getDb().select().from(groupEntries).where(eq(groupEntries.groupId, f.g)))[0]
        .amountCents,
    ).toBe(-12345);
  });
  it("organizes personal categories independently and keeps unclassified bills", async () => {
    const f = await fixture(),
      input = {
        name: "Home",
        emoji: "🏠",
        color: "#123456",
        monthlyBudgetCents: 0,
        budgetGroup: null,
      };
    const a = await createCategory(f.a, input),
      b = await createCategory(f.a, { ...input, name: "Food" });
    await getDb()
      .insert(transactions)
      .values({
        userId: f.a,
        merchant: "Market",
        amountCents: -1000,
        categoryId: b.id,
        occurredAt: new Date("2026-10-01T12:00:00Z"),
      });
    const current = [a, b].map((c) => ({ ...c, archived: false }));
    const draft = moveGroupCategory(categoryTreeDraft(current), b.id, a.id);
    await expect(organizeCategories(f.a, draft, categoryRevision(current))).rejects.toThrow();
    draft.recordChoices = [{ categoryId: b.id, action: "uncategorize" }];
    await organizeCategories(f.a, draft, categoryRevision(current));
    const rows = await getDb().select().from(transactions).where(eq(transactions.userId, f.a));
    expect(rows[0]).toMatchObject({ categoryId: null, amountCents: -1000 });
    expect((await snapshot(f.a, f.g)).categories.every((c) => !c.parentId)).toBe(true);
    expect(await deleteCategory(f.b, a.id)).toBe(false);
    expect(await deleteCategory(f.a, a.id)).toBe(true);
    await expect(organizeCategories(f.a, draft, categoryRevision(current))).rejects.toMatchObject({
      status: 409,
    });
  });
});
