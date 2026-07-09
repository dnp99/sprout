"use client";

import { AddForm } from "@/components/shared/AddForm";
import { formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";
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
  const amountLabel = formatMoney(addAmountCents, {
    forceCents: true,
    signed: addMode === "income",
  });
  // Merchant + a positive amount are required before the transaction can be saved.
  const canSubmit = addMerchant.trim() !== "" && addAmountCents > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <div className="shrink-0 border-b border-edge/60 bg-bg/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              resetAdd();
              goMobile("home");
            }}
            className="text-[14px] font-semibold text-muted transition hover:text-ink"
          >
            Cancel
          </button>
          <span className="text-[15px] font-semibold text-ink">{title}</span>
          <span className="min-w-[44px]" aria-hidden="true" />
        </div>
        <div className="mt-4 rounded-[24px] border border-edge bg-card px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-subtle">
            Amount
          </div>
          <div
            className={`mt-1 text-center text-[52px] leading-none font-bold tracking-tight tabular-nums ${
              addMode === "income" ? "text-green" : "text-primary"
            }`}
          >
            {amountLabel}
          </div>
          <div className="mt-2 text-center text-[11px] font-medium text-muted">
            Tap digits below to edit
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 no-scrollbar">
        <AddForm showKeypad showAmount={false} />
      </div>

      <div className="sticky bottom-0 z-20 border-t border-edge/60 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={commitAdd}
          disabled={!canSubmit}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-primary text-[15px] font-semibold text-onprimary shadow-[0_18px_40px_rgba(217,113,78,0.34)] ring-1 ring-primary/20 transition active:translate-y-px disabled:opacity-50 disabled:shadow-none"
        >
          <Plus size={17} strokeWidth={2.6} />
          {title}
        </button>
      </div>
    </div>
  );
}
