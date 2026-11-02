"use client";

import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { useFormatters } from "@/i18n/useFormatters";

/** Ledger budget configuration belongs beside budget tracking on both layouts. */
export function PersonalBudgetSettingsCard({ onEdit }: { onEdit: () => void }) {
  const user = useStore((s) => s.user);
  const t = useTranslations("settingsPage");
  const fmt = useFormatters();
  return (
    <section className="space-y-3 rounded-[14px] border border-edge bg-card p-4">
      <button
        type="button"
        onClick={() => onEdit()}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-[13px] font-semibold"
      >
        <span>{t("monthlyBudget")}</span>
        <span className="text-muted">{fmt.money(user.budgetPoolCents)}</span>
      </button>
      <div className="flex justify-between gap-3 text-[13px]">
        <span>{t("currency")}</span>
        <span className="text-muted">CAD $</span>
      </div>
      <div className="flex justify-between gap-3 text-[13px]">
        <span>{t("budgetCycle")}</span>
        <span className="text-muted">{t(`cycle.${user.budgetCycle}`)}</span>
      </div>
    </section>
  );
}
