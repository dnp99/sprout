"use client";

import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { EditGoalForm } from "@/components/shared/EditGoalForm";
import { RoundupSweepCard } from "@/components/shared/RoundupSweepCard";
import { GoalCard } from "@/components/ui/GoalCard";
import { ScreenHeader } from "@/components/ui/headers";
import type { Goal } from "@/lib/types";
import { useStore } from "@/state/store";

export function Goals() {
  const goals = useStore((s) => s.goals);
  const [editing, setEditing] = useState<Goal | "new" | null>(null);

  if (editing) {
    return (
      <div className="px-4 pt-3">
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
    <div className="flex min-h-full flex-col px-4 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">Goals</h1>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary"
        >
          <Plus size={13} strokeWidth={2.6} />
          <span className="text-[11.5px] font-semibold">New</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <Target size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">No goals yet</div>
          <div className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
            Set a savings goal — a trip, an emergency fund — and track it here.
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="mt-4 rounded-[10px] bg-primary px-4 py-2 text-[12px] font-semibold text-onprimary"
          >
            Create a goal
          </button>
        </div>
      ) : (
        <>
          <RoundupSweepCard className="mt-3.5" />
          <div className="mt-3.5 flex flex-col gap-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => setEditing(goal)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
