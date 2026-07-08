"use client";

import { AddForm } from "@/components/shared/AddForm";
import { useStore } from "@/state/store";
import { Plus, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

/** Mobile "Add transaction" sheet. Restyled to the shadcn-hybrid look; all
 *  entry logic (mode, amount keypad, merchant, category, recurring, save) lives
 *  in the shared AddForm and the Zustand store. */
export function Add() {
  const { addMode, commitAdd, resetAdd, goMobile } = useStore(
    useShallow((s) => ({
      addMode: s.addMode,
      commitAdd: s.commitAdd,
      resetAdd: s.resetAdd,
      goMobile: s.goMobile,
    })),
  );
  const title = addMode === "income" ? "Add income" : "Add expense";

  return (
    <div className="flex min-h-[560px] flex-col bg-bg">
      {/* Sheet header: close · title · save */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            resetAdd();
            goMobile("home");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <span className="text-[15px] font-semibold text-ink">{title}</span>
        <button
          type="button"
          onClick={commitAdd}
          className="text-[13px] font-semibold text-primary-dark"
        >
          Save
        </button>
      </div>

      {/* Form body: segmented toggle, amount, merchant, chips, recurring, keypad */}
      <div className="flex flex-1 flex-col px-4 pt-2">
        <AddForm showKeypad />
      </div>

      {/* Full-width primary save action */}
      <div className="px-4 pt-2 pb-3">
        <button
          type="button"
          onClick={commitAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary py-3 font-semibold text-onprimary"
        >
          <Plus size={16} strokeWidth={2.6} />
          Add transaction
        </button>
      </div>
    </div>
  );
}
