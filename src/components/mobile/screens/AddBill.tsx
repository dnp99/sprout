"use client";

import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";

export function AddBill() {
  const goMobile = useStore((s) => s.goMobile);
  const back = () => goMobile("bills");

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title="New recurring" onBack={back} />
      <div className="mt-5">
        <EditRecurringForm onDone={back} />
      </div>
    </div>
  );
}
