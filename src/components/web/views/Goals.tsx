"use client";

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

      <RoundupSweepCard className="mb-4" />

      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onClick={() => setEditing(goal)} />
        ))}
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex min-h-[120px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-edge text-primary-dark"
        >
          <div className="text-3xl">+</div>
          <div className="mt-1.5 text-sm font-extrabold">New goal</div>
        </button>
      </div>
    </>
  );
}
