import { date, id, object, text, GroupError } from "./validation";

export const MAX_GROUP_BULK = 200;
export type GroupSelection = { id: string; version: number }[];
export type BulkAction =
  | { action: "export" }
  | { action: "delete"; reason: string }
  | { action: "date"; occurredOn: string }
  | { action: "category"; categoryId: string | null }
  | {
      action: "copy";
      targetId: string;
      targetRevision: number;
      payerId: string | null;
      settlement: boolean;
    };
export type GroupBulkInput = BulkAction & {
  key: string;
  revision: number;
  entries: GroupSelection;
};
function revision(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new GroupError("Reload and review the selected records.");
  return Number(value);
}
/** Explicit IDs and versions prevent page/filter changes from silently changing the batch. */
export function parseGroupBulk(value: unknown): GroupBulkInput {
  const body = object(value);
  if (!Array.isArray(body.entries) || !body.entries.length || body.entries.length > MAX_GROUP_BULK)
    throw new GroupError(`Select 1–${MAX_GROUP_BULK} records.`);
  const entries = body.entries.map((v) => {
    const row = object(v);
    return { id: id(row.id), version: revision(row.version) };
  });
  if (new Set(entries.map((e) => e.id)).size !== entries.length)
    throw new GroupError("Duplicate selected record.");
  const base = { key: id(body.mutationId), revision: revision(body.revision), entries };
  switch (body.action) {
    case "export":
      return { ...base, action: "export" };
    case "delete":
      return { ...base, action: "delete", reason: text(body.reason, 300) };
    case "date":
      return { ...base, action: "date", occurredOn: date(body.occurredOn) };
    case "category":
      return {
        ...base,
        action: "category",
        categoryId: body.categoryId === null ? null : id(body.categoryId),
      };
    case "copy": {
      if (typeof body.settlement !== "boolean") throw new GroupError("Choose copy options.");
      return {
        ...base,
        action: "copy",
        targetId: id(body.targetId),
        targetRevision: revision(body.targetRevision),
        payerId: body.payerId === null ? null : id(body.payerId),
        settlement: body.settlement,
      };
    }
    default:
      throw new GroupError("Invalid bulk action.");
  }
}
