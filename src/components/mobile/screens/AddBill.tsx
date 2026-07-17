"use client";

import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";

export function AddBill() {
  const t = useTranslations("mobile");
  const goMobile = useStore((s) => s.goMobile);
  const back = () => goMobile("bills");

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title={t("newRecurring")} onBack={back} />
      <div className="mt-5">
        <EditRecurringForm onDone={back} />
      </div>
    </div>
  );
}
