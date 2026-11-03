"use client";

import type { ReactNode } from "react";
import { RecordSummary } from "@/components/shared/RecordSummary";
import { RecordedTime } from "@/components/shared/RecordedTime";
import { EntitySymbol } from "@/components/ui/EntitySymbol";

import { Check } from "lucide-react";
import { formatMoney, spentPercent } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { TxnTags } from "./TxnTags";
import { useFormatters } from "@/i18n/useFormatters";
import { useTranslations } from "next-intl";

const INCOME_GREEN = "text-green";

/** White card row for a transaction (Home, Activity, Search results). */
export function TransactionCard({
  txn,
  onClick,
  showDate = true,
  showDateYear = false,
  selectable = false,
  selected = false,
  onToggle,
  actions,
}: {
  txn: Transaction;
  onClick?: () => void;
  showDate?: boolean;
  /** Search spans multiple years, so its rows use an unambiguous full date. */
  showDateYear?: boolean;
  /** Multi-select mode (Activity): show a check circle and toggle on tap. */
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  actions?: ReactNode;
}) {
  const fmt = useFormatters();
  const t = useTranslations("txns");
  const content = (
    <>
      {" "}
      {selectable && (
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
            selected ? "border-primary bg-primary text-onprimary" : "selection-empty-box"
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </span>
      )}
      <span className="text-xl leading-none">
        <EntitySymbol emoji={txn.emoji} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-ink">{txn.merchant}</span>
          <TxnTags txn={txn} />
        </div>
        <RecordSummary
          category={txn.categoryName}
          note={txn.note}
          date={
            showDate
              ? showDateYear
                ? fmt.txnSearchDate(txn.occurredAt)
                : fmt.txnDate(txn.occurredAt)
              : undefined
          }
        />
        <span className="transaction-recorded-time">
          <RecordedTime value={txn.createdAt} />
        </span>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${txn.isIncome ? INCOME_GREEN : "text-ink"}`}
      >
        {fmt.money(txn.amountCents, { signed: true })}
      </span>
    </>
  );
  const rowClass = `record-row cozy-transaction-row flex items-center gap-3 rounded-pill px-[15px] py-1.5 text-left outline-none transition-colors ${selected ? "bg-primary-soft" : "bg-card"}`;
  if (actions && !selectable)
    return (
      <article className={rowClass}>
        <button
          type="button"
          onClick={onClick}
          title={t("clickToEdit")}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-left"
        >
          {content}
        </button>
        {actions}
      </article>
    );
  return (
    <button
      type="button"
      onClick={selectable ? onToggle : onClick}
      aria-pressed={selectable ? selected : undefined}
      title={onClick && !selectable ? t("clickToEdit") : undefined}
      className={`record-row cozy-transaction-row flex items-center gap-3 rounded-pill px-[15px] py-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 ${
        selected ? "bg-primary-soft" : "bg-card"
      }`}
    >
      {content}
    </button>
  );
}

/** Emoji + name + amount + progress bar (Home category list). */
export function CategoryBar({ category, onClick }: { category: Category; onClick?: () => void }) {
  const fmt = useFormatters();
  const percent = spentPercent(category.spentCents, category.monthlyBudgetCents);
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-left">
      <span className="text-xl leading-none">
        <EntitySymbol emoji={category.emoji} color={category.color} />
      </span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-[13.5px] font-bold text-ink">
          <span>{category.name}</span>
          <span className="tabular-nums">{fmt.money(category.spentCents)}</span>
        </div>
        <ProgressBar percent={percent} color={category.color} className="mt-1.5" />
      </div>
    </button>
  );
}
