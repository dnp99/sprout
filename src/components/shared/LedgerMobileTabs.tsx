"use client";

import { useTranslations } from "next-intl";
import { MOBILE_LEDGER_TABS, mobileLedgerTabClass } from "./ledger-navigation";

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
    <button
      key={tab.id}
      type="button"
      disabled={disabled}
      aria-label={t(tab.labelKey)}
      aria-current={activeTab === tab.id ? "page" : undefined}
      onClick={() => onSelect(tab)}
      className={`mobile-ledger-tab ${mobileLedgerTabClass} rounded-[10px] transition-colors ${activeTab === tab.id ? "bg-primary-soft" : "bg-transparent"}`}
    >
      <tab.icon
        size={18}
        strokeWidth={tab.id === "overview" ? 2.5 : 2}
        className={activeTab === tab.id ? "text-primary" : "text-muted"}
      />
      <span
        className={`line-clamp-2 min-h-[26px] w-full max-w-full whitespace-normal text-[10px] leading-[13px] text-center min-[360px]:text-[11px] ${activeTab === tab.id ? "font-semibold text-primary" : "font-medium text-muted"}`}
      >
        {t(tab.labelKey)}
      </span>
    </button>
  ));
}
