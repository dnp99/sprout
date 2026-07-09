"use client";

import { AddForm } from "@/components/shared/AddForm";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Mobile "Add transaction" sheet. Restyled to the shadcn-hybrid look; all
 *  entry logic (mode, amount keypad, merchant, category, recurring, save) lives
 *  in the shared AddForm and the Zustand store. */
export function Add() {
  const {
    categories,
    addMode,
    addMerchant,
    addCategoryId,
    addAmountCents,
    commitAdd,
    resetAdd,
    goMobile,
  } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      addMode: s.addMode,
      addMerchant: s.addMerchant,
      addCategoryId: s.addCategoryId,
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
  const selectedCategory = categories.find((cat) => cat.id === addCategoryId);
  const merchantLabel = addMerchant.trim() || "Merchant";
  const categoryLabel =
    addMode === "income" ? "Income" : (selectedCategory?.name ?? "Choose category");
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
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <span className="shrink-0 rounded-full bg-track px-3 py-1.5 text-[12px] font-semibold text-ink">
              {merchantLabel}
            </span>
            {addMode === "expense" && (
              <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1.5 text-[12px] font-semibold text-primary-dark">
                {categoryLabel}
              </span>
            )}
            <span className="shrink-0 rounded-full border border-edge px-3 py-1.5 text-[12px] font-semibold text-muted">
              {addMode === "income" ? "Income" : "Expense"}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 no-scrollbar">
        <AddForm showKeypad showAmount={false} />
      </div>

      <div className="shrink-0 border-t border-edge/60 bg-bg/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={commitAdd}
          disabled={!canSubmit}
          className="w-full rounded-[14px] bg-primary py-3.5 text-center text-[14px] font-semibold text-onprimary transition disabled:opacity-50"
        >
          {title}
        </button>
      </div>
    </div>
  );
}
