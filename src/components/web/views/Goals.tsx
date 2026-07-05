"use client";

import { GoalCard } from "@/components/ui/GoalCard";
import { useStore } from "@/state/store";

export function Goals() {
  const { goals, set } = useStore();

  return (
    <div className="grid grid-cols-2 gap-4">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      <button
        type="button"
        onClick={() => set({ webAddOpen: true })}
        className="flex min-h-[120px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-edge text-primary-dark"
      >
        <div className="text-3xl">+</div>
        <div className="mt-1.5 text-sm font-extrabold">New goal</div>
      </button>
    </div>
  );
}
