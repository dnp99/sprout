"use client";
import { TransactionScopeSwitch } from "@/components/shared/TransactionScopeSwitch";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormatters } from "@/i18n/useFormatters";
import { parseMoney } from "@/lib/import/amount";
import { MAX_CENTS } from "@/lib/groups/validation";
import { Select } from "@/components/ui/Select";
import { TransactionTypeIcon } from "@/components/ui/TransactionTypeIcon";
import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";
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
  const kinds = GROUP_LEDGER_KINDS;
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
          <TransactionTypeIcon type={kind === "refund" ? "reimbursement" : kind} />
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
export function GroupAdvancedFilters(props: GroupFilterProps) {
  const { data, filters, disabled, onChange } = props;
  const t = useTranslations("txns"),
    g = useTranslations("groups");
  return (
    <>
      <div className="lg:hidden">
        <GroupPayerFilter {...props} />
      </div>
      <Select
        className="min-h-11 w-full rounded-[8px] border border-edge bg-card px-3 text-[12px]"
        value={filters.category ?? ""}
        disabled={disabled}
        aria-label={t("category")}
        onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
      >
        <option value="">{t("allCategories")}</option>
        <option value="uncategorized">{t("uncategorized")}</option>
        {orderGroupCategories(data.categories)
          .filter((row) => !row.archived || row.id === filters.category)
          .map((row) => (
            <option key={row.id} value={row.id}>
              {groupCategoryLabel(data.categories, row.id)}
            </option>
          ))}
      </Select>
      <div className="flex flex-wrap gap-2 lg:hidden">
        {(["refund", "uncategorized"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            aria-pressed={filters.kind === kind}
            className={`min-h-11 rounded-[8px] border border-edge px-3 text-[12px] ${filters.kind === kind ? "bg-primary text-onprimary" : "bg-card text-muted"}`}
            onClick={() => onChange({ ...filters, kind: filters.kind === kind ? "all" : kind })}
          >
            {t(kindLabels[kind])}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-2 text-[12px] text-muted">{t("amountRange")}</div>
        <div className="grid grid-cols-2 gap-2">
          <AmountBound
            key={`min:${filters.amountMin}`}
            value={filters.amountMin}
            label={t("min")}
            disabled={disabled}
            onChange={(amountMin) => onChange({ ...filters, amountMin })}
          />
          <AmountBound
            key={`max:${filters.amountMax}`}
            value={filters.amountMax}
            label={t("max")}
            disabled={disabled}
            onChange={(amountMax) => onChange({ ...filters, amountMax })}
          />
        </div>
      </div>
      <Select
        value={`${filters.sort ?? "date"}:${filters.direction ?? "desc"}`}
        disabled={disabled}
        aria-label={t("sortBy", { column: t("colDate") })}
        className="min-h-11 w-full rounded-[8px] border border-edge bg-card px-3 text-[12px]"
        onChange={(e) => {
          const [sort, direction] = e.target.value.split(":");
          onChange({
            ...filters,
            sort: sort as GroupLedgerFilters["sort"],
            direction: direction as GroupLedgerFilters["direction"],
          });
        }}
      >
        <option value="date:desc">{t("newest")}</option>
        <option value="date:asc">{t("oldest")}</option>
        <option value="amount:desc">{t("highest")}</option>
        <option value="amount:asc">{t("lowest")}</option>
        <option value="merchant:asc">{t("colMerchant")}</option>
        <option value="category:asc">{t("colCategory")}</option>
        <option value="payer:asc">{g("paidBy")}</option>
      </Select>
    </>
  );
}
/** Keep the typed decimal local until blur; requests always carry bounded cents. */
function AmountBound({
  value,
  label,
  disabled,
  onChange,
}: {
  value?: number;
  label: string;
  disabled: boolean;
  onChange: (value?: number) => void;
}) {
  const fmt = useFormatters();
  const [raw, setRaw] = useState(value === undefined ? "" : fmt.money(value, { forceCents: true }));
  const [invalid, setInvalid] = useState(false);
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      placeholder={label}
      disabled={disabled}
      value={raw}
      aria-invalid={invalid}
      className={`min-h-11 min-w-0 rounded-[8px] border bg-card px-3 text-[16px] lg:text-[12px] ${invalid ? "border-danger" : "border-edge"}`}
      onChange={(e) => {
        setRaw(e.target.value);
        setInvalid(false);
      }}
      onBlur={() => {
        if (!raw.trim()) {
          onChange(undefined);
          return;
        }
        const parsed = parseMoney(raw, fmt.locale === "fr-CA" ? "comma" : "period");
        if (!parsed.ok || parsed.cents < 0 || parsed.cents > MAX_CENTS) {
          setInvalid(true);
          return;
        }
        onChange(parsed.cents);
      }}
    />
  );
}
