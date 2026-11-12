"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";

/** Former Overview controls remain available in Personal Trends. Mount on
 * disclosure so a quick report does not pay for a second analytical workspace. */
export function DetailedSpendingAnalysis() {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  return (
    <details className="mt-4 min-w-0" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="min-h-11 cursor-pointer rounded-[10px] border border-edge bg-card px-4 py-3 text-body font-semibold">
        {t("detailedAnalysis")}
      </summary>
      {open && (
        <div className="mt-3">
          <OverviewSpendingInsights />
        </div>
      )}
    </details>
  );
}
