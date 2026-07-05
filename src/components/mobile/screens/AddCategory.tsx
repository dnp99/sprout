"use client";

import { CancelSaveHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";

const ICONS = ["🌟", "🎉", "📱", "🏃", "🐶", "☕"];

export function AddCategory() {
  const { goMobile } = useStore();
  const back = () => goMobile("categories");

  return (
    <div className="px-[22px] pt-3">
      <CancelSaveHeader title="New category ✨" onCancel={back} onSave={back} />

      <div className="mt-6 flex flex-col items-center gap-3.5">
        <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[26px] bg-peach-soft text-[38px]">
          🌟
        </span>
        <input
          placeholder="Name it something fun"
          className="w-full bg-transparent text-center text-xl font-extrabold text-ink outline-none placeholder:text-subtle"
        />
      </div>

      <div className="mt-6 text-xs font-extrabold uppercase text-muted">Pick an icon</div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {ICONS.map((icon, i) => (
          <span
            key={icon}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-[22px]"
            style={i === 0 ? { boxShadow: "0 0 0 2px #d97a54" } : undefined}
          >
            {icon}
          </span>
        ))}
      </div>

      <div className="mt-5 text-xs font-extrabold uppercase text-muted">Monthly budget</div>
      <div className="mt-3 flex items-center justify-between rounded-[18px] bg-card px-4 py-4">
        <span className="text-2xl font-extrabold tabular-nums text-subtle">$0</span>
        <span className="text-xs font-semibold text-muted">per month</span>
      </div>

      <button
        type="button"
        onClick={back}
        className="mt-6 w-full rounded-[20px] bg-primary py-4 text-center text-[15px] font-extrabold text-white"
      >
        Create category 🌱
      </button>
    </div>
  );
}
