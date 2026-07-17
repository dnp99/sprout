"use client";

import { EditBudgetForm } from "@/components/shared/EditBudgetForm";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";

/** Mobile "Edit budget" sheet — the monthly total + per-category allocation +
 *  add/remove, all in one place (shared EditBudgetForm). Reached from the Budget
 *  tab's "Edit budget" button and the Home "Set your budget" prompts. Edits
 *  persist live, so closing just returns to the Budget tab. */
export function BudgetSetup() {
  const t = useTranslations("mobile");
  const goMobile = useStore((s) => s.goMobile);
  const back = () => goMobile("categories");

  return (
    <div className="px-[22px] pt-3">
      <ScreenHeader title={t("editBudget")} onBack={back} />
      <div className="mt-4">
        <EditBudgetForm onClose={back} />
      </div>
    </div>
  );
}
