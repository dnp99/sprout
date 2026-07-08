"use client";

import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { EditGoalForm } from "@/components/shared/EditGoalForm";
import { RoundupSweepCard } from "@/components/shared/RoundupSweepCard";
import { GoalCard } from "@/components/ui/GoalCard";
import { Modal } from "@/components/ui/overlays";
import type { Goal } from "@/lib/types";
import { useStore } from "@/state/store";

export function Goals() {
  const goals = useStore((s) => s.goals);
  // null = closed, "new" = create, Goal = edit that goal.
  const [editing, setEditing] = useState<Goal | "new" | null>(null);

  return (
    <>
      {editing && (
        <Modal
          title={editing === "new" ? "New goal 🎯" : "Edit goal ✍️"}
          onClose={() => setEditing(null)}
        >
          <div className="mt-4">
            <EditGoalForm
              goal={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          </div>
        </Modal>
      )}

      <div className="mt-4">
        {/* The app shell renders the "Goals" page title; the design's "New goal"
            action lives on that same header row, so we anchor it to the right
            here at the top of the body. */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
          >
            <Plus size={14} strokeWidth={2.6} />
            New goal
          </button>
        </div>

        {goals.length === 0 ? (
          <EmptyGoals onCreate={() => setEditing("new")} />
        ) : (
          <>
            <RoundupSweepCard className="mt-4" />
            <div className="mt-4 grid grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onClick={() => setEditing(goal)} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

/** Centered empty state matching the "Goals — empty" design screen. */
function EmptyGoals({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track">
        <Target size={30} strokeWidth={1.7} className="text-muted" />
      </span>
      <div className="mt-[18px] text-[18px] font-bold text-ink">No goals yet</div>
      <div className="mt-[7px] max-w-[380px] text-[13.5px] font-medium leading-[1.55] text-muted">
        Set a savings goal — a trip, an emergency fund — and track your progress here.
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-[10px] bg-primary px-5 py-[11px] text-[13px] font-semibold text-onprimary"
      >
        Create a goal
      </button>
    </div>
  );
}
