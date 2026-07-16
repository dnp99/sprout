"use client";

import { ChevronLeft } from "lucide-react";
import { useFormatters } from "@/i18n/useFormatters";
import { formatMoney, spentPercent } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

interface CategoryDetailPanelProps {
  category: Category;
  spentCents: number;
  budgetCents: number;
  transactions: Transaction[];
  onBack: () => void;
  onEdit: () => void;
  onOpenTransaction: (id: string) => void;
  className?: string;
}

/** Shared Budget drill-down so web and mobile expose the same category summary,
 * transaction list, and edit affordances while each parent owns navigation. */
export function CategoryDetailPanel({
  category,
  spentCents,
  budgetCents,
  transactions,
  onBack,
  onEdit,
  onOpenTransaction,
  className = "",
}: CategoryDetailPanelProps) {
  const fmt = useFormatters();
  const percent = spentPercent(spentCents, budgetCents);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1 lg:gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to budget"
            className="-ml-2.5 flex h-11 w-11 flex-none items-center justify-center rounded-lg text-muted transition active:bg-track lg:ml-0 lg:w-auto lg:gap-1 lg:px-2 lg:text-[12px] lg:font-semibold lg:hover:bg-track"
          >
            <ChevronLeft size={24} strokeWidth={2} />
            <span className="hidden lg:inline">Back to budget</span>
          </button>
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-track text-[15px] leading-none lg:h-9 lg:w-9 lg:text-[18px]">
            {category.emoji}
          </span>
          <span className="truncate text-[18px] font-bold tracking-[-.02em] text-ink lg:text-[22px]">
            {category.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 flex-none items-center rounded-[8px] border border-edge px-3 text-[11.5px] font-semibold text-ink transition active:bg-track lg:min-h-0 lg:px-3.5 lg:py-2 lg:text-[12px] lg:hover:border-primary lg:hover:text-primary"
        >
          Edit
        </button>
      </div>

      <div className="mt-3.5 lg:mt-5 lg:grid lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] lg:items-start lg:gap-4">
        <div className="rounded-[10px] bg-primary p-4 lg:rounded-[14px] lg:p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[30px] font-bold tracking-[-.02em] tabular-nums text-onprimary lg:text-[36px]">
              {formatMoney(spentCents)}
            </span>
            <span className="text-[12px] font-medium text-onprimary/85">
              of {formatMoney(budgetCents)}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-onprimary/25">
            <div className="h-full rounded-full bg-onprimary" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <section className="mt-4 lg:mt-0 lg:rounded-[14px] lg:border lg:border-edge lg:p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13.5px] font-semibold text-ink lg:text-[15px]">Transactions</h2>
            <span className="text-[11px] font-medium text-muted">
              {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}
            </span>
          </div>
          <div className="mt-2.5 overflow-hidden rounded-[10px] border border-edge">
            {transactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] font-medium text-muted">
                No transactions in this category yet.
              </div>
            ) : (
              transactions.map((txn, index) => (
                <button
                  key={txn.id}
                  type="button"
                  onClick={() => onOpenTransaction(txn.id)}
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-track ${
                    index > 0 ? "border-t border-edge" : ""
                  }`}
                >
                  <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-[15px] leading-none">
                    {txn.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-ink">
                      {txn.merchant}
                    </div>
                    <div className="text-[10.5px] font-medium text-muted">
                      {fmt.txnDate(txn.occurredAt)}
                    </div>
                  </div>
                  <span
                    className={`text-[12.5px] font-semibold tabular-nums ${
                      txn.isIncome ? "text-green" : "text-ink"
                    }`}
                  >
                    {formatMoney(txn.amountCents, { signed: true })}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
