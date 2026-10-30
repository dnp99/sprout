"use client";
import { createContext, useContext } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import type { AppActions, AppState } from "@/state/types";

export type LedgerFeatures = Pick<
  AppState,
  "goals" | "recurring" | "transactions" | "categories" | "transactionsLoading" | "viewMonthKey"
> &
  Pick<
    AppActions,
    | "saveGoal"
    | "removeGoal"
    | "sweepRoundups"
    | "saveRecurring"
    | "removeRecurring"
    | "toggleRecurring"
    | "markRecurringPaid"
  >;
export const LedgerFeatureContext = createContext<LedgerFeatures | null>(null);
/** Shared screens take their scope from the enclosing ledger. Personal state is
 * only a fallback; group forms never invoke personal mutations. */
export function useLedgerFeatures(): LedgerFeatures {
  const scoped = useContext(LedgerFeatureContext);
  const personal = useStore(
    useShallow((s) => ({
      goals: s.goals,
      recurring: s.recurring,
      transactions: s.transactions,
      categories: s.categories,
      transactionsLoading: s.transactionsLoading,
      viewMonthKey: s.viewMonthKey,
      saveGoal: s.saveGoal,
      removeGoal: s.removeGoal,
      sweepRoundups: s.sweepRoundups,
      saveRecurring: s.saveRecurring,
      removeRecurring: s.removeRecurring,
      toggleRecurring: s.toggleRecurring,
      markRecurringPaid: s.markRecurringPaid,
    })),
  );
  return scoped ?? personal;
}
