"use client";

import { GoalCard } from "@/components/ui/GoalCard";
import { useStore } from "@/state/store";

export function Goals() {
  const { goals } = useStore();

  return (
    <div className="px-[22px] pt-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold text-ink">Goals 🎯</h1>
        <button
          type="button"
          className="rounded-2xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white"
        >
          + New
        </button>
      </div>

      <div className="mt-[18px] flex flex-col gap-3.5">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
