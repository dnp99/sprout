"use client";
import { TransactionScopeSwitch } from "@/components/shared/TransactionScopeSwitch";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { TransactionTypeIcon } from "@/components/ui/TransactionTypeIcon";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import { GROUP_LEDGER_KINDS } from "@/lib/groups/search";

export type GroupFilterProps = {
  data: GroupSnapshot;
  filters: GroupLedgerFilters;
  disabled: boolean;
  onChange: (filters: GroupLedgerFilters) => void;
};
export const kindLabels = {
  all: "chipAll",
  expense: "chipExpense",
  income: "chipIncome",
  refund: "chipRefunds",
  uncategorized: "chipUncategorized",
} as const;
export function GroupTypeFilters({
  filters,
  disabled,
  onChange,
  mobile = false,
}: Omit<GroupFilterProps, "data"> & { mobile?: boolean }) {
  const t = useTranslations("txns");
  if (mobile)
    return (
      <TransactionScopeSwitch
        value={
          !filters.kind || filters.kind === "all"
            ? "all"
            : filters.kind === "expense" || filters.kind === "income"
              ? filters.kind
              : null
        }
        disabled={disabled}
        onChange={(kind) => onChange({ ...filters, kind })}
      />
    );
  const kinds = GROUP_LEDGER_KINDS.filter(
    (kind) => kind === "all" || kind === "expense" || kind === "income",
  );
  return (
    <div className="flex flex-wrap gap-[9px]" role="group" aria-label={t("transactionScope")}>
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          disabled={disabled}
          aria-pressed={(filters.kind ?? "all") === kind}
          data-filter-kind={kind}
          onClick={() => onChange({ ...filters, kind })}
          className={`cozy-type-chip whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12px] transition ${(filters.kind ?? "all") === kind ? "bg-primary font-semibold text-onprimary" : "border border-edge bg-card font-medium text-muted hover:text-ink"}`}
        >
          <TransactionTypeIcon type={kind} />
          {t(kindLabels[kind])}
        </button>
      ))}
    </div>
  );
}
export function GroupPayerFilter({ data, filters, disabled, onChange }: GroupFilterProps) {
  const t = useTranslations("groups");
  return (
    <Select
      className="min-h-11 rounded-[10px] border border-edge bg-card px-3 text-[12px] text-ink"
      value={filters.payer ?? ""}
      disabled={disabled}
      aria-label={t("paidBy")}
      onChange={(e) => onChange({ ...filters, payer: e.target.value })}
    >
      <option value="">{t("allMembers")}</option>
      <option value="shared">{t("sharedFunds")}</option>
      {data.members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </Select>
  );
}
