"use client";

import { useTranslations } from "next-intl";
import { SearchDialog } from "@/components/shared/SearchDialog";
import { SearchDateScope } from "@/components/shared/SearchDateScope";
import { Select } from "@/components/ui/Select";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import { inputClass } from "./ui";

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
  const t = useTranslations("groups");
  return (
    <SearchDialog
      disabled={disabled}
      placeholder={t("search")}
      shortcut
      query={filters.query ?? ""}
      onQueryChange={(query) => onChange({ ...filters, query })}
    >
      <Select
        className={inputClass}
        value={filters.payer ?? ""}
        aria-label={t("paidBy")}
        onChange={(event) => onChange({ ...filters, payer: event.target.value })}
      >
        <option value="">{t("allMembers")}</option>
        <option value="shared">{t("sharedFunds")}</option>
        {data.members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </Select>
      <SearchDateScope
        from={filters.dateFrom}
        to={filters.dateTo}
        month={month}
        onChange={(dateFrom, dateTo) => onChange({ ...filters, scope: "all", dateFrom, dateTo })}
      />
    </SearchDialog>
  );
}
