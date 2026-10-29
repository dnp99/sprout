import { parseCategoryTree } from "./category-tree-validation";
import type { CategoryTreeDraft } from "./category-tree";
/** Domain errors carry safe public messages and HTTP status without leaking SQL. */
export class GroupError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_CENTS = 2147483647;
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new GroupError("Invalid request.");
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 120, required = true): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim()))
    throw new GroupError("Check the text fields.");
  return value.trim();
}
export function id(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new GroupError("Invalid identifier.");
  return value;
}
/** Match the storage bound so money never silently overflows the database integer. */
export function cents(value: unknown, zero = false): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < (zero ? 0 : 1) ||
    (value as number) > MAX_CENTS
  )
    throw new GroupError("Enter a valid amount in cents.");
  return value as number;
}
/** Round-trip validation rejects normalized impossible calendar dates. */
export function date(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new GroupError("Choose a valid date.");
  return value;
}
export function month(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    throw new GroupError("Choose a valid month.");
  return value;
}
export interface EntryInput {
  id?: string;
  version?: number;
  kind: "expense" | "income" | "refund";
  amountCents: number;
  merchant: string;
  note: string;
  occurredOn: string;
  categoryId: string | null;
  payerId: string | null;
  refundOf: string | null;
  settlement: boolean;
  splitMethod: "equal" | "percentage";
  participants: { memberId: string; weight: number }[];
  reason: string;
}
export type GroupOperation =
  | { type: "categoryTree"; draft: CategoryTreeDraft; expectedRevision: number }
  | {
      type: "defaults";
      method: "equal" | "percentage" | "inherit";
      categoryId?: string | null;
      participants: { memberId: string; weight: number }[];
    }
  | { type: "entry"; entry: EntryInput }
  | { type: "void"; id: string; version: number; reason: string }
  | {
      type: "repayment";
      senderId: string;
      recipientId: string;
      amountCents: number;
      occurredOn: string;
      note: string;
      reason: string;
      duplicateIds: string[];
    }
  | { type: "reverse"; id: string; reason: string }
  | { type: "budget"; month: string; poolCents: number; allocations: Record<string, number> }
  | { type: "category"; id?: string; name: string; emoji: string; color: string; archived: boolean }
  | { type: "invite"; reactivateMemberId: string | null }
  | { type: "revoke"; id: string }
  | { type: "remove"; id: string }
  | { type: "transfer"; id: string }
  | { type: "leave" }
  | { type: "settings"; name: string; archived: boolean };
