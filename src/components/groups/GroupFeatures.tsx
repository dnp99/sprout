"use client";
import { useState } from "react";
import { Goals } from "@/components/web/views/Goals";
import { Bills } from "@/components/web/views/Bills";
import { LedgerFeatureContext, type LedgerFeatures } from "@/components/shared/LedgerFeatures";
import { useTranslations } from "next-intl";
import { groupFeatureTransactions } from "@/lib/groups/feature-dto";
import { availableRoundupsCents } from "@/lib/roundups";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";

/** Reuse the actual personal screens with an explicit household data adapter. */
export function GroupFeatures({
  data,
  month,
  tab,
  run,
}: {
  data: GroupSnapshot;
  month: string;
  tab: "goals" | "bills";
  run: (op: GroupOperation) => Promise<unknown>;
}) {
  const t = useTranslations("groups"),
    [error, setError] = useState("");
  const transactions = groupFeatureTransactions(data);
  const write = async (op: GroupOperation) => {
    if (data.group.archivedAt) throw new Error(t("archivedNotice"));
    const result = await run(op);
    if (!result) throw new Error(t("failed"));
  };
  const value: LedgerFeatures = {
    goals: data.goals ?? [],
    recurring: data.recurring ?? [],
    transactions,
    categories: data.categories
      .filter((c) => !c.archived)
      .map((c) => ({ ...c, monthlyBudgetCents: 0, spentCents: 0 })),
    transactionsLoading: false,
    viewMonthKey: month,
    saveGoal: async (value, id) => write({ type: "goal", value, id }),
    removeGoal: async (id) => write({ type: "goalDelete", id }),
    saveRecurring: async (value, id) => write({ type: "recurring", value, id }),
    removeRecurring: async (id) => write({ type: "recurringDelete", id }),
    toggleRecurring: (id) => {
      const item = data.recurring?.find((r) => r.id === id);
      if (item)
        void write({ type: "recurring", id, value: { ...item, paused: !item.paused } }).catch((e) =>
          setError(e instanceof Error ? e.message : t("failed")),
        );
    },
    markRecurringPaid: async (id, dueDate) => write({ type: "recurringPaid", id, dueDate }),
    sweepRoundups: async () => {
      const target = data.goals?.find((g) => g.isRoundupTarget);
      const sweptCents = target ? availableRoundupsCents(transactions) : 0;
      await write({ type: "roundupSweep" });
      return { sweptCents, goalId: target?.id ?? null };
    },
  };
  return (
    <LedgerFeatureContext.Provider value={value}>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <fieldset disabled={!!data.group.archivedAt} className="min-w-0">
        {tab === "goals" ? <Goals /> : <Bills />}
      </fieldset>
    </LedgerFeatureContext.Provider>
  );
}
