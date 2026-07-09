"use client";

import { AddForm } from "@/components/shared/AddForm";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Mobile "Add transaction" sheet. Restyled to the shadcn-hybrid look; all
 *  entry logic (mode, amount keypad, merchant, category, recurring, save) lives
 *  in the shared AddForm and the Zustand store. */
export function Add() {
  const { addMode, addMerchant, addAmountCents, commitAdd, resetAdd, goMobile } = useStore(
    useShallow((s) => ({
      addMode: s.addMode,
      addMerchant: s.addMerchant,
      addAmountCents: s.addAmountCents,
      commitAdd: s.commitAdd,
      resetAdd: s.resetAdd,
      goMobile: s.goMobile,
    })),
  );
  const title = addMode === "income" ? "Add income" : "Add expense";
  // Merchant + a positive amount are required before the transaction can be saved.
  const canSubmit = addMerchant.trim() !== "" && addAmountCents > 0;

  return (
    <div className="flex min-h-[560px] flex-col bg-bg">
      {/* Sheet header: Cancel · centered title */}
      <div className="relative flex items-center justify-center px-4 pb-1 pt-3">
        <button
          type="button"
          onClick={() => {
            resetAdd();
            goMobile("home");
          }}
          className="absolute left-4 text-[14px] font-medium text-muted transition hover:text-ink"
        >
          Cancel
        </button>
        <span className="text-[15px] font-semibold text-ink">{title}</span>
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
          disabled={!canSubmit}
          className="w-full rounded-[10px] bg-primary py-3 text-center text-[14px] font-semibold text-onprimary transition disabled:opacity-50"
        >
          {title}
        </button>
      </div>
    </div>
  );
}
