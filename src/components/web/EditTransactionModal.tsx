"use client";

import { EditTransactionForm } from "@/components/shared/EditTransactionForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";

/** Web modal for editing the transaction referenced by `webEditTxnId`. */
export function EditTransactionModal() {
  const { transactions, webEditTxnId, set } = useStore();
  const txn = transactions.find((t) => t.id === webEditTxnId);
  if (!txn) return null;

  const close = () => set({ webEditTxnId: null });

  return (
    <Modal title="Edit transaction ✍️" onClose={close}>
      <div className="mt-4">
        <EditTransactionForm txn={txn} onDone={close} />
      </div>
    </Modal>
  );
}
