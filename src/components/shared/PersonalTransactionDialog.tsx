"use client";

import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import { transactionRequiredIssues } from "@/lib/transactions/requirements";
import { AddForm } from "./AddForm";
import { TransactionDialog, TransactionEntryForm } from "./TransactionEntryForm";

/** Both Personal entry points use the same dialog; navigation remains in the
 * Personal adapter and never touches Group drafts or persistence. */
export function PersonalTransactionDialog({ mobile = false }: { mobile?: boolean }) {
  const state = useStore(
    useShallow((s) => ({
      merchant: s.addMerchant,
      amountCents: s.addAmountCents,
      categoryId: s.addCategoryId,
      busy: s.addSubmitting,
      error: s.addSaveError,
      returnTo: s.addReturnTo,
      commit: s.commitAdd,
      reset: s.resetAdd,
      set: s.set,
      goMobile: s.goMobile,
    })),
  );
  const disabled = !state.merchant.trim() || transactionRequiredIssues(state).length > 0;
  return (
    <TransactionDialog
      onClose={() => {
        if (state.busy) return;
        state.reset();
        if (mobile) state.goMobile(state.returnTo);
        else state.set({ webAddOpen: false });
      }}
    >
      <TransactionEntryForm
        disabled={disabled}
        busy={state.busy}
        error={state.error}
        onSubmit={state.commit}
      >
        <AddForm />
      </TransactionEntryForm>
    </TransactionDialog>
  );
}
