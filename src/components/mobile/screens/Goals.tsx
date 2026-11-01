"use client";

import { useTranslations } from "next-intl";
import { Goals as LedgerGoals } from "@/components/web/views/Goals";

/** Both ledgers share actions and editors; the personal shell owns its title. */
export function Goals() {
  const t = useTranslations("goals");
  return (
    <div className="px-4">
      <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">{t("title")}</h1>
      <LedgerGoals personalMobile />
    </div>
  );
}
