"use client";

import { SelectionControl } from "@/components/ui/SelectionControl";
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
    <SelectionControl
      value={value}
      onChange={onChange}
      label={t("viewAria")}
      options={modes.map((mode) => ({
        value: mode.value,
        label: (
          <>
            <mode.icon size={compact ? 12 : 13} strokeWidth={2} />
            {compact && mode.value === "calendar" ? t("cal") : mode.label}
          </>
        ),
      }))}
      className="flex rounded-[10px] bg-track p-1"
      buttonClassName={(active) =>
        `flex items-center gap-1 rounded-[7px] font-semibold transition-colors ${compact ? "px-2 py-1.5 text-[10px]" : "px-2.5 py-1.5 text-[11px]"} ${active ? "bg-primary text-onprimary shadow-sm" : "text-muted"}`
      }
    />
  );
}
