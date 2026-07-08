"use client";

import { formatMoney, spentPercent } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TxnTags } from "./TxnTags";

const INCOME_GREEN = "text-[#4f7a3a]";

/** White card row for a transaction (Home, Activity, Search results). */
export function TransactionCard({
  txn,
  onClick,
  showDate = true,
}: {
  txn: Transaction;
  onClick?: () => void;
  showDate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-pill bg-card px-[15px] py-3 text-left"
    >
      <span className="text-xl leading-none">{txn.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-ink">{txn.merchant}</span>
          <TxnTags txn={txn} />
        </div>
        <div
          className={`text-[11px] font-medium ${txn.isIncome ? "text-[#5f7a42]" : "text-muted"}`}
        >
          {txn.categoryName}
          {showDate && ` · ${txn.dateLabel}`}
        </div>
      </div>
      <span
        className={`text-sm font-extrabold tabular-nums ${txn.isIncome ? INCOME_GREEN : "text-ink"}`}
      >
        {formatMoney(txn.amountCents, { signed: true })}
      </span>
    </button>
  );
}

/** Emoji + name + amount + progress bar (Home category list). */
export function CategoryBar({ category, onClick }: { category: Category; onClick?: () => void }) {
  const percent = spentPercent(category.spentCents, category.monthlyBudgetCents);
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-left">
      <span className="text-xl leading-none">{category.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-[13.5px] font-bold text-ink">
          <span>{category.name}</span>
          <span className="tabular-nums">{formatMoney(category.spentCents)}</span>
        </div>
        <ProgressBar percent={percent} color={category.color} className="mt-1.5" />
      </div>
    </button>
  );
}