function version(v: unknown): number {
  if (!Number.isInteger(v) || (v as number) < 0) throw new GroupError("Reload this record.");
  return v as number;
}
function bool(v: unknown): boolean {
  if (typeof v !== "boolean") throw new GroupError("Invalid option.");
  return v;
}
function ids(v: unknown): string[] {
  if (!Array.isArray(v) || v.length > 100) throw new GroupError("Invalid members.");
  return v.map(id);
}
/** Parse a closed operation vocabulary; actors and group ownership never come from payloads. */
export function parseOperation(value: unknown): {
  key: string;
  revision: number;
  operation: GroupOperation;
} {
  const o = object(value),
    key = id(o.mutationId),
    revision = version(o.revision);
  let operation: GroupOperation;
  switch (o.type) {
    case "categoryTree":
      operation = {
        type: "categoryTree",
        draft: parseCategoryTree(o.draft),
        expectedRevision: version(o.expectedRevision),
      };
      break;
    case "defaults": {
      if (
        !["equal", "percentage", "inherit"].includes(String(o.method)) ||
        !Array.isArray(o.participants) ||
        o.participants.length > 100
      )
        throw new GroupError("Invalid split defaults.");
      const participants = o.participants.map((p) => {
        const row = object(p);
        return { memberId: id(row.memberId), weight: cents(row.weight, true) };
      });
      if (new Set(participants.map((p) => p.memberId)).size !== participants.length)
        throw new GroupError("Duplicate split member.");
      const categoryId = o.categoryId == null ? null : id(o.categoryId);
      if ((o.method === "inherit" && !categoryId) || participants.some((p) => p.weight > 10000))
        throw new GroupError("Invalid split defaults.");
      operation = {
        type: "defaults",
        method: o.method as "equal" | "percentage" | "inherit",
        participants,
        categoryId,
      };
      break;
    }
    case "entry": {
      const e = object(o.entry);
      if (
        !["expense", "income", "refund"].includes(String(e.kind)) ||
        !["equal", "percentage"].includes(String(e.splitMethod))
      )
        throw new GroupError("Invalid record type.");
      if (!Array.isArray(e.participants) || e.participants.length > 100)
        throw new GroupError("Choose participants.");
      const participants = e.participants.map((p) => {
        const row = object(p);
        return { memberId: id(row.memberId), weight: cents(row.weight, true) };
      });
      if (new Set(participants.map((p) => p.memberId)).size !== participants.length)
        throw new GroupError("Duplicate participant.");
      operation = {
        type: "entry",
        entry: {
          id: e.id ? id(e.id) : undefined,
          version: e.id ? version(e.version) : undefined,
          kind: e.kind as EntryInput["kind"],
          amountCents: cents(e.amountCents),
          merchant: text(e.merchant ?? "", 120, false),
          note: text(e.note ?? "", 1000, false),
          occurredOn: date(e.occurredOn),
          categoryId: e.categoryId ? id(e.categoryId) : null,
          payerId: e.payerId ? id(e.payerId) : null,
          refundOf: e.refundOf ? id(e.refundOf) : null,
          settlement: bool(e.settlement),
          splitMethod: e.splitMethod as EntryInput["splitMethod"],
          participants,
          reason: text(e.reason ?? "", 300, false),
        },
      };
      break;
    }
    case "void":
      operation = {
        type: "void",
        id: id(o.id),
        version: version(o.version),
        reason: text(o.reason, 300),
      };
      break;
    case "repayment":
      operation = {
        type: "repayment",
        senderId: id(o.senderId),
        recipientId: id(o.recipientId),
        amountCents: cents(o.amountCents),
        occurredOn: date(o.occurredOn),
        note: text(o.note ?? "", 1000, false),
        reason: text(o.reason ?? "", 300, false),
        duplicateIds: ids(o.duplicateIds ?? []),
      };
      break;
    case "reverse":
      operation = { type: "reverse", id: id(o.id), reason: text(o.reason, 300) };
      break;
    case "budget": {
      const allocations = Object.fromEntries(
        Object.entries(object(o.allocations)).map(([k, v]) => [id(k), cents(v, true)]),
      );
      if (Object.keys(allocations).length > 100) throw new GroupError("Too many categories.");
      const pool = cents(o.poolCents, true);
      if (Object.values(allocations).reduce((n, v) => n + v, 0) > pool)
        throw new GroupError("Category allocations exceed the monthly budget.");
      operation = { type: "budget", month: month(o.month), poolCents: pool, allocations };
      break;
    }
    case "category": {
      const color = text(o.color, 7);
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new GroupError("Choose a valid category color.");
      operation = {
        type: "category",
        id: o.id ? id(o.id) : undefined,
        name: text(o.name, 40),
        emoji: text(o.emoji, 32),
        color,
        archived: bool(o.archived),
      };
      break;
    }
    case "invite":
      operation = {
        type: "invite",
        reactivateMemberId: o.reactivateMemberId ? id(o.reactivateMemberId) : null,
      };
      break;
    case "revoke":
    case "remove":
    case "transfer":
      operation = { type: o.type, id: id(o.id) };
      break;
    case "leave":
      operation = { type: "leave" };
      break;
    case "settings":
      operation = { type: "settings", name: text(o.name, 50), archived: bool(o.archived) };
      break;
    default:
      throw new GroupError("Unknown operation.");
  }
  return { key, revision, operation };
}
