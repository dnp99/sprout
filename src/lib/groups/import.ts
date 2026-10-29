import { groupCategoryLabel } from "./category-tree";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { groups, groupMembers, groupCategories, groupEntries, groupMutations } from "@/db/schema";
import { buildImportRows } from "@/lib/import/pipeline";
import { readCsv } from "@/lib/import/read-csv";
import { resolveImportSource } from "@/lib/import/request";
import {
  normalizeCategoryLabel,
  resolveCategoryKey,
  resolveUserCategoryId,
  KEY_TO_NAME,
} from "@/lib/import/category-map";
import { categorizeMerchants } from "@/lib/import/ai-categorize";
import type { ImportSummary } from "@/lib/import/types";
import {
  groupImportRowError,
  MAX_GROUP_IMPORT_BYTES,
  MAX_GROUP_IMPORT_ROWS,
} from "./import-preview";
export { MAX_GROUP_IMPORT_BYTES, MAX_GROUP_IMPORT_ROWS } from "./import-preview";
import { groupContext, activity, type GroupTx } from "./context";
import { GroupError, object, id } from "./validation";

/** Stable UUIDs deduplicate overlapping statements within a group and payer.
 * Re-imports preserve edits/voids; another member importing the same payer's
 * statement cannot duplicate its entries. Source account and occurrence are
 * included by the shared pipeline's externalId. No schema change is required. */
export function groupImportId(groupId: string, payer: string | null, externalId: string) {
  const hash = createHash("sha256")
    .update(JSON.stringify(["group-import", groupId, payer, externalId]))
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function parseGroupImport(value: unknown) {
  const body = object(value);
  if (
    typeof body.csv !== "string" ||
    !body.csv.trim() ||
    Buffer.byteLength(body.csv, "utf8") > MAX_GROUP_IMPORT_BYTES
  )
    throw new GroupError("Choose a CSV up to 8 MB.");
  if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 0)
    throw new GroupError("Reload this group.");
  if (typeof body.settlement !== "boolean" || typeof body.aiCategorize !== "boolean")
    throw new GroupError("Check import options.");
  let source;
  try {
    source = resolveImportSource({ csv: body.csv, preset: body.preset, mapping: body.mapping });
  } catch (error) {
    throw new GroupError(error instanceof Error ? error.message : "Invalid mapping.");
  }
  const records = readCsv(body.csv);
  if (records.length > MAX_GROUP_IMPORT_ROWS)
    throw new GroupError("Import at most 5,000 rows per file.");
  const valid = records.filter((row) => !groupImportRowError(row, source.mapping));
  if (!valid.length) throw new GroupError("No supported valid rows to import.");
  return {
    ...source,
    rows: buildImportRows(valid, source.mapping),
    skipped: records.length - valid.length,
    key: id(body.mutationId),
    revision: Number(body.revision),
    payer: body.payerId === null ? null : id(body.payerId),
    settlement: body.settlement,
    aiCategorize: body.aiCategorize,
    digest: createHash("sha256").update(JSON.stringify(body)).digest("hex"),
  };
}
type Input = ReturnType<typeof parseGroupImport>;
async function receipt(tx: GroupTx, groupId: string, actorId: string, input: Input) {
  const [row] = await tx
    .select()
    .from(groupMutations)
    .where(
      and(
        eq(groupMutations.groupId, groupId),
        eq(groupMutations.actorId, actorId),
        eq(groupMutations.key, input.key),
      ),
    );
  if (row && row.payloadHash !== input.digest)
    throw new GroupError("This import identifier was already used.", 409);
  return row?.result as ImportSummary | undefined;
}

/** Prepare only from authorized group categories. AI runs outside the write
 * lock; revision/membership/archive and payer are checked again before commit. */
