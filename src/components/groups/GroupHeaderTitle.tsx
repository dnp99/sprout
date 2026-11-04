"use client";
import { DesktopLedgerIcon } from "@/components/shared/DesktopLedgerIcon";
import { useTranslations } from "next-intl";

/** Ledger identity lives in mobile account chrome or the desktop sidebar. */
export function GroupSectionTitle({ section }: { section: string }) {
  const nav = useTranslations("nav");
  const t = useTranslations("groups");
  const titles = useTranslations("titles");
  return (
    <>
      <h1 className="flex items-center gap-2.5 break-words text-[20px] font-bold leading-tight lg:text-[26px]">
        <DesktopLedgerIcon group />
        <span className="lg:hidden">
          {section === "settlements"
            ? t(section)
            : nav(
                section === "bills" ? "billsShort" : section === "budget" ? "budgetGoals" : section,
              )}
        </span>
        <span className="hidden lg:inline">
          {section === "settlements"
            ? t(section)
            : section === "settings" || section === "overview"
              ? nav(section)
              : titles(section === "budget" ? "categories" : section)}
        </span>
      </h1>
    </>
  );
}
