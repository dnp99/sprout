"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { useFormatters } from "@/i18n/useFormatters";
import { EditBudgetForm } from "@/components/shared/EditBudgetForm";
import { Modal } from "@/components/ui/overlays";
import { ConnectedApps } from "./ConnectedApps";
import { RulesPanel } from "./RulesPanel";
import { BusinessesPanel } from "./BusinessesPanel";
import { EditedHighlightSetting } from "./EditedHighlightSetting";
import { GettingStartedPanel } from "./GettingStartedPanel";
import { PwaInstallCard } from "./PwaInstallCard";
import { WhatsNewCard } from "./WhatsNew";

/** Personal ledger controls stay separate from the global account dialog. */
export function PersonalSettings({ mobile = false }: { mobile?: boolean }) {
  const user = useStore((s) => s.user);
  const set = useStore((s) => s.set);
  const goMobile = useStore((s) => s.goMobile);
  const t = useTranslations("settingsPage");
  const fmt = useFormatters();
  const [budget, setBudget] = useState(false);
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-[14px] border border-edge bg-card p-4">
        <button
          type="button"
          onClick={() => setBudget(true)}
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
        <button
          type="button"
          onClick={() => (mobile ? goMobile("import") : set({ webView: "import" }))}
          className="min-h-11 rounded-[10px] border border-edge px-3 text-[12.5px] font-semibold"
        >
          {t("importExport")}
        </button>
      </section>
      <EditedHighlightSetting />
      <GettingStartedPanel mobile={mobile} />
      <ConnectedApps />
      <RulesPanel />
      <BusinessesPanel compact={mobile} />
      <PwaInstallCard />
      <WhatsNewCard />
      {budget && (
        <Modal title={t("monthlyBudget")} onClose={() => setBudget(false)}>
          <EditBudgetForm onClose={() => setBudget(false)} />
        </Modal>
      )}
    </div>
  );
}
