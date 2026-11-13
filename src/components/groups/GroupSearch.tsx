"use client";
import { useTranslations } from "next-intl";
import { TransactionFilterControl } from "@/components/shared/TransactionFilterControl";
import { emptyFilterDraft, filterAmount } from "@/lib/transactions/filter-draft";
import { useFormatters } from "@/i18n/useFormatters";
import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";
import type { GroupSnapshot } from "@/lib/groups/dto";
import {
  groupCategoryIds,
  withGroupCategoryIds,
  type GroupLedgerFilters,
} from "@/lib/groups/search";

/** Group keeps payer IDs and cents in its own applied filters; only the UI draft
 * is shared with Personal, and the authorized ledger query remains unchanged. */
export function GroupSearch({
  data,
  filters,
  month,
  disabled,
  onChange,
}: {
  data: GroupSnapshot;
  filters: GroupLedgerFilters;
  month: string;
  disabled: boolean;
  onChange: (next: GroupLedgerFilters) => void;
}) {
  const t = useTranslations("txns"),
    g = useTranslations("groups");
  const fmt = useFormatters();
  const moneyText = (value?: number) =>
    value === undefined
      ? ""
      : fmt
          .money(value, { forceCents: true })
          .replace(/[^\d.,]/g, "")
          .replace(fmt.locale === "fr-CA" ? /\./g : /,/g, "");
  const primary = filters.kind === "expense" || filters.kind === "income" ? filters.kind : "all";
  return (
    <TransactionFilterControl
      disabled={disabled}
      query={filters.query ?? ""}
      onQueryChange={(query) =>
        onChange({ ...filters, query, scope: query.trim() ? "all" : "month" })
      }
      applied={{
        ...emptyFilterDraft,
        scope: filters.scope ?? "month",
        categories: groupCategoryIds(filters),
        payer: filters.payer ?? "",
        min: moneyText(filters.amountMin),
        max: moneyText(filters.amountMax),
        from: filters.dateFrom ?? "",
        to: filters.dateTo ?? "",
        sort: `${filters.sort ?? "date"}:${filters.direction ?? "desc"}`,
        quick:
          filters.quick ??
          (filters.kind === "refund" || filters.kind === "uncategorized" ? filters.kind : ""),
      }}
      onApply={(draft) => {
        const [sort, direction] = draft.sort.split(":");
        onChange({
          ...withGroupCategoryIds(filters, draft.categories),
          kind: primary,
          quick: (draft.quick || undefined) as GroupLedgerFilters["quick"],
          payer: draft.payer,
          amountMin: filterAmount(draft.min, fmt.locale) ?? undefined,
          amountMax: filterAmount(draft.max, fmt.locale) ?? undefined,
          dateFrom: draft.from,
          dateTo: draft.to,
          scope: draft.scope,
          sort: sort as GroupLedgerFilters["sort"],
          direction: direction as GroupLedgerFilters["direction"],
        });
      }}
      config={{
        month,
        multipleCategories: true,
        defaultMonth: true,
        categories: [
          { value: "uncategorized", label: t("uncategorized") },
          ...orderGroupCategories(data.categories)
            .filter((o) => !o.archived || groupCategoryIds(filters).includes(o.id))
            .map((o) => ({ value: o.id, label: groupCategoryLabel(data.categories, o.id) })),
        ],
        payers: [
          { value: "", label: g("allMembers") },
          { value: "shared", label: g("sharedFunds") },
          ...data.members.map((o) => ({ value: o.id, label: o.name })),
        ],
        sorts: ["date", "amount", "merchant", "category", "payer"].flatMap((key) =>
          (["desc", "asc"] as const).map((dir) => ({
            value: `${key}:${dir}`,
            label:
              key === "date"
                ? t(dir === "desc" ? "newest" : "oldest")
                : key === "amount"
                  ? t(dir === "desc" ? "highest" : "lowest")
                  : `${key === "payer" ? g("paidBy") : t(key === "merchant" ? "colMerchant" : "colCategory")} · ${t(dir === "asc" ? "ascending" : "descending")}`,
          })),
        ),
        quick: [
          { value: "refund", label: t("chipRefunds") },
          { value: "uncategorized", label: t("chipUncategorized") },
        ],
      }}
    />
  );
}
