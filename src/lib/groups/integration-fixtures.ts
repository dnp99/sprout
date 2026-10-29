import { randomUUID } from "node:crypto";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createGroup, getGroup, mutateGroup, joinGroup } from "./repository";
import { parseOperation, type GroupOperation } from "./validation";

/** Shared fixtures exercise explicit splitting instead of assuming entry writes allocate. */
export async function user() {
  const [u] = await getDb()
    .insert(users)
    .values({ name: "Member", email: `${randomUUID()}@example.test` })
    .returning();
  return u.id;
}
export const snapshot = (u: string, g: string) => getGroup(u, g, "2026-10");
export async function mutate(u: string, g: string, op: GroupOperation) {
  const s = await snapshot(u, g);
  return mutateGroup(
    u,
    g,
    parseOperation({ ...op, mutationId: randomUUID(), revision: s.group.revision }),
  );
}
export async function fixture() {
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
export async function entry(
  f: Awaited<ReturnType<typeof fixture>>,
  patch: Record<string, unknown> = {},
  calculate = true,
) {
  const result = (await mutate(f.a, f.g, {
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
  } as GroupOperation)) as { id: string };
  const row = (await snapshot(f.a, f.g)).entries.find((e) => e.id === result.id)!;
  if (calculate && row.kind !== "income" && row.payerId && row.settlement)
    await mutate(f.a, f.g, {
      type: "split",
      entries: [{ id: row.id, version: row.version, decision: "include" }],
    });
  return result;
}
