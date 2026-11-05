"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CalendarDays, List } from "lucide-react";
import { useTranslations } from "next-intl";

export type RecurringViewMode = "list" | "calendar";

/** Shared List / Calendar control so Bills has the same mode vocabulary on
 *  both surfaces while each renderer remains responsive to its layout. */
export function RecurringViewModeToggle({
  value,
  onChange,
  compact = false,
}: {
  value: RecurringViewMode;
  onChange: (mode: RecurringViewMode) => void;
  compact?: boolean;
}) {
  const t = useTranslations("bills.calendar");
  const modes: { value: RecurringViewMode; label: string; icon: typeof List }[] = [
    { value: "list", label: t("list"), icon: List },
    { value: "calendar", label: t("calendarLabel"), icon: CalendarDays },
  ];
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      label={t("viewAria")}
      options={modes.map((mode) => ({
        value: mode.value,
        icon: <mode.icon size={14} strokeWidth={2} />,
        label: compact && mode.value === "calendar" ? t("cal") : mode.label,
      }))}
      shape="rounded"
      size={compact ? "compact" : "regular"}
    />
  );
}
