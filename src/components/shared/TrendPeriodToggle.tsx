"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTranslations } from "next-intl";
import type { TrendPeriod } from "@/lib/reports";

// Labels live in the trends catalog namespace; `web` / `mobile` are key names.
const PERIODS: { value: TrendPeriod; web: string; mobile: string }[] = [
  { value: "month", web: "periodMonth", mobile: "periodMonthShort" },
  { value: "6m", web: "period6m", mobile: "period6mShort" },
  { value: "12m", web: "period12m", mobile: "period12mShort" },
  { value: "ytd", web: "periodYtd", mobile: "periodYtdShort" },
];

/** Segmented control for the Trends reporting period. `compact` renders the
 *  short mobile labels + tighter padding; otherwise the full desktop labels.
 *  Shared by the web view and the mobile screen. */
export function TrendPeriodToggle({
  period,
  onChange,
  compact = false,
}: {
  period: TrendPeriod;
  onChange: (period: TrendPeriod) => void;
  compact?: boolean;
}) {
  const t = useTranslations("trends");
  const overview = useTranslations("overview");
  return (
    <SegmentedControl
      label={overview("reportPeriod")}
      value={period}
      onChange={onChange}
      options={PERIODS.map((p) => ({ value: p.value, label: t(compact ? p.mobile : p.web) }))}
      shape="rounded"
      size="compact"
      className={compact ? "w-full" : ""}
    />
  );
}
