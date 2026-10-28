"use client";

import { useCaptureLearning } from "./useCaptureLearning";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import type { ActivationItem } from "./ActivationChecklist";

/** Home and Settings share live completion rules and the same setup actions. */
export function useActivationItems(mobile = false): ActivationItem[] {
  const budget = useStore((s) => s.summary.budgetCents);
  const transactionCount = useStore((s) => s.transactions.length);
  const recurringCount = useStore((s) => s.recurring.length);
  const goalCount = useStore((s) => s.goals.length);
  const set = useStore((s) => s.set);
  const goMobile = useStore((s) => s.goMobile);
  const resetAdd = useStore((s) => s.resetAdd);
  const t = useTranslations("checklist");
  const learning = useCaptureLearning();
  return [
    {
      key: "budget",
      label: t("itemBudget"),
      done: budget > 0,
      required: true,
      onClick: () => (mobile ? goMobile("budget") : set({ webEditBudgetOpen: true })),
    },
    {
      key: "txn",
      label: t("itemTxn"),
      done: transactionCount > 0,
      required: true,
      onClick: () => {
        resetAdd();
        if (mobile) goMobile("add");
        else set({ webAddOpen: true });
      },
    },
    {
      key: "recurring",
      label: t("itemRecurring"),
      done: recurringCount > 0,
      onClick: () => (mobile ? goMobile("bills") : set({ webView: "bills" })),
    },
    {
      key: "capture",
      label: t("voiceText"),
      done: learning.learned("capture"),
      required: true,
      onClick: () => {
        if (mobile) goMobile("connectedApps");
        else {
          set({ webView: "settings" });
          window.location.hash = "connected-apps";
        }
      },
      onComplete: () => learning.complete("capture"),
    },
    {
      key: "import",
      label: t("importStatement"),
      done: learning.learned("import"),
      required: true,
      onClick: () => (mobile ? goMobile("import") : set({ webView: "import" })),
      onComplete: () => learning.complete("import"),
    },
    {
      key: "goal",
      label: t("itemGoal"),
      done: goalCount > 0,
      onClick: () => (mobile ? goMobile("goals") : set({ webView: "goals" })),
    },
  ];
}
