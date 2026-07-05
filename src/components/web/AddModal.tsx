"use client";

import { AddForm } from "@/components/shared/AddForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";

export function AddModal() {
  const { addMode, commitAdd, resetAdd, set } = useStore();
  const title = addMode === "income" ? "Add income 💰" : "Add expense ✍️";
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
        className="mt-5 w-full rounded-2xl bg-primary py-3.5 text-center text-[15px] font-extrabold text-white"
      >
        Save
      </button>
    </Modal>
  );
}
