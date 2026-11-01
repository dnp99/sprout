import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { getDb, closeDb } from "@/db";
import { groupMerchantRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { snapshot, mutate, fixture, entry } from "./integration-fixtures";
import { categoryTreeDraft, mergeGroupCategory } from "./category-tree";
import { joinGroup } from "./repository";
import { mutateGroup } from "./repository";
import { parseOperation, type GroupOperation } from "./validation";
import { bulkGroup } from "./bulk";
import { parseGroupBulk } from "./bulk-validation";
import { importGroup, parseGroupImport } from "./import";
vi.mock("@/lib/import/ai-categorize", () => ({
  categorizeMerchants: vi.fn(async () => new Map()),
}));
const url = process.env.GROUP_TEST_DATABASE_URL;
describe.skipIf(!url)("shared group categorization rules and permissions", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
  });
  afterAll(async () => {
    await closeDb();
  });
  it("lets members create, edit, normalize, delete and share rules without cross-group access", async () => {
    const f = await fixture(),
      other = await fixture();
    const foreign = (await snapshot(other.a, other.g)).categories[0].id;
    await expect(
      mutate(f.b, f.g, { type: "merchantRule", merchant: "Market", categoryId: foreign }),
    ).rejects.toThrow();
    await expect(
      mutate(f.c, f.g, { type: "merchantRule", merchant: "Market", categoryId: f.category }),
    ).rejects.toMatchObject({ status: 404 });
    await mutate(f.b, f.g, {
      type: "merchantRule",
      merchant: "Maple Market #123",
      categoryId: f.category,
    });
    let data = await snapshot(f.a, f.g);
    expect(data.merchantRules).toHaveLength(1);
    expect(data.merchantRules?.[0].pattern).toBe("MAPLE MARKET");
    const id = data.merchantRules![0].id;
    const categoryId = data.categories.find((c) => c.id !== f.category)!.id;
    await mutate(f.a, f.g, { type: "merchantRule", id, merchant: "Maple Foods", categoryId });
    data = await snapshot(f.b, f.g);
    expect(data.merchantRules?.[0]).toMatchObject({ id, pattern: "MAPLE FOODS", categoryId });
    await expect(
      mutate(other.b, other.g, { type: "merchantRuleDelete", id }),
    ).rejects.toMatchObject({ status: 404 });
    await mutate(f.b, f.g, { type: "merchantRuleDelete", id });
    expect((await snapshot(f.a, f.g)).merchantRules).toEqual([]);
  });
  it("uses rules for new entries, imports and the backlog while preserving choices and saved splits", async () => {
    const f = await fixture();
    const old = await entry(f, { merchant: "Maple Market", categoryId: null });
    const before = await snapshot(f.a, f.g);
    const saved = before.entries.find((e) => e.id === old.id)!.splitResult;
    await mutate(f.b, f.g, {
      type: "merchantRule",
      merchant: "Maple Market",
      categoryId: f.category,
    });
    const newEntry = await entry(f, { merchant: "Maple Market #45", categoryId: null }, false);
    let data = await snapshot(f.a, f.g);
    expect(data.entries.find((e) => e.id === newEntry.id)?.categoryId).toBe(f.category);
    const explicit = data.categories.find((c) => c.id !== f.category)!.id;
    const manual = await entry(f, { merchant: "Maple Market", categoryId: explicit }, false);
    data = await snapshot(f.a, f.g);
    const oldRow = data.entries.find((e) => e.id === old.id)!;
    await bulkGroup(
      f.b,
      f.g,
      parseGroupBulk({
        action: "aiCategory",
        mutationId: randomUUID(),
        revision: data.group.revision,
        entries: [{ id: oldRow.id, version: oldRow.version }],
      }),
    );
    data = await snapshot(f.a, f.g);
    expect(data.entries.find((e) => e.id === old.id)?.categoryId).toBe(f.category);
    expect(data.entries.find((e) => e.id === old.id)?.splitResult?.snapshot).toEqual(
      saved?.snapshot,
    );
    expect(data.entries.find((e) => e.id === old.id)?.splitResult?.review).toBe("pending");
    expect(data.entries.find((e) => e.id === manual.id)?.categoryId).toBe(explicit);
    await importGroup(
      f.b,
      f.g,
      parseGroupImport({
        csv: "Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Maple Market,-10,Bank,Expense,",
        preset: "sprout",
        payerId: f.bm,
        settlement: true,
        aiCategorize: false,
        revision: data.group.revision,
        mutationId: randomUUID(),
      }),
    );
    expect(
      (await snapshot(f.a, f.g)).entries.find(
        (e) => e.merchant === "Maple Market" && e.amountCents === -1000,
      )?.categoryId,
    ).toBe(f.category);
    await mutate(f.b, f.g, { type: "categoryDelete", id: f.category });
    expect((await snapshot(f.a, f.g)).merchantRules).toEqual([]);
  });
  it("lets a member maintain shared category merges and record/reverse payments for other members", async () => {
    const f = await fixture();
    await mutate(f.b, f.g, {
      type: "merchantRule",
      merchant: "Maple Market",
      categoryId: f.category,
    });
    let data = await snapshot(f.b, f.g);
    const target = data.categories.find((c) => c.id !== f.category)!.id;
    await mutate(f.b, f.g, {
      type: "categoryTree",
      expectedRevision: data.group.revision,
      draft: mergeGroupCategory(
        categoryTreeDraft(data.categories),
        f.category,
        target,
        data.categories.map((c) => c.id),
      ),
    });
    data = await snapshot(f.a, f.g);
    expect(data.merchantRules?.[0].categoryId).toBe(target);
    const invitation = (await mutate(f.a, f.g, { type: "invite", reactivateMemberId: null })) as {
      token: string;
    };
    await joinGroup(f.c, invitation.token);
    const payment = {
      type: "repayment",
      senderId: f.am,
      recipientId: f.bm,
      amountCents: 500,
      occurredOn: "2026-10-25",
      note: "",
      duplicateIds: [],
    } as const;
    await expect(
      mutate(f.c, f.g, { ...payment, duplicateIds: [], reason: "" }),
    ).rejects.toMatchObject({ status: 400 });
    const saved = (await mutate(f.c, f.g, {
      ...payment,
      duplicateIds: [],
      reason: "Confirmed transfer",
    })) as { id: string };
    await mutate(f.c, f.g, { type: "reverse", id: saved.id, reason: "Duplicate recording" });
    expect(
      (await snapshot(f.a, f.g)).repayments.find((r) => r.id === saved.id)?.reversedAt,
    ).toBeTruthy();
  });
  it("keeps owner-only membership/lifecycle powers and rejects stale, removed and archived rule writes", async () => {
    const f = await fixture();
    for (const op of [
      { type: "settings", name: "Changed", archived: false },
      { type: "invite", reactivateMemberId: null },
      { type: "remove", id: f.am },
      { type: "transfer", id: f.am },
    ] as GroupOperation[])
      await expect(mutate(f.b, f.g, op)).rejects.toMatchObject({ status: 403 });
    const data = await snapshot(f.b, f.g);
    const input = parseOperation({
      type: "merchantRule",
      merchant: "Maple Market",
      categoryId: f.category,
      mutationId: randomUUID(),
      revision: data.group.revision,
    });
    await mutateGroup(f.b, f.g, input);
    await mutateGroup(f.b, f.g, input);
    expect(
      await getDb().select().from(groupMerchantRules).where(eq(groupMerchantRules.groupId, f.g)),
    ).toHaveLength(1);
    await expect(mutateGroup(f.b, f.g, { ...input, key: randomUUID() })).rejects.toMatchObject({
      status: 409,
    });
    await mutate(f.a, f.g, { type: "settings", name: "Household", archived: true });
    await expect(mutate(f.b, f.g, input.operation)).rejects.toMatchObject({ status: 409 });
    await mutate(f.a, f.g, { type: "settings", name: "Household", archived: false });
    await mutate(f.a, f.g, { type: "remove", id: f.bm });
    await expect(mutate(f.b, f.g, input.operation)).rejects.toMatchObject({ status: 404 });
  });
});
