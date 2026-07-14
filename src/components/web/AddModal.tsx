"use client";

import { LoaderCircle } from "lucide-react";
import { AddForm } from "@/components/shared/AddForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function AddModal() {
  const {
    addMode,
    addMerchant,
    addAmountCents,
    addSubmitting,
    addSaveError,
    commitAdd,
    resetAdd,
    set,
  } = useStore(
    useShallow((s) => ({
      addMode: s.addMode,
      addMerchant: s.addMerchant,
      addAmountCents: s.addAmountCents,
      addSubmitting: s.addSubmitting,
      addSaveError: s.addSaveError,
      commitAdd: s.commitAdd,
      resetAdd: s.resetAdd,
      set: s.set,
    })),
  );
  const title = addMode === "income" ? "Add income" : "Add expense";
  // Merchant + a positive amount are required before saving.
  const canSubmit = addMerchant.trim() !== "" && addAmountCents > 0 && !addSubmitting;
  const close = () => {
    if (addSubmitting) return;
    resetAdd();
    set({ webAddOpen: false });
  };

  return (
    <Modal title={title} onClose={close}>
      <div className="mt-4 flex flex-col">
        <AddForm />
      </div>
      {addSaveError && <p className="mt-3 text-[12px] font-medium text-primary">{addSaveError}</p>}
      <button
        type="button"
        onClick={commitAdd}
        disabled={!canSubmit}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-center text-[14px] font-semibold text-onprimary transition disabled:opacity-50"
      >
        {addSubmitting && <LoaderCircle size={16} strokeWidth={2.2} className="animate-spin" />}
        {addSubmitting ? "Saving…" : "Save"}
      </button>
    </Modal>
  );
}
