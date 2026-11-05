"use client";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { CashFlowChartType } from "@/components/shared/CashFlowChart";

/** Both chart surfaces use translated labels and identical selection targets. */
export function CashFlowChartTypeToggle({
  value,
  onChange,
}: {
  value: CashFlowChartType;
  onChange: (value: CashFlowChartType) => void;
}) {
  const t = useTranslations("trends");
  return (
    <SegmentedControl
      shape="rounded"
      size="compact"
      label={`${t("bar")} / ${t("line")}`}
      value={value}
      onChange={onChange}
      options={(["bar", "line"] as const).map((mode) => ({ value: mode, label: t(mode) }))}
    />
  );
}
