"use client";

import { EditTransactionForm } from "@/components/shared/EditTransactionForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

/** Web modal for editing the transaction referenced by `webEditTxnId`. */
export function EditTransactionModal() {
  const t = useTranslations("addFlow");
  const { transactions, webEditTxnId, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      webEditTxnId: s.webEditTxnId,
      set: s.set,
    })),
  );
  const txn = transactions.find((t) => t.id === webEditTxnId);
  if (!txn) return null;

  const close = () => set({ webEditTxnId: null });

  return (
    <Modal title={t("editTransactionModal")} onClose={close}>
      <div className="mt-4">
        <EditTransactionForm txn={txn} onDone={close} />
      </div>
    </Modal>
  );
}
