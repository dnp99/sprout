import { compareRecordOrder } from "@/lib/record-order";
import type { GroupEntry } from "./dto";
import { GroupError, id, date, MAX_CENTS } from "./validation";

export const GROUP_LEDGER_KINDS = ["all", "expense", "income", "refund", "uncategorized"] as const;
export const GROUP_LEDGER_SORTS = ["merchant", "category", "payer", "date", "amount"] as const;
export interface GroupLedgerFilters {
  kind?: (typeof GROUP_LEDGER_KINDS)[number];
  quick?: "refund" | "uncategorized";
  query?: string;
  payer?: string;
  category?: string;
  /** OR selection of exact category IDs; legacy single-category URLs remain valid. */
  categoryIds?: string[];
  scope?: "month" | "all";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  sort?: (typeof GROUP_LEDGER_SORTS)[number];
  direction?: "asc" | "desc";
}
export interface GroupLedgerLabels {
  categories?: { id: string; name: string; parentId?: string | null }[];
  members?: { id: string; name: string }[];
}
/** One adapter keeps legacy single filters and newer multi-selection consistent. */
export function groupCategoryIds(filters: GroupLedgerFilters): string[] {
  return filters.categoryIds?.length
    ? filters.categoryIds
    : filters.category
      ? [filters.category]
      : [];
}
export function withGroupCategoryIds(
  filters: GroupLedgerFilters,
  selected: readonly string[],
): GroupLedgerFilters {
  const next = { ...filters };
  delete next.categoryIds;
  return {
    ...next,
    category: selected.length === 1 ? selected[0] : undefined,
    ...(selected.length > 1 ? { categoryIds: [...selected] } : {}),
  };
}
function bound(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (raw === null || raw === "") return undefined;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value > MAX_CENTS)
    throw new GroupError("Invalid amount range.");
  return value;
}
/** Validate public filters before applying them to the authorized ledger. */
export function parseLedgerFilters(params: URLSearchParams): GroupLedgerFilters {
  const kind = params.get("kind") ?? "all";
  if (!GROUP_LEDGER_KINDS.includes(kind as NonNullable<GroupLedgerFilters["kind"]>))
    throw new GroupError("Invalid transaction type.");
  const quick = params.get("quick");
  if (quick && quick !== "refund" && quick !== "uncategorized")
    throw new GroupError("Invalid quick filter.");
  const query = (params.get("q") ?? "").trim();
  if (query.length > 120) throw new GroupError("Search must be at most 120 characters.");
  const payer = params.get("payer") ?? "";
  const category = params.get("category") ?? "";
  const rawCategories = params.get("categories")?.split(",").filter(Boolean) ?? [];
  if (rawCategories.length > 500) throw new GroupError("Too many category filters.");
  const categoryIds = [
    ...new Set(rawCategories.map((value) => (value === "uncategorized" ? value : id(value)))),
  ];
  const scope = params.get("scope") ?? "month";
  if (scope !== "month" && scope !== "all") throw new GroupError("Invalid search scope.");
  const from = params.get("from"),
    to = params.get("to");
  const dateFrom = from ? date(from) : undefined,
    dateTo = to ? date(to) : undefined;
  if (dateFrom && dateTo && dateFrom > dateTo) throw new GroupError("Invalid date range.");
  const sort = params.get("sort"),
    direction = params.get("direction");
  if (sort && !GROUP_LEDGER_SORTS.includes(sort as NonNullable<GroupLedgerFilters["sort"]>))
    throw new GroupError("Invalid sort column.");
  if (direction && direction !== "asc" && direction !== "desc")
    throw new GroupError("Invalid sort direction.");
  const amountMin = bound(params, "min"),
    amountMax = bound(params, "max");
  if (amountMin !== undefined && amountMax !== undefined && amountMin > amountMax)
    throw new GroupError("Invalid amount range.");
  return {
    ...(quick ? { quick: quick as GroupLedgerFilters["quick"] } : {}),
    query,
    payer: payer && payer !== "shared" ? id(payer) : payer,
    scope,
    ...(kind === "all" ? {} : { kind: kind as GroupLedgerFilters["kind"] }),
    ...(category ? { category: category === "uncategorized" ? category : id(category) } : {}),
    ...(categoryIds.length ? { categoryIds } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(amountMin !== undefined ? { amountMin } : {}),
    ...(amountMax !== undefined ? { amountMax } : {}),
    ...(sort ? { sort: sort as GroupLedgerFilters["sort"] } : {}),
    ...(direction ? { direction: direction as GroupLedgerFilters["direction"] } : {}),
  };
}
/** One serializer prevents client/API drift as filters evolve. Money bounds are cents. */
export function ledgerFilterParams(filters: GroupLedgerFilters) {
  const params = new URLSearchParams({
    q: filters.query ?? "",
    payer: filters.payer ?? "",
    scope: filters.scope ?? "month",
  });
  const keys = {
    quick: "quick",
    kind: "kind",
    category: "category",
    dateFrom: "from",
    dateTo: "to",
    amountMin: "min",
    amountMax: "max",
    sort: "sort",
    direction: "direction",
  } as const;
  for (const key of Object.keys(keys) as (keyof typeof keys)[]) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(keys[key], String(value));
  }
  if (filters.categoryIds?.length) params.set("categories", filters.categoryIds.join(","));
  return params;
}
/** Filter and sort the complete authorized ledger before pagination. Reports
 * retain their own month scope and never inherit transaction-view filters. */
