"use client";
import { useStore } from "@/state/store";
import { localCalendarDate } from "@/lib/calendar";
import { ReportDateControl } from "@/components/shared/ReportDateControl";

/** Like Group, Personal remembers one month across its ledger views. Explicit
 * transaction filters and independent Trends periods retain their own owners. */
export function PersonalOverviewPeriod({ disabled = false }: { disabled?: boolean }) {
  const selected = useStore((s) => s.viewMonthKey);
  const set = useStore((s) => s.set);
  const month = selected || localCalendarDate().slice(0, 7);
  const choose = (viewMonthKey: string) => set({ viewMonthKey });
  return (
    <ReportDateControl
      month={month}
      yearly={false}
      directMonthPick
      disabled={disabled}
      onMonthChange={choose}
      onSelect={choose}
    />
  );
}
