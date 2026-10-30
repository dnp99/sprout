import { and, eq, isNull, ne } from "drizzle-orm";
import { groupGoals, groupRecurringItems, groupEntries, groupCategories } from "@/db/schema";
import { toGoal } from "@/lib/goals/dto";
import { toRecurringItem } from "@/lib/recurring/dto";
import { recurringOccurrencesForMonth } from "@/lib/recurring/reconcile";
import { roundUpCents } from "@/lib/roundups";
import { activity, type GroupTx, type MemberRow } from "./context";
import { saveEntry } from "./entries";
import { cents, GroupError } from "./validation";
import type { FeatureOperation } from "./feature-validation";

/** Read within the snapshot's group lock; these rows never enter personal state. */
export async function readGroupFeatures(tx: GroupTx, groupId: string) {
  const goals = await tx
    .select()
    .from(groupGoals)
    .where(eq(groupGoals.groupId, groupId))
    .orderBy(groupGoals.sortOrder, groupGoals.createdAt);
  const recurring = await tx
    .select()
    .from(groupRecurringItems)
    .where(eq(groupRecurringItems.groupId, groupId))
    .orderBy(groupRecurringItems.sortOrder, groupRecurringItems.createdAt);
  return { goals: goals.map(toGoal), recurring: recurring.map(toRecurringItem) };
}
/** All active members can maintain shared plans. The outer mutation supplies
 * archive, revision and retry checks and holds the group write lock. */
export async function applyFeatureOperation(
  tx: GroupTx,
  groupId: string,
  actor: MemberRow,
  op: FeatureOperation,
): Promise<{ id?: string; sweptCents?: number }> {
  if (op.type === "goal") {
    const values = { ...op.value, updatedAt: new Date() };
    const [row] = op.id
      ? await tx
          .update(groupGoals)
          .set(values)
          .where(and(eq(groupGoals.groupId, groupId), eq(groupGoals.id, op.id)))
          .returning()
      : await tx
          .insert(groupGoals)
          .values({ ...values, groupId })
          .returning();
    if (!row) throw new GroupError("Goal unavailable.", 404);
    if (row.isRoundupTarget)
      await tx
        .update(groupGoals)
        .set({ isRoundupTarget: false })
        .where(and(eq(groupGoals.groupId, groupId), ne(groupGoals.id, row.id)));
    await activity(tx, groupId, actor.id, "goalSaved", row.id);
    return { id: row.id };
  }
  if (op.type === "goalDelete" || op.type === "recurringDelete") {
    const table = op.type === "goalDelete" ? groupGoals : groupRecurringItems;
    const rows = await tx
      .delete(table)
      .where(and(eq(table.groupId, groupId), eq(table.id, op.id)))
      .returning({ id: table.id });
    if (!rows.length) throw new GroupError("Plan unavailable.", 404);
    await activity(tx, groupId, actor.id, op.type, op.id);
    return { id: op.id };
  }
  if (op.type === "recurring") {
    if (op.value.categoryId) {
      const [cat] = await tx
        .select()
        .from(groupCategories)
        .where(
          and(
            eq(groupCategories.groupId, groupId),
            eq(groupCategories.id, op.value.categoryId),
            eq(groupCategories.archived, false),
          ),
        );
      if (!cat) throw new GroupError("Choose an active group category.");
    }
    const values = { ...op.value, updatedAt: new Date() };
    const [row] = op.id
      ? await tx
          .update(groupRecurringItems)
          .set(values)
          .where(and(eq(groupRecurringItems.groupId, groupId), eq(groupRecurringItems.id, op.id)))
          .returning()
      : await tx
          .insert(groupRecurringItems)
          .values({ ...values, groupId })
          .returning();
    if (!row) throw new GroupError("Schedule unavailable.", 404);
    await activity(tx, groupId, actor.id, "recurringSaved", row.id);
    return { id: row.id };
  }
  if (op.type === "recurringPaid") {
    const [item] = await tx
      .select()
      .from(groupRecurringItems)
      .where(and(eq(groupRecurringItems.groupId, groupId), eq(groupRecurringItems.id, op.id)));
    if (!item) throw new GroupError("Schedule unavailable.", 404);
    if (
      !recurringOccurrencesForMonth([toRecurringItem(item)], op.dueDate.slice(0, 7)).some(
        (o) => o.dueDateKey === op.dueDate,
      )
    )
      throw new GroupError("Occurrence is not on this schedule.");
    const [existing] = await tx
      .select({ id: groupEntries.id })
      .from(groupEntries)
      .where(
        and(
          eq(groupEntries.groupId, groupId),
          eq(groupEntries.recurringItemId, item.id),
          eq(groupEntries.occurredOn, op.dueDate),
          isNull(groupEntries.voidedAt),
        ),
      );
    if (existing) return existing;
    const row = await saveEntry(tx, groupId, actor, {
      kind: item.amountCents > 0 ? "income" : "expense",
      amountCents: Math.abs(item.amountCents),
      merchant: item.name,
      note: "",
      occurredOn: op.dueDate,
      categoryId: item.categoryId,
      payerId: actor.id,
      refundOf: null,
      settlement: item.amountCents < 0,
      splitMethod: "equal",
      participants: [],
      reason: "",
    });
    await tx
      .update(groupEntries)
      .set({ recurringItemId: item.id })
      .where(eq(groupEntries.id, row.id));
    return row;
  }
  const [target] = await tx
    .select()
    .from(groupGoals)
    .where(and(eq(groupGoals.groupId, groupId), eq(groupGoals.isRoundupTarget, true)));
  if (!target) return { sweptCents: 0 };
  const entries = await tx
    .select()
    .from(groupEntries)
    .where(
      and(
        eq(groupEntries.groupId, groupId),
        isNull(groupEntries.voidedAt),
        isNull(groupEntries.roundupSweptAt),
      ),
    );
  const eligible = entries.filter((e) => e.kind === "expense" && roundUpCents(e.amountCents) > 0);
  const sweptCents = eligible.reduce((sum, e) => sum + roundUpCents(e.amountCents), 0);
  cents(target.savedCents + sweptCents, true);
  if (sweptCents) {
    await tx
      .update(groupGoals)
      .set({ savedCents: target.savedCents + sweptCents, updatedAt: new Date() })
      .where(eq(groupGoals.id, target.id));
    for (const entry of eligible)
      await tx
        .update(groupEntries)
        .set({ roundupSweptAt: new Date() })
        .where(eq(groupEntries.id, entry.id));
    await activity(tx, groupId, actor.id, "roundupSwept", target.id, { sweptCents });
  }
  return { id: target.id, sweptCents };
}
