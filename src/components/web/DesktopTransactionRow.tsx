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
  "grid grid-cols-[24px_minmax(100px,1.6fr)_minmax(105px,1.2fr)_minmax(120px,1fr)_90px_32px] xl:grid-cols-[28px_minmax(140px,1.8fr)_minmax(130px,1.3fr)_minmax(150px,1fr)_100px_36px] items-center";

// Virtualization: past this many rows, render only the visible window inside a
// scroll box (fixed row height) so a 5,000-row list stays smooth.
export const TRANSACTION_ROW_HEIGHT = 64;

/** One row owns edit actions and creation-time metadata across virtualized views. */
export function DesktopTransactionRow({
  txn,
  stripeIndex = 0,
  isSelected,
  selectionMode,
  searchingAllDates,
  toggleOne,
}: {
  txn: Transaction;
  stripeIndex?: number;
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
      data-selected={isSelected}
      data-stripe={stripeIndex % 2 === 0 ? "odd" : "even"}
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
      className={`record-row txrow group ${TRANSACTION_GRID} cursor-pointer border-t border-edge px-3 transition ${
        isSelected ? "bg-track" : "hover:bg-track"
      }`}
    >
      <span className="flex h-full items-center">
        <Checkbox
          record
          checked={isSelected}
          onChange={() => toggleOne(txn.id)}
          label={`Select ${txn.merchant}`}
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
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold">{txn.merchant}</span>
          {txn.note && (
            <span className="block truncate text-[11px] font-normal text-muted" title={txn.note}>
              {txn.note}
            </span>
          )}
        </span>
        <TxnTags txn={txn} />
      </button>
      <div className="flex h-full min-w-0 items-center gap-2 pr-2 text-[13px]">
        <InlineCategoryPicker txn={txn} disabled={selectionMode} />
      </div>
      <button
        type="button"
        onClick={openEdit}
        title={selectionMode ? t("clickToSelect") : t("clickToEdit")}
        className="desktop-transaction-date flex h-full min-w-0 flex-col items-start justify-center overflow-hidden pr-2 text-left text-[12.5px] font-medium text-muted"
      >
        <span className="max-w-full truncate">
          {searchingAllDates ? fmt.txnSearchDate(txn.occurredAt) : fmt.txnDate(txn.occurredAt)}
        </span>
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
