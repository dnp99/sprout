import { compareRecordOrder } from "@/lib/record-order";
import type { GroupEntry } from "./dto";
import { GroupError, id } from "./validation";

export interface GroupLedgerFilters {
  kind?: "all" | "expense" | "income";
  query?: string;
  payer?: string;
  scope?: "month" | "all";
}

/** Bound public filters before ledger work; IDs are compared only against the
 * already-authorized group's records, never used to broaden authorization. */
export function parseLedgerFilters(params: URLSearchParams): GroupLedgerFilters {
  const kind = params.get("kind") ?? "all";
  if (kind !== "all" && kind !== "expense" && kind !== "income")
    throw new GroupError("Invalid transaction type.");
  const query = (params.get("q") ?? "").trim();
  if (query.length > 120) throw new GroupError("Search must be at most 120 characters.");
  const payer = params.get("payer") ?? "";
  const scope = params.get("scope") ?? "month";
  if (scope !== "month" && scope !== "all") throw new GroupError("Invalid search scope.");
  return {
    query,
    payer: payer && payer !== "shared" ? id(payer) : payer,
    scope,
    ...(kind === "all" ? {} : { kind }),
  };
}

/** Filter the complete authorized ledger before pagination. Summaries and
 * reports remain month-scoped and independent of these transaction filters. */
export function searchLedger(
  entries: GroupEntry[],
  month: string,
  filters: GroupLedgerFilters = {},
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return entries
    .filter(
      (entry) =>
        !entry.voidedAt &&
        (!filters.kind || filters.kind === "all" || entry.kind === filters.kind) &&
        (filters.scope === "all" || entry.occurredOn.startsWith(month)) &&
        (!filters.payer ||
          (filters.payer === "shared"
            ? entry.payerId === null
            : entry.payerId === filters.payer)) &&
        (!query || `${entry.merchant}\n${entry.note}`.toLowerCase().includes(query)),
    )
    .sort((a, b) => compareRecordOrder({ ...a, date: a.occurredOn }, { ...b, date: b.occurredOn }));
}
