"use client";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { filterAmount, resetFilterDraft, type FilterDraft } from "@/lib/transactions/filter-draft";
import { SearchDialog } from "./SearchDialog";
import { TransactionFilterEditor, type FilterConfig } from "./TransactionFilterEditor";
import { transactionFilterChips } from "./TransactionFilterChips";

/** Ledger adapters own applied state; this control owns only an ephemeral draft. */
export function TransactionFilterControl({
  applied,
  config,
  query,
  onQueryChange,
  onApply,
  disabled,
  shortcut = true,
}: {
  applied: FilterDraft;
  config: FilterConfig;
  query: string;
  onQueryChange: (value: string) => void;
  onApply: (draft: FilterDraft) => void;
  disabled?: boolean;
  shortcut?: boolean;
}) {
  const t = useTranslations("txns"),
    g = useTranslations("groups"),
    b = useTranslations("businessActivity");
  const fmt = useFormatters();
  const chips = transactionFilterChips(
    applied,
    config,
    {
      category: t("category"),
      payer: g("paidBy"),
      min: t("min"),
      max: t("max"),
      date: t("dateRange"),
      allDates: g("allDates"),
      sort: t("sortLabel"),
      business: b("filter"),
      source: t("selectIncomeSource"),
    },
    onApply,
  ).map((chip) =>
    chip.id === "min" || chip.id === "max"
      ? {
          ...chip,
          label: `${t(chip.id)}: ${fmt.money(filterAmount(applied[chip.id], fmt.locale) ?? 0, { forceCents: true })}`,
        }
      : chip,
  );
  return (
    <SearchDialog
      query={query}
      onQueryChange={onQueryChange}
      shortcut={shortcut}
      disabled={disabled}
      activeFilters={chips}
      onClearAll={() =>
        onApply({ ...resetFilterDraft(), scope: config.defaultMonth ? "month" : applied.scope })
      }
    >
      {(onClose) => (
        <TransactionFilterEditor
          key={JSON.stringify(applied)}
          applied={applied}
          config={config}
          onApply={onApply}
          onClose={onClose}
        />
      )}
    </SearchDialog>
  );
}
