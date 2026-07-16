"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import type { RecurringSchedule } from "@/lib/bills";
import { currentMonthKey } from "@/lib/trends";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Locale-aware weekday / month names from Intl (2021-08-01 was a Sunday, so
 *  index 0 lines up with `dayOfWeek`'s Sunday-first convention). */
export function weekdayName(index: number, locale: string): string {
  return new Date(Date.UTC(2021, 7, 1 + index)).toLocaleDateString(locale, {
    weekday: "long",
    timeZone: "UTC",
  });
}

export function monthName(index: number, locale: string): string {
  return new Date(Date.UTC(2021, index, 1)).toLocaleDateString(locale, {
    month: "long",
    timeZone: "UTC",
  });
}

/** Translated "Monthly · 7th" / "Weekly · Tuesdays" / "Yearly · Mar 15" — the
 *  client-side, catalog-driven equivalent of `recurringFrequencyLabel` in
 *  `lib/bills` (whose English prose the DTO still carries as `frequencyLabel`). */
export function useRecurringFrequencyLabel(): (schedule: RecurringSchedule) => string {
  const t = useTranslations("bills.freq");
  const fmt = useFormatters();
  return (schedule) => {
    if (schedule.cadence === "weekly") {
      return t("weekly", { weekday: weekdayName((schedule.dayOfWeek ?? 0) % 7, fmt.locale) });
    }
    if (schedule.cadence === "yearly") {
      const month = (schedule.monthOfYear ?? 1) - 1;
      return t("yearly", {
        date: new Date(2021, month, schedule.dayOfMonth ?? 1).toLocaleDateString(fmt.locale, {
          month: "short",
          day: "numeric",
        }),
      });
    }
    return t("monthly", { day: schedule.dayOfMonth ?? 1 });
  };
}

/** Translated "Today" / "Tomorrow" / "in N days" / "N days ago" for a due-date
 *  key in the current month, or a short date ("Sep 15") for any other month —
 *  mirrors `relativeDueLabel` in `lib/recurring/reconcile` from raw row data. */
export function useRelativeDueLabel(monthKey: string): (dueDateKey: string) => string {
  const t = useTranslations("bills.relative");
  const fmt = useFormatters();
  const isCurrentMonth = monthKey === currentMonthKey();
  return (dueDateKey) => {
    const [y, m, d] = dueDateKey.split("-").map(Number);
    if (!y || !m || !d) return "";
    if (!isCurrentMonth)
      return new Date(y, m - 1, d).toLocaleDateString(fmt.locale, {
        month: "short",
        day: "numeric",
      });
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const distance = Math.round((Date.UTC(y, m - 1, d) - today) / DAY_MS);
    if (distance === 0) return t("today");
    if (distance === 1) return t("tomorrow");
    if (distance > 1) return t("inDays", { count: distance });
    if (distance === -1) return t("yesterday");
    return t("daysAgo", { count: Math.abs(distance) });
  };
}
