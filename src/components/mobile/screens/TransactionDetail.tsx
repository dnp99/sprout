"use client";

import { useState } from "react";
import { EditTransactionForm } from "@/components/shared/EditTransactionForm";
import { ScreenHeader } from "@/components/ui/headers";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function TransactionDetail() {
  const { transactions, selectedTxnId, goMobile } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      selectedTxnId: s.selectedTxnId,
      goMobile: s.goMobile,
    })),
  );
  const txn = transactions.find((t) => t.id === selectedTxnId) ?? transactions[0];
  const [editing, setEditing] = useState(false);

  if (!txn) {
    return (
      <div className="px-[22px] pt-3">
        <ScreenHeader title="Transaction" onBack={() => goMobile("history")} />
        <div className="mt-6 text-center text-sm font-semibold text-muted">
          Transaction not found.
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="px-[22px] pt-3">
        <ScreenHeader title="Edit transaction" onBack={() => setEditing(false)} />
        <div className="mt-5">
          <EditTransactionForm txn={txn} onDone={() => goMobile("history")} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title="Transaction" onBack={() => goMobile("history")} />

      <div className="mt-5 flex flex-col items-center gap-2.5 rounded-[26px] bg-card px-5 py-6">
        <span className="flex h-[70px] w-[70px] items-center justify-center rounded-3xl bg-[#fbeee2] text-4xl">
          {txn.emoji}
        </span>
        <div
          className={`text-[42px] font-extrabold tracking-tight tabular-nums ${txn.isIncome ? "text-[#4f7a3a]" : "text-ink"}`}
        >
          {formatMoney(txn.amountCents, { signed: true })}
        </div>
        <div className="text-base font-extrabold text-ink">{txn.merchant}</div>
        <span className="rounded-2xl bg-peach-soft px-3 py-1 text-[11.5px] font-bold text-primary-dark">
          {txn.categoryName}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <DetailRow label="Date" value={txn.timeLabel ?? txn.dateLabel} />
        <DetailRow label="Payment" value={txn.method} />
        <DetailRow label="Status" value="Posted ✅" valueClass="text-[#4f7a3a]" />
        <div className="rounded-2xl bg-card px-4 py-3.5">
          <div className="text-[11px] font-extrabold uppercase text-muted">Note</div>
          <div className="mt-1 text-[13.5px] font-semibold text-ink">{txn.note ?? "No note"}</div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full rounded-2xl bg-peach-soft py-3.5 text-sm font-extrabold text-primary-dark"
        >
          Edit ✍️
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between rounded-2xl bg-card px-4 py-3.5">
      <span className="text-[13px] font-bold text-muted">{label}</span>
      <span className={`text-[13px] font-extrabold ${valueClass ?? "text-ink"}`}>{value}</span>
    </div>
  );
}
