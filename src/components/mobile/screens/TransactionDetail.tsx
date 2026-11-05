"use client";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { TransactionDialog } from "@/components/shared/TransactionEntryForm";
import { EditTransactionForm } from "@/components/shared/EditTransactionForm";

/** Personal mobile edits reuse Group's dialog/field geometry while keeping the
 * Personal update adapter and all Personal-only accounting controls. */
export function TransactionDetail() {
  const t = useTranslations("addFlow");
  const [busy, setBusy] = useState(false);
  const { transactions, ledger, id, goMobile, returnTo } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      ledger: s.businessLedger,
      id: s.selectedTxnId,
      goMobile: s.goMobile,
      returnTo: s.txnReturnTo,
    })),
  );
  const txn =
    transactions.find((row) => row.id === id) ?? ledger?.rows.find((row) => row.id === id);
  useEffect(() => {
    if (!txn) goMobile(returnTo);
  }, [txn, goMobile, returnTo]);
  if (!txn) return null;
  const close = () => goMobile(returnTo);
  return (
    <TransactionDialog
      title={t("editTransactionModal")}
      onClose={() => {
        if (!busy) close();
      }}
    >
      <EditTransactionForm
        key={txn.id}
        txn={txn}
        onDone={close}
        onBusyChange={setBusy}
        sharedLayout
      />
    </TransactionDialog>
  );
}
