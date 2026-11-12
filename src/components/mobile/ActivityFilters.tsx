"use client";
import { TransactionFilters } from "@/components/web/TransactionFilters";
import type { TxnSort } from "@/lib/search";
import type { TransactionScope } from "@/lib/transactions/scoped-filter";

/** The phone passes its existing sort and income-source owners to the shared draft. */
export function ActivityFilters({
  mobileTxnScope,
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
  return (
    <TransactionFilters
      mobile
      income={mobileTxnScope === "income"}
      incomeSourceFilter={incomeSourceFilter}
      onIncomeSourceChange={onIncomeSourceChange}
      sort={sort}
      onSort={onSort}
    />
  );
}