export async function importGroup(
  userId: string,
  groupId: string,
  input: Input,
): Promise<ImportSummary> {
  const initial = await getDb().transaction(async (tx) => {
    const { group, actor } = await groupContext(tx, userId, groupId);
    const previous = await receipt(tx, groupId, actor.id, input);
    if (previous) return { previous, categories: [] };
    if (group.archivedAt) throw new GroupError("This group is archived and read-only.", 409);
    if (group.revision !== input.revision)
      throw new GroupError("Someone changed this group. Reload and review before importing.", 409);
    if (input.payer) {
      const [payer] = await tx
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.id, input.payer),
            eq(groupMembers.status, "active"),
          ),
        );
      if (!payer) throw new GroupError("Choose a current group payer.");
    }
    return {
      previous: undefined,
      categories: await tx
        .select()
        .from(groupCategories)
        .where(and(eq(groupCategories.groupId, groupId), eq(groupCategories.archived, false))),
    };
  });
  if (initial.previous) return initial.previous;
  const byName = new Map(
    initial.categories.flatMap((c) => [
      [normalizeCategoryLabel(c.name), c.id],
      [normalizeCategoryLabel(groupCategoryLabel(initial.categories, c.id)), c.id],
    ]),
  );
  const resolved = input.rows.map((row) => {
    const explicit = resolveUserCategoryId(row.sourceCategory, byName);
    const key = resolveCategoryKey(row.sourceCategory, input.categoryMap);
    return {
      row,
      categoryId:
        explicit ?? (key ? (byName.get(normalizeCategoryLabel(KEY_TO_NAME[key])) ?? null) : null),
    };
  });
  const ai = input.aiCategorize
    ? await categorizeMerchants(
        [...new Set(resolved.filter((r) => !r.categoryId).map((r) => r.row.merchant))],
        initial.categories.map((c) => c.name),
      )
    : new Map<string, string>();
  let aiCategorized = 0;
  for (const r of resolved)
    if (!r.categoryId) {
      r.categoryId = byName.get(normalizeCategoryLabel(ai.get(r.row.merchant) ?? "")) ?? null;
      if (r.categoryId) aiCategorized++;
    }
  return getDb().transaction(async (tx) => {
    const { group, actor } = await groupContext(tx, userId, groupId, true);
    const previous = await receipt(tx, groupId, actor.id, input);
    if (previous) return previous;
    if (group.archivedAt || group.revision !== input.revision)
      throw new GroupError(
        "This group changed or was archived. Reload and review before importing.",
        409,
      );
    const members = await tx
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));
    if (input.payer && !members.some((m) => m.id === input.payer))
      throw new GroupError("Choose a current group payer.");
    const existing = new Set(
      (
        await tx
          .select({ id: groupEntries.id })
          .from(groupEntries)
          .where(eq(groupEntries.groupId, groupId))
      ).map((r) => r.id),
    );
    const values = resolved
      .filter(({ row }) => !existing.has(groupImportId(groupId, input.payer, row.externalId)))
      .map(({ row, categoryId }) => {
        return {
          id: groupImportId(groupId, input.payer, row.externalId),
          groupId,
          authorId: actor.id,
          payerId: input.payer,
          categoryId,
          kind: row.kind,
          amountCents: row.amountCents,
          merchant: row.merchant,
          note: row.note ?? "",
          occurredOn: row.occurredAt,
          settlement: row.kind === "expense" && input.payer !== null,
          splitMethod: "equal",
        };
      });
    for (let offset = 0; offset < values.length; offset += 250) {
      const chunk = values.slice(offset, offset + 250);
      await tx.insert(groupEntries).values(chunk);
    }
    const summary: ImportSummary = {
      imported: values.length,
      excluded: input.skipped,
      uncategorized: values.filter((r) => !r.categoryId).length,
      reconciled: resolved.length - values.length,
      accounts: 0,
      aiCategorized,
    };
    await activity(tx, groupId, actor.id, "imported", groupId, {
      ...summary,
      payerId: input.payer,
      settlement: input.settlement,
      splitMethod: group.splitMethod,
    });
    await tx.insert(groupMutations).values({
      groupId,
      actorId: actor.id,
      key: input.key,
      payloadHash: input.digest,
      result: summary,
    });
    await tx
      .update(groups)
      .set({ revision: group.revision + 1, updatedAt: new Date() })
      .where(eq(groups.id, groupId));
    return summary;
  });
}
