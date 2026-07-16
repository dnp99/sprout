"use client";

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
    <div className="flex rounded-[10px] bg-track p-1" aria-label={t("viewAria")}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(mode.value)}
            className={`flex items-center gap-1 rounded-[7px] font-semibold transition ${
              compact ? "px-2 py-1.5 text-[10px]" : "px-2.5 py-1.5 text-[11px]"
            } ${active ? "bg-card text-ink shadow-sm" : "text-muted"}`}
          >
            <Icon size={compact ? 12 : 13} strokeWidth={2} />
            {compact && mode.value === "calendar" ? t("cal") : mode.label}
          </button>
        );
      })}
    </div>
  );
}
