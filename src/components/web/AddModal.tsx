"use client";

import { AddForm } from "@/components/shared/AddForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function AddModal() {
  const { addMode, addMerchant, addAmountCents, commitAdd, resetAdd, set } = useStore(
    useShallow((s) => ({
      addMode: s.addMode,
      addMerchant: s.addMerchant,
      addAmountCents: s.addAmountCents,
      commitAdd: s.commitAdd,
      resetAdd: s.resetAdd,
      set: s.set,
    })),
  );
  const title = addMode === "income" ? "Add income" : "Add expense";
  // Merchant + a positive amount are required before saving.
  const canSubmit = addMerchant.trim() !== "" && addAmountCents > 0;
  const close = () => {
    resetAdd();
    set({ webAddOpen: false });
  };

  return (
    <Modal title={title} onClose={close}>
      <div className="mt-4 flex flex-col">
        <AddForm />
      </div>
      <button
        type="button"
        onClick={commitAdd}
        disabled={!canSubmit}
        className="mt-5 w-full rounded-[10px] bg-primary py-3 text-center text-[14px] font-semibold text-onprimary transition disabled:opacity-50"
      >
        Save
      </button>
    </Modal>
  );
}
