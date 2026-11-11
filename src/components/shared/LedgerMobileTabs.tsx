"use client";

import { useTranslations } from "next-intl";
import { NavigationItem } from "@/components/ui/Navigation";
import { MOBILE_LEDGER_TABS } from "./ledger-navigation";

/** The shared five-slot row leaves ledger-specific navigation to its shell. */
export function LedgerMobileTabs({
  active,
  onSelect,
  disabled = false,
}: {
  active: string | null;
  onSelect: (tab: (typeof MOBILE_LEDGER_TABS)[number]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("nav");
  const activeTab =
    active === "goals"
      ? "budget"
      : ["bills", "import", "settlements"].includes(active ?? "")
        ? "transactions"
        : active;
  return MOBILE_LEDGER_TABS.map((tab) => (
    <NavigationItem
      key={tab.id}
      variant="mobile"
      active={activeTab === tab.id}
      label={t(tab.labelKey)}
      icon={<tab.icon size={18} strokeWidth={tab.id === "overview" ? 2.5 : 2} />}
      disabled={disabled}
      onClick={() => onSelect(tab)}
    >
      {tab.id === "budget" ? (
        <>
          <span className="phone-nav-label">{t("budgetsMobile")}</span>
          <span className="tablet-nav-label">{t(tab.labelKey)}</span>
        </>
      ) : undefined}
    </NavigationItem>
  ));
}
