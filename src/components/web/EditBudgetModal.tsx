"use client";

import { EditBudgetForm } from "@/components/shared/EditBudgetForm";
import { Modal } from "@/components/ui/overlays";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";
import { resolveViewMonth } from "@/lib/trends";
import { useFormatters } from "@/i18n/useFormatters";

/** App-level "Edit budget" modal, controlled by the global `webEditBudgetOpen`
 *  flag so any view can open it — the Budget tab, the Home activation checklist,
 *  and the empty safe-to-spend tile all just flip the flag. */
export function EditBudgetModal() {
  const t = useTranslations("addFlow");
  const set = useStore((s) => s.set);
  const { viewMonthKey, transactions } = useStore((s) => ({
    viewMonthKey: s.viewMonthKey,
    transactions: s.transactions,
  }));
  const fmt = useFormatters();
  const close = () => set({ webEditBudgetOpen: false });
  return (
    <Modal
      title={t("editBudget")}
      subtitle={fmt.monthKey(resolveViewMonth(viewMonthKey, transactions))}
      onClose={close}
      width={620}
    >
      <div className="mt-4">
        <EditBudgetForm onClose={close} />
      </div>
    </Modal>
  );
}
