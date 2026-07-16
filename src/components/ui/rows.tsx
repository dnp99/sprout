"use client";

import { Check } from "lucide-react";
import { formatMoney, spentPercent } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TxnTags } from "./TxnTags";
import { useFormatters } from "@/i18n/useFormatters";

const INCOME_GREEN = "text-[#4f7a3a]";

/** White card row for a transaction (Home, Activity, Search results). */
export function TransactionCard({
  txn,
  onClick,
  showDate = true,
  selectable = false,
  selected = false,
  onToggle,
}: {
  txn: Transaction;
  onClick?: () => void;
  showDate?: boolean;
  /** Multi-select mode (Activity): show a check circle and toggle on tap. */
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const fmt = useFormatters();
  return (
    <button
      type="button"
      onClick={selectable ? onToggle : onClick}
      className={`flex items-center gap-3 rounded-pill px-[15px] py-3 text-left transition-colors ${
        selected ? "bg-primary-soft" : "bg-card"
      }`}
    >
      {selectable && (
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
            selected ? "border-primary bg-primary text-onprimary" : "border-track"
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </span>
      )}
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
          {showDate && ` · ${fmt.txnDate(txn.occurredAt)}`}
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
