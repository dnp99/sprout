"use client";

import { useTranslations } from "next-intl";
import { SearchDialog } from "@/components/shared/SearchDialog";
import { SearchDateScope } from "@/components/shared/SearchDateScope";
import { GroupAdvancedFilters } from "./GroupTransactionFilters";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupLedgerFilters } from "@/lib/groups/search";

/** Query, actual payer and dates intersect before server pagination. */
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
  const t = useTranslations("txns");
  const g = useTranslations("groups");
  const payerName =
    filters.payer === "shared"
      ? g("sharedFunds")
      : data.members.find((member) => member.id === filters.payer)?.name;
  return (
    <SearchDialog
      activeFilters={
        filters.payer
          ? [
              {
                id: "payer",
                label: `${g("paidBy")}: ${payerName ?? g("allMembers")}`,
                onClear: () => onChange({ ...filters, payer: "" }),
              },
            ]
          : []
      }
      disabled={disabled}
      placeholder={t("searchPlaceholder")}
      shortcut
      query={filters.query ?? ""}
      onQueryChange={(query) =>
        onChange({ ...filters, query, scope: query.trim() ? "all" : "month" })
      }
    >
      <GroupAdvancedFilters data={data} filters={filters} disabled={disabled} onChange={onChange} />
      <SearchDateScope
        from={filters.dateFrom}
        to={filters.dateTo}
        month={month}
        onChange={(dateFrom, dateTo) => onChange({ ...filters, scope: "all", dateFrom, dateTo })}
      />
      <button
        type="button"
        disabled={disabled}
        className="min-h-11 text-[12px] text-muted"
        onClick={() => onChange({ scope: "month" })}
      >
        {t("clearFilters")}
      </button>
    </SearchDialog>
  );
}
