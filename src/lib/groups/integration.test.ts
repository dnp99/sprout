import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, closeDb } from "@/db";
import { users, groupMembers, groupEntries, groupRepayments, groupInvites } from "@/db/schema";
import { createGroup, getGroup, mutateGroup, joinGroup } from "./repository";
import { deleteUser } from "@/lib/auth/account";
import { parseOperation, type GroupOperation } from "./validation";
const url = process.env.GROUP_TEST_DATABASE_URL;
// A separate, explicitly named test database is mandatory; ordinary npm test skips this suite.
describe.skipIf(!url)("groups on isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!url || !/^\/sprout_groups_test_\d+$/.test(new URL(url).pathname))
      throw Error("Refusing non-test database");
    await closeDb();
    process.env.DATABASE_URL = url;
  });
  afterAll(async () => {
    await closeDb();
  });
  async function user() {
    const [u] = await getDb()
      .insert(users)
      .values({ name: "Member", email: `${randomUUID()}@example.test` })
      .returning();
    return u.id;
  }
  const snapshot = (u: string, g: string) => getGroup(u, g, "2026-10");
  it("searches beyond page one and across dates without filtering household totals", async () => {
    const a = await user(),
      g = (await createGroup(a, "Search household")).id;
    const initial = await snapshot(a, g);
    const actor = initial.group.memberId;
    await getDb()
      .insert(groupEntries)
      .values([
        ...Array.from({ length: 55 }, () => ({
          groupId: g,
          authorId: actor,
          payerId: actor,
          kind: "expense",
          amountCents: -100,
          merchant: "Recent shop",
          occurredOn: "2026-10-25",
          settlement: false,
        })),
        {
          groupId: g,
          authorId: actor,
          payerId: actor,
          kind: "expense",
          amountCents: -200,
          merchant: "Older shop",
          note: "delivery",
          occurredOn: "2026-10-01",
          settlement: false,
        },
        {
          groupId: g,
          authorId: actor,
          payerId: null,
          kind: "expense",
          amountCents: -300,
          merchant: "Older shop",
          occurredOn: "2026-09-01",
          settlement: false,
        },
      ]);
    const unfiltered = await snapshot(a, g);
    expect(unfiltered.entries).toHaveLength(50);
    expect(unfiltered.entries.some((e) => e.merchant === "Older shop")).toBe(false);
    const searched = await getGroup(a, g, "2026-10", 0, { query: "delivery", payer: actor });
    expect(searched.entries.map((e) => e.merchant)).toEqual(["Older shop"]);
    expect(searched.totalEntries).toBe(1);
    expect(searched.summary).toEqual(unfiltered.summary);
    const history = await getGroup(a, g, "2026-10", 0, { query: "older", scope: "all" });
    expect(history.totalEntries).toBe(2);
    const shared = await getGroup(a, g, "2026-10", 0, { payer: "shared", scope: "all" });
    expect(shared.entries[0].occurredOn).toBe("2026-09-01");
    await expect(getGroup(await user(), g, "2026-10", 0, { scope: "all" })).rejects.toThrow();
  });
  async function mutate(u: string, g: string, op: GroupOperation) {
    const s = await snapshot(u, g);
    return mutateGroup(
      u,
      g,
      parseOperation({ ...op, mutationId: randomUUID(), revision: s.group.revision }),
    );
  }
  async function fixture() {
    const a = await user(),
      b = await user(),
      c = await user(),
      g = (await createGroup(a, "Household")).id;
    const invite = (await mutate(a, g, { type: "invite", reactivateMemberId: null })) as {
      token: string;
    };
    await joinGroup(b, invite.token);
    const s = await snapshot(a, g);
    return {
      a,
      b,
      c,
      g,
      am: s.members.find((m) => m.userId === a)!.id,
      bm: s.members.find((m) => m.userId === b)!.id,
      category: s.categories[0].id,
    };
  }
  async function entry(
    f: Awaited<ReturnType<typeof fixture>>,
    patch: Record<string, unknown> = {},
  ) {
    return mutate(f.a, f.g, {
      type: "entry",
      entry: {
        kind: "expense",
        amountCents: 12000,
        merchant: "Groceries",
        note: "",
        occurredOn: "2026-10-25",
        categoryId: f.category,
        payerId: f.am,
        refundOf: null,
        settlement: true,
        splitMethod: "equal",
        participants: [
          { memberId: f.am, weight: 1 },
          { memberId: f.bm, weight: 1 },
        ],
        reason: "",
        ...patch,
      },
    } as GroupOperation) as Promise<{ id: string }>;
  }
  it("isolates members and personal data, including foreign category references", async () => {
    const f = await fixture();
    await expect(snapshot(f.c, f.g)).rejects.toMatchObject({ status: 404 });
    const other = (await createGroup(f.a, "Other")).id,
      foreign = (await snapshot(f.a, other)).categories[0].id;
    await expect(entry(f, { categoryId: foreign })).rejects.toThrow();
    await entry(f);
    expect((await snapshot(f.a, f.g)).summary.spendingCents).toBe(12000);
    expect(await getDb().select().from(users).where(eq(users.id, f.a))).toHaveLength(1);
  });
  it("serializes concurrent edits without partial saves", async () => {
    const f = await fixture(),
      s = await snapshot(f.a, f.g);
    const input = (name: string) =>
      parseOperation({
        type: "settings",
        name,
        archived: false,
        revision: s.group.revision,
        mutationId: randomUUID(),
      });
    const results = await Promise.allSettled([
      mutateGroup(f.a, f.g, input("A")),
      mutateGroup(f.a, f.g, input("B")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });
  it("retries writes idempotently and refuses key reuse with another payload", async () => {
    const f = await fixture(),
      s = await snapshot(f.a, f.g),
      key = randomUUID(),
      input = parseOperation({
        type: "settings",
        name: "Same",
        archived: false,
        revision: s.group.revision,
        mutationId: key,
      });
    await mutateGroup(f.a, f.g, input);
    await mutateGroup(f.a, f.g, input);
    await expect(
      mutateGroup(
        f.a,
        f.g,
        parseOperation({
          ...input.operation,
          name: "Different",
          revision: s.group.revision,
          mutationId: key,
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("records immediate payments from either counterparty and prevents duplicate reversal", async () => {
    const f = await fixture();
    await entry(f);
    const r = (await mutate(f.b, f.g, {
      type: "repayment",
      senderId: f.bm,
      recipientId: f.am,
      amountCents: 2500,
      occurredOn: "2026-10-25",
      note: "",
      reason: "",
      duplicateIds: [],
    })) as { id: string };
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(3500);
    await mutate(f.a, f.g, { type: "reverse", id: r.id, reason: "Correction" });
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(6000);
    await expect(
      mutate(f.b, f.g, { type: "reverse", id: r.id, reason: "Again" }),
    ).rejects.toThrow();
  });
  it("requires duplicate acknowledgement after independent recording attempts", async () => {
    const f = await fixture();
    const op: GroupOperation = {
      type: "repayment",
      senderId: f.bm,
      recipientId: f.am,
      amountCents: 100,
      occurredOn: "2026-10-25",
      note: "",
      reason: "",
      duplicateIds: [],
    };
    const r = (await mutate(f.a, f.g, op)) as { id: string };
    await expect(mutate(f.b, f.g, op)).rejects.toMatchObject({
      status: 409,
      details: { duplicateIds: [r.id] },
    });
    await mutate(f.b, f.g, { ...op, duplicateIds: [r.id] });
    expect((await snapshot(f.a, f.g)).balances[f.am]).toBe(-200);
  });
  it("removed members cannot read/write/rejoin with ordinary invitations", async () => {
    const f = await fixture();
    const ordinary = (await mutate(f.a, f.g, { type: "invite", reactivateMemberId: null })) as {
      token: string;
    };
    await entry(f);
    await mutate(f.a, f.g, { type: "remove", id: f.bm });
    await expect(snapshot(f.b, f.g)).rejects.toMatchObject({ status: 404 });
    await expect(joinGroup(f.b, ordinary.token)).rejects.toMatchObject({ status: 403 });
    expect((await snapshot(f.a, f.g)).balances[f.bm]).toBe(-6000);
    const back = (await mutate(f.a, f.g, { type: "invite", reactivateMemberId: f.bm })) as {
      token: string;
    };
    await joinGroup(f.b, back.token);
    expect((await snapshot(f.b, f.g)).group.memberId).toBe(f.bm);
  });
  it("preserves monthly budgets and keeps income outside expense totals", async () => {
    const f = await fixture();
    await mutate(f.a, f.g, {
      type: "budget",
      month: "2026-10",
      poolCents: 20000,
      allocations: { [f.category]: 15000 },
    });
    await mutate(f.a, f.g, { type: "budget", month: "2026-11", poolCents: 30000, allocations: {} });
    expect((await snapshot(f.a, f.g)).budget.poolCents).toBe(20000);
    await entry(f, { kind: "income", amountCents: 50000, participants: [] });
    const s = await snapshot(f.a, f.g);
    expect(s.summary.incomeCents).toBe(50000);
    expect(s.summary.spendingCents).toBe(0);
    expect(s.balances).toEqual({});
  });
  it("refunds after repayment reverse shares and reject excess refunds", async () => {
    const f = await fixture(),
      root = await entry(f);
    await mutate(f.b, f.g, {
      type: "repayment",
      senderId: f.bm,
      recipientId: f.am,
      amountCents: 2500,
      occurredOn: "2026-10-25",
      note: "",
      reason: "",
      duplicateIds: [],
    });
    await entry(f, { kind: "refund", amountCents: 2000, refundOf: root.id, participants: [] });
    let s = await snapshot(f.a, f.g);
    expect(s.balances[f.am]).toBe(2500);
    expect(s.summary.spendingCents).toBe(10000);
    await expect(
      entry(f, { kind: "refund", amountCents: 11000, refundOf: root.id, participants: [] }),
    ).rejects.toThrow();
    s = await snapshot(f.a, f.g);
    expect(s.entries).toHaveLength(2);
  });
  it("account deletion requires ownership resolution and retains shared financial rows", async () => {
    const f = await fixture();
    await entry(f);
    await expect(deleteUser(f.a)).rejects.toMatchObject({ status: 409 });
    await deleteUser(f.b);
    const s = await snapshot(f.a, f.g);
    expect(s.members.find((m) => m.id === f.bm)).toMatchObject({
      name: "Former member",
      userId: null,
      status: "deleted",
    });
    expect(s.balances[f.bm]).toBe(-6000);
    expect(
      await getDb().select().from(groupEntries).where(eq(groupEntries.groupId, f.g)),
    ).toHaveLength(1);
    await mutate(f.a, f.g, { type: "settings", name: "Household", archived: true });
    await deleteUser(f.a);
    expect(
      (await getDb().select().from(groupMembers).where(eq(groupMembers.groupId, f.g))).every(
        (m) => m.userId === null,
      ),
    ).toBe(true);
  });
  it("invitation races consume a token once and revoked tokens fail", async () => {
    const f = await fixture();
    const invite = (await mutate(f.a, f.g, { type: "invite", reactivateMemberId: null })) as {
      token: string;
      id: string;
    };
    const d = await user();
    const joins = await Promise.allSettled([
      joinGroup(f.c, invite.token),
      joinGroup(d, invite.token),
    ]);
    expect(joins.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const row = await getDb().select().from(groupInvites).where(eq(groupInvites.id, invite.id));
    expect(row[0].usedAt).not.toBeNull();
  });
  it("archive freezes financial mutations while preserving read and export access", async () => {
    const f = await fixture();
    await entry(f);
    await mutate(f.a, f.g, { type: "settings", name: "Archived", archived: true });
    await expect(entry(f)).rejects.toMatchObject({ status: 409 });
    expect((await snapshot(f.b, f.g)).entries).toHaveLength(1);
    expect(
      await getDb().select().from(groupRepayments).where(eq(groupRepayments.groupId, f.g)),
    ).toHaveLength(0);
  });
  it("applies group-level revision conflicts across different members/connections", async () => {
    const f = await fixture(),
      s = await snapshot(f.a, f.g);
    const settings = parseOperation({
      type: "settings",
      name: "Changed",
      archived: false,
      revision: s.group.revision,
      mutationId: randomUUID(),
    });
    const payment = parseOperation({
      type: "repayment",
      senderId: f.bm,
      recipientId: f.am,
      amountCents: 100,
      occurredOn: "2026-10-25",
      note: "",
      reason: "",
      duplicateIds: [],
      revision: s.group.revision,
      mutationId: randomUUID(),
    });
    const results = await Promise.allSettled([
      mutateGroup(f.a, f.g, settings),
      mutateGroup(f.b, f.g, payment),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason,
    ).toMatchObject({ status: 409 });
  });
  it("preserves historical splits and flags custom defaults after membership changes", async () => {
    const f = await fixture();
    await mutate(f.a, f.g, {
      type: "defaults",
      method: "percentage",
      participants: [
        { memberId: f.am, weight: 4000 },
        { memberId: f.bm, weight: 6000 },
      ],
    });
    const old = await entry(f);
    expect((await snapshot(f.a, f.g)).splitDefaults.valid).toBe(true);
    const invitation = (await mutate(f.a, f.g, { type: "invite", reactivateMemberId: null })) as {
      token: string;
    };
    await joinGroup(f.c, invitation.token);
    const current = await snapshot(f.a, f.g);
    expect(current.splitDefaults.valid).toBe(false);
    expect(
      current.entries
        .find((e) => e.id === old.id)
        ?.shares.map((s) => s.amountCents)
        .sort(),
    ).toEqual([6000, 6000]);
    const cm = current.members.find((m) => m.userId === f.c)!.id;
    await expect(
      mutate(f.b, f.g, {
        type: "repayment",
        senderId: f.am,
        recipientId: cm,
        amountCents: 100,
        occurredOn: "2026-10-25",
        note: "",
        reason: "",
        duplicateIds: [],
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("rechecks revocation on join and prevents replaying an old invitation", async () => {
    const f = await fixture(),
      invitation = (await mutate(f.a, f.g, { type: "invite", reactivateMemberId: null })) as {
        token: string;
        id: string;
      };
    await mutate(f.a, f.g, { type: "revoke", id: invitation.id });
    await expect(joinGroup(f.c, invitation.token)).rejects.toMatchObject({ status: 404 });
  });
  it("retries group creation without duplicating households", async () => {
    const u = await user(),
      key = randomUUID(),
      first = await createGroup(u, "Retry", key),
      second = await createGroup(u, "Retry", key);
    expect(second.id).toBe(first.id);
    await expect(createGroup(u, "Changed", key)).rejects.toMatchObject({ status: 409 });
  });
  it("members edit another author's record without a reason but cannot void it", async () => {
    const f = await fixture();
    const saved = await entry(f);
    const row = (await snapshot(f.b, f.g)).entries.find((e) => e.id === saved.id)!;
    await mutate(f.b, f.g, {
      type: "entry",
      entry: {
        id: row.id,
        version: row.version,
        kind: "expense",
        amountCents: 9000,
        merchant: "Shared correction",
        note: "",
        occurredOn: row.occurredOn,
        payerId: row.payerId,
        categoryId: row.categoryId,
        refundOf: null,
        settlement: row.settlement,
        splitMethod: "equal",
        participants: row.shares.map((s) => ({ memberId: s.memberId, weight: 1 })),
        reason: "",
      },
    });
    const edited = (await snapshot(f.a, f.g)).entries.find((e) => e.id === saved.id)!;
    expect(edited.amountCents).toBe(-9000);
    expect(edited.authorId).toBe(row.authorId);
    expect(edited.updatedAt).toBeTruthy();
    await expect(
      mutate(f.b, f.g, {
        type: "void",
        id: edited.id,
        version: edited.version,
        reason: "Not my record",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("owner exit promotes the earliest remaining member and last exit archives", async () => {
    const f = await fixture();
    await mutate(f.a, f.g, { type: "leave" });
    expect((await snapshot(f.b, f.g)).group.role).toBe("owner");
    await mutate(f.b, f.g, { type: "leave" });
    await expect(snapshot(f.b, f.g)).rejects.toMatchObject({ status: 404 });
    const { groups } = await import("@/db/schema");
    const [group] = await getDb().select().from(groups).where(eq(groups.id, f.g));
    expect(group.archivedAt).not.toBeNull();
  });
});
