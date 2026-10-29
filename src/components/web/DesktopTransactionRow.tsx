"use client";
import { RecordedTime } from "@/components/shared/RecordedTime";
import { Checkbox } from "@/components/ui/Checkbox";
import { InlineCategoryPicker } from "@/components/shared/InlineCategoryPicker";
import { TxnTags } from "@/components/ui/TxnTags";
import { TransactionRowActions } from "./TransactionRowActions";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useFormatters } from "@/i18n/useFormatters";
import { useTranslations } from "next-intl";
// Shared grid template so header + rows align (checkbox / merchant / category /
// date / amount / actions) — mirrors the design's core table grid with a
// compact trailing action affordance.
export const TRANSACTION_GRID =
  "grid grid-cols-[32px_minmax(0,2.4fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(90px,1fr)_40px] items-center";

// Virtualization: past this many rows, render only the visible window inside a
// scroll box (fixed row height) so a 5,000-row list stays smooth.
export const TRANSACTION_ROW_HEIGHT = 53;

/** One row owns edit actions and creation-time metadata across virtualized views. */
export function DesktopTransactionRow({
  txn,
  isSelected,
  selectionMode,
  searchingAllDates,
  toggleOne,
}: {
  txn: Transaction;
  isSelected: boolean;
  selectionMode: boolean;
  searchingAllDates: boolean;
  toggleOne: (id: string) => void;
}) {
  const set = useStore((s) => s.set);
  const bulkExclude = useStore((s) => s.bulkExclude);
  const bulkDelete = useStore((s) => s.bulkDelete);
  const fmt = useFormatters();
  const t = useTranslations("txns");
  const openEdit = () => set({ webEditTxnId: txn.id });

  return (
    <div
      key={txn.id}
      style={{ height: TRANSACTION_ROW_HEIGHT }}
      onPointerDownCapture={(event) => {
        // Native selects open on pointer down. Suppress that default while
        // bulk selection is active so every part of the row has one meaning.
        if (selectionMode) event.preventDefault();
      }}
      onClickCapture={(event) => {
        if (!selectionMode) return;
        event.preventDefault();
        event.stopPropagation();
        toggleOne(txn.id);
      }}
      className={`txrow group ${TRANSACTION_GRID} cursor-pointer border-t border-edge px-3 transition ${
        isSelected ? "bg-track" : "hover:bg-track"
      }`}
    >
      <span className="flex h-full items-center">
        <Checkbox
          checked={isSelected}
          onChange={() => toggleOne(txn.id)}
          label={`Select ${txn.merchant}`}
          // bg-track (hover/selected) equals border-edge in dark mode, so lift
          // the unchecked box's border there to keep it visible.
          className="group-hover:[&>span]:border-subtle"
        />
      </span>
      <button
        type="button"
        onClick={openEdit}
        title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
        className="flex h-full min-w-0 items-center gap-[11px] pr-2 text-left"
      >
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-track text-[11px] font-semibold">
          {txn.merchant.charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-[13.5px] font-semibold">{txn.merchant}</span>
        <TxnTags txn={txn} />
      </button>
      <div className="flex h-full items-center pr-2 text-[13px]">
        <InlineCategoryPicker txn={txn} disabled={selectionMode} />
      </div>
      <button
        type="button"
        onClick={openEdit}
        title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
        className="flex h-full flex-col items-start justify-center text-left text-[12.5px] font-medium text-muted"
      >
        {searchingAllDates ? fmt.txnSearchDate(txn.occurredAt) : fmt.txnDate(txn.occurredAt)}
        <RecordedTime value={txn.createdAt} />
      </button>
      <button
        type="button"
        onClick={openEdit}
        title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
        className={`flex h-full items-center justify-end whitespace-nowrap pr-2 text-right text-[13.5px] font-semibold tabular-nums ${
          txn.isIncome ? "text-green" : ""
        }`}
      >
        {formatMoney(txn.amountCents, { signed: true })}
      </button>
      <TransactionRowActions
        excluded={Boolean(txn.excludeFromBudget)}
        onEdit={openEdit}
        onExclude={async () => {
          await bulkExclude([txn.id]);
        }}
        onDelete={async () => {
          await bulkDelete([txn.id]);
        }}
      />
    </div>
  );
}