export function searchLedger(
  entries: GroupEntry[],
  month: string,
  filters: GroupLedgerFilters = {},
  labels: GroupLedgerLabels = {},
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const selectedCategories = new Set(groupCategoryIds(filters));
  const categories = new Map(labels.categories?.map((row) => [row.id, row.name]));
  const payers = new Map(labels.members?.map((row) => [row.id, row.name]));
  return entries
    .filter((entry) => {
      const kind = filters.kind;
      return (
        !entry.voidedAt &&
        (!filters.quick ||
          (filters.quick === "refund" ? entry.kind === "refund" : !entry.categoryId)) &&
        (!kind ||
          kind === "all" ||
          (kind === "uncategorized" ? !entry.categoryId : entry.kind === kind)) &&
        (!selectedCategories.size || selectedCategories.has(entry.categoryId ?? "uncategorized")) &&
        (filters.dateFrom ||
          filters.dateTo ||
          filters.scope === "all" ||
          entry.occurredOn.startsWith(month)) &&
        (!filters.dateFrom || entry.occurredOn >= filters.dateFrom) &&
        (!filters.dateTo || entry.occurredOn <= filters.dateTo) &&
        (!filters.payer ||
          (filters.payer === "shared"
            ? entry.payerId === null
            : entry.payerId === filters.payer)) &&
        (filters.amountMin === undefined || Math.abs(entry.amountCents) >= filters.amountMin) &&
        (filters.amountMax === undefined || Math.abs(entry.amountCents) <= filters.amountMax) &&
        (!query ||
          `${entry.merchant}\n${entry.note}\n${categories.get(entry.categoryId ?? "") ?? ""}`
            .toLowerCase()
            .includes(query))
      );
    })
    .sort((a, b) => {
      const fallback = compareRecordOrder(
        { ...a, date: a.occurredOn },
        { ...b, date: b.occurredOn },
      );
      const key = filters.sort ?? "date",
        direction = filters.direction ?? "desc";
      let result = 0;
      if (key === "date") return direction === "asc" ? -fallback : fallback;
      if (key === "amount") result = a.amountCents - b.amountCents;
      else if (key === "merchant") result = a.merchant.localeCompare(b.merchant);
      else if (key === "category")
        result = (categories.get(a.categoryId ?? "") ?? "").localeCompare(
          categories.get(b.categoryId ?? "") ?? "",
        );
      else
        result = (payers.get(a.payerId ?? "") ?? "").localeCompare(
          payers.get(b.payerId ?? "") ?? "",
        );
      return (direction === "asc" ? result : -result) || fallback;
    });
}
