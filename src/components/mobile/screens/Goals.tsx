"use client";

import { useState } from "react";
import { EditGoalForm } from "@/components/shared/EditGoalForm";
import { RoundupSweepCard } from "@/components/shared/RoundupSweepCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalCard } from "@/components/ui/GoalCard";
import { ScreenHeader } from "@/components/ui/headers";
import type { Goal } from "@/lib/types";
import { useStore } from "@/state/store";

export function Goals() {
  const goals = useStore((s) => s.goals);
  const [editing, setEditing] = useState<Goal | "new" | null>(null);

  if (editing) {
    return (
      <div className="px-[22px] pt-3">
        <ScreenHeader
          title={editing === "new" ? "New goal" : "Edit goal"}
          onBack={() => setEditing(null)}
        />
        <div className="mt-5">
          <EditGoalForm
            goal={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[22px] pt-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-ink">Goals 🎯</h1>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-2xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white"
        >
          + New
        </button>
      </div>

      <RoundupSweepCard className="mt-[18px]" />

      {goals.length === 0 ? (
        <EmptyState
          className="mt-6"
          emoji="🎯"
          title="No goals yet"
          subtitle="Set a savings goal — a trip, an emergency fund, a new laptop — and track your progress here."
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="rounded-2xl bg-primary px-5 py-2.5 text-[13px] font-extrabold text-white"
            >
              + New goal
            </button>
          }
        />
      ) : (
        <div className="mt-[18px] flex flex-col gap-3.5">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={() => setEditing(goal)} />
          ))}
        </div>
      )}
    </div>
  );
}
