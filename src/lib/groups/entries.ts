import { and, eq } from "drizzle-orm";
import { groupMembers, groupCategories, groupEntries, groupEntryShares } from "@/db/schema";
import { activity, canCorrect, ledger, type GroupTx, type MemberRow } from "./context";
import { allocate, refundShares } from "./accounting";
import { GroupError, type EntryInput } from "./validation";

/** Resolve all foreign identities inside the authorized group before saving. */
export async function saveEntry(tx: GroupTx, groupId: string, actor: MemberRow, input: EntryInput) {
  const { entries } = await ledger(tx, groupId);
  const old = input.id ? entries.find((e) => e.id === input.id && !e.voidedAt) : undefined;
  if (input.id && !old) throw new GroupError("Record unavailable.", 404);
  if (old) {
    if (input.version !== old.version)
      throw new GroupError("This record changed. Reload before editing.", 409);
    if (input.kind !== old.kind) throw new GroupError("Record type cannot change.");
  }
  const members = await tx.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  const active = (id: string) => members.some((m) => m.id === id && m.status === "active");
  if (input.payerId && !active(input.payerId) && input.payerId !== old?.payerId)
    throw new GroupError("Choose a current payer.");
  if (input.categoryId) {
    const [category] = await tx
      .select()
      .from(groupCategories)
      .where(and(eq(groupCategories.id, input.categoryId), eq(groupCategories.groupId, groupId)));
    if (!category || (category.archived && category.id !== old?.categoryId))
      throw new GroupError("Choose an active group category.");
  }
  const original = input.refundOf
    ? entries.find((e) => e.id === input.refundOf && !e.voidedAt && e.kind === "expense")
    : undefined;
  let shares: ReturnType<typeof allocate> = [],
    categoryId = input.categoryId,
    settlement = input.settlement && !!input.payerId;
  if (input.kind === "refund") {
    if (!original || (old && old.refundOf !== original.id))
      throw new GroupError("Choose the original group expense.");
    if (input.occurredOn < original.occurredOn)
      throw new GroupError("Refund cannot precede the expense.");
    const prior = entries.filter(
      (e) => !e.voidedAt && e.refundOf === original.id && e.id !== old?.id,
    );
    if (
      prior.reduce((n, e) => n + e.amountCents, 0) + input.amountCents >
      Math.abs(original.amountCents)
    )
      throw new GroupError("Refund exceeds the remaining expense.");
    categoryId = original.categoryId;
    settlement = original.settlement;
    if (settlement && !input.payerId)
      throw new GroupError("Choose the member who received the refund.");
    shares = refundShares(
      input.amountCents,
      original.shares,
      prior.flatMap((e) => e.shares),
    );
  } else if (input.refundOf) throw new GroupError("Only refunds can reference an expense.");
  else if (input.kind === "income") settlement = false;
  else {
    if (!input.participants.length) throw new GroupError("Select at least one participant.");
    if (
      input.participants.some(
        (p) => !active(p.memberId) && !old?.shares.some((s) => s.memberId === p.memberId),
      )
    )
      throw new GroupError("Choose current group participants.");
    if (
      input.splitMethod === "percentage" &&
      input.participants.reduce((n, p) => n + p.weight, 0) !== 10000
    )
      throw new GroupError("Percentages must total 100%.");
    shares = allocate(
      input.amountCents,
      input.participants.map((p) => ({
        ...p,
        weight: input.splitMethod === "equal" ? 1 : p.weight,
      })),
    );
    if (old && entries.some((e) => !e.voidedAt && e.refundOf === old.id)) {
      const sameShares =
        JSON.stringify([...shares].sort((a, b) => a.memberId.localeCompare(b.memberId))) ===
        JSON.stringify([...old.shares].sort((a, b) => a.memberId.localeCompare(b.memberId)));
      if (
        input.amountCents !== Math.abs(old.amountCents) ||
        input.payerId !== old.payerId ||
        settlement !== old.settlement ||
        categoryId !== old.categoryId ||
        !sameShares ||
        entries.some((e) => !e.voidedAt && e.refundOf === old.id && e.occurredOn < input.occurredOn)
      )
        throw new GroupError(
          "Reverse linked refunds before changing this expense's allocation, category, or amount.",
        );
    }
  }
  const values = {
    groupId,
    authorId: old?.authorId ?? actor.id,
    payerId: input.payerId,
    categoryId,
    kind: input.kind,
    amountCents: input.kind === "expense" ? -input.amountCents : input.amountCents,
    merchant: input.merchant,
    note: input.note,
    occurredOn: input.occurredOn,
    refundOf: original?.id ?? null,
    settlement,
    splitMethod: input.splitMethod,
    version: (old?.version ?? -1) + 1,
    updatedAt: new Date(),
  };
  const [saved] = old
    ? await tx.update(groupEntries).set(values).where(eq(groupEntries.id, old.id)).returning()
    : await tx.insert(groupEntries).values(values).returning();
  if (old) await tx.delete(groupEntryShares).where(eq(groupEntryShares.entryId, old.id));
  if (shares.length)
    await tx.insert(groupEntryShares).values(shares.map((s) => ({ ...s, entryId: saved.id })));
  await activity(tx, groupId, actor.id, old ? "entryEdited" : "entryAdded", saved.id, {
    before: old ?? null,
    after: { ...values, shares },
    reason: input.reason,
  });
  return { id: saved.id };
}
export async function voidEntry(
  tx: GroupTx,
  groupId: string,
  actor: MemberRow,
  id: string,
  version: number,
  reason: string,
) {
  const { entries } = await ledger(tx, groupId);
  const row = entries.find((e) => e.id === id && !e.voidedAt);
  if (!row) throw new GroupError("Record unavailable.", 404);
  canCorrect(actor, row.authorId, reason);
  if (version !== row.version) throw new GroupError("This record changed.", 409);
  if (entries.some((e) => !e.voidedAt && e.refundOf === id))
    throw new GroupError("Reverse linked refunds first.");
  await tx
    .update(groupEntries)
    .set({ voidedAt: new Date(), version: row.version + 1, updatedAt: new Date() })
    .where(eq(groupEntries.id, id));
  await activity(tx, groupId, actor.id, "entryVoided", id, { before: row, reason });
  return { id };
}
