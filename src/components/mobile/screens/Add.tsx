"use client";

import { AddForm } from "@/components/shared/AddForm";
import { formatMoney } from "@/lib/format";
import { LoaderCircle, Plus } from "lucide-react";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Mobile "Add transaction" sheet. Restyled to the shadcn-hybrid look; all
 *  entry logic (mode, amount keypad, merchant, category, recurring, save) lives
 *  in the shared AddForm and the Zustand store. */
export function Add() {
  const {
    addMode,
    addMerchant,
    addAmountCents,
    addSubmitting,
    addSaveError,
    addReturnTo,
    commitAdd,
    resetAdd,
    goMobile,
  } = useStore(
    useShallow((s) => ({
      addMode: s.addMode,
      addMerchant: s.addMerchant,
      addAmountCents: s.addAmountCents,
      addSubmitting: s.addSubmitting,
      addSaveError: s.addSaveError,
      addReturnTo: s.addReturnTo,
      commitAdd: s.commitAdd,
      resetAdd: s.resetAdd,
      goMobile: s.goMobile,
    })),
  );
  const title = addMode === "income" ? "Add income" : "Add expense";
  const amountLabel = formatMoney(addAmountCents, {
    forceCents: true,
    signed: addMode === "income",
  });
  // Merchant + a positive amount are required before the transaction can be saved.
  const canSubmit = addMerchant.trim() !== "" && addAmountCents > 0 && !addSubmitting;

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <div className="shrink-0 bg-bg/95 px-4 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.65rem)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={addSubmitting}
            onClick={() => {
              resetAdd();
              goMobile(addReturnTo);
            }}
            // ≥44px tap target (design min); negative margin keeps the label
            // flush-left so the header doesn't visually shift.
            className="-ml-2 flex min-h-[44px] items-center rounded-lg px-2 text-[14px] font-semibold text-muted transition hover:text-ink active:bg-track/60 disabled:opacity-50"
          >
            Cancel
          </button>
          <span className="text-[15px] font-semibold text-ink">{title}</span>
          <span className="min-w-[52px]" aria-hidden="true" />
        </div>
        <div className="mt-3 rounded-[16px] border border-edge bg-card px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-subtle">
            Amount
          </div>
          <div
            className={`mt-1 text-center text-[42px] leading-none font-bold tabular-nums ${
              addMode === "income" ? "text-green" : "text-primary"
            }`}
          >
            {amountLabel}
          </div>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1.5">
        <AddForm showKeypad showAmount={false} />
      </div>

      <div className="shrink-0 bg-bg/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur">
        {addSaveError && (
          <p className="mb-2 text-center text-[12px] font-medium text-primary">{addSaveError}</p>
        )}
        <button
          type="button"
          onClick={commitAdd}
          disabled={!canSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-[14px] font-semibold text-onprimary shadow-[0_14px_32px_rgba(217,113,78,0.3)] ring-1 ring-primary/20 transition active:translate-y-px disabled:opacity-50 disabled:shadow-none"
        >
          {addSubmitting ? (
            <LoaderCircle size={17} strokeWidth={2.4} className="animate-spin" />
          ) : (
            <Plus size={17} strokeWidth={2.6} />
          )}
          {addSubmitting ? "Saving…" : title}
        </button>
      </div>
    </div>
  );
}
