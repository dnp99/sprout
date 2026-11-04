"use client";
import { categoryLabel } from "@/lib/categories/labels";
import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import { ReimbursementInfo } from "@/components/shared/ReimbursementInfo";
import { BusinessFilter } from "@/components/shared/BusinessActivity";
import { TransactionFilters } from "@/components/web/TransactionFilters";
import { TransactionTypeIcon } from "@/components/ui/TransactionTypeIcon";
import { Select } from "@/components/ui/Select";
import { TXN_TYPE_CHIPS, TXN_SORTS, type TxnSort } from "@/lib/search";
import type { TransactionScope } from "@/lib/transactions/scoped-filter";

/** Secondary filters stay in one inline disclosure so business labels do not add another
 * control row to the mobile ledger. The caller owns sorting and selection. */
export function ActivityFilters({
  mobileTxnScope,
  uncategorizedCount,
  incomeSourceFilter,
  onIncomeSourceChange,
  sort,
  onSort,
}: {
  mobileTxnScope: TransactionScope;
  uncategorizedCount: number;
  incomeSourceFilter: string;
  onIncomeSourceChange: (value: string) => void;
  sort: TxnSort;
  onSort: (value: TxnSort) => void;
}) {
  const t = useTranslations("txns");
  const { categories, incomeSources, searchType, txnCategory, set } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      incomeSources: s.incomeSources,
      searchType: s.searchType,
      txnCategory: s.txnCategory,
      set: s.set,
    })),
  );
  return (
    <TransactionFilters mobile>
      <BusinessFilter />
      {/* Wrapping keeps every filter visible and tappable instead of leaving the
       * final option looking accidentally clipped at narrow phone widths. */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {TXN_TYPE_CHIPS.filter(
          (chip) =>
            chip.value !== "all" &&
            chip.value !== "expense" &&
            chip.value !== "income" &&
            (mobileTxnScope !== "income" || chip.value !== "uncategorized") &&
            (mobileTxnScope === "all" || chip.value !== "reimbursement"),
        ).map((chip) => {
          const active = searchType === chip.value;
          const count =
            chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` ${uncategorizedCount}`
              : "";
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                set({ searchType: active ? "all" : chip.value });
              }}
              data-filter-kind={chip.value}
              className={`cozy-type-chip min-h-11 whitespace-nowrap rounded-[10px] border px-3 py-2 text-[12px] transition ${
                active
                  ? "border-primary bg-primary font-semibold text-onprimary"
                  : "border-edge font-medium text-muted"
              }`}
            >
              <TransactionTypeIcon type={chip.value} />
              {t(chip.labelKey)}
              {count}
            </button>
          );
        })}
      </div>

      {searchType === "reimbursement" && <ReimbursementInfo compact className="mt-2.5" />}

      {/* Category filter + sort share a row. */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative flex-1">
          {mobileTxnScope === "income" ? (
            <Select
              value={incomeSourceFilter}
              onChange={(event) => {
                onIncomeSourceChange(event.target.value);
              }}
              aria-label={t("selectIncomeSource")}
              className="h-11 w-full rounded-[10px] border border-edge bg-card px-3 text-[12px] font-medium text-ink"
            >
              <option value="all">{t("allIncomeSources")}</option>
              {incomeSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </Select>
          ) : (
            <>
              <Select
                value={txnCategory}
                onChange={(e) => set({ txnCategory: e.target.value })}
                aria-label="Filter by category"
                className={`h-11 w-full appearance-none rounded-[10px] border px-3 pr-9 text-[12px] font-medium outline-none ${
                  txnCategory === "all"
                    ? "border-edge bg-card text-ink"
                    : "border-primary bg-primary-soft text-primary-dark"
                }`}
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option data-icon={c.emoji} key={c.id} value={c.id}>
                    {categoryLabel(categories, c)}
                  </option>
                ))}
              </Select>
            </>
          )}
        </div>
        <div className="relative flex-none">
          <ArrowUpDown
            size={13}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink"
          />
          <Select
            value={sort}
            onChange={(e) => onSort(e.target.value as TxnSort)}
            aria-label="Sort transactions"
            className="h-11 appearance-none rounded-[10px] border border-edge bg-card pl-[30px] pr-3 text-[12px] font-semibold text-ink outline-none"
          >
            {TXN_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </TransactionFilters>
  );
}
