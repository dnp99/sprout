"use client";

import { SegmentedControl, Toggle } from "@/components/ui/controls";
import { CancelSaveHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";
import { useState } from "react";
import type { Frequency } from "@/lib/types";

export function AddBill() {
  const { goMobile } = useStore();
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [remind, setRemind] = useState(true);
  const back = () => goMobile("bills");

  return (
    <div className="px-[22px] pt-3">
      <CancelSaveHeader title="New bill 🧾" onCancel={back} onSave={back} />

      <div className="mt-6 text-center">
        <div className="text-[50px] font-extrabold tracking-tight tabular-nums text-primary">
          $0.00
        </div>
        <div className="mt-0.5 text-xs font-semibold text-muted">Amount due</div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <FieldRow label="Name">
          <input
            placeholder="e.g. Netflix"
            className="bg-transparent text-right text-[13.5px] font-extrabold text-ink outline-none placeholder:text-subtle"
          />
        </FieldRow>
        <FieldRow label="Category">
          <span className="text-[13.5px] font-extrabold text-ink">🏠 Bills ›</span>
        </FieldRow>
        <FieldRow label="Next due">
          <span className="text-[13.5px] font-extrabold text-ink">Jul 7 ›</span>
        </FieldRow>
        <FieldRow label="Remind me 🔔">
          <Toggle on={remind} activeColor="#d97a54" onClick={() => setRemind((r) => !r)} />
        </FieldRow>
      </div>

      <div className="mt-5 text-xs font-extrabold uppercase text-muted">Repeats</div>
      <div className="mt-3">
        <SegmentedControl
          options={[
            { value: "Weekly", label: "Weekly" },
            { value: "Monthly", label: "Monthly" },
            { value: "Yearly", label: "Yearly" },
          ]}
          value={frequency}
          onChange={setFrequency}
        />
      </div>

      <button
        type="button"
        onClick={back}
        className="mt-6 w-full rounded-[20px] bg-primary py-4 text-center text-[15px] font-extrabold text-white"
      >
        Add bill 🧾
      </button>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5">
      <span className="text-[13.5px] font-bold text-muted">{label}</span>
      {children}
    </div>
  );
}
