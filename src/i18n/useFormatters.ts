"use client";

import { useTranslations } from "next-intl";
import {
  formatMoney,
  formatMonthKey,
  formatMonthYear,
  formatShortDate,
  formatShortMonthYear,
  relativeShortDate,
} from "@/lib/format";
import { useStore } from "@/state/store";

/** Locale-injected formatters for client components (plan 013 §B). Wraps the
 *  pure helpers in `lib/format` with the store's request-resolved locale (and
 *  the translated Today/Yesterday words), so call sites don't thread locale by
 *  hand. Server Components pass their request locale to the pure helpers
 *  directly instead. */
export function useFormatters() {
  const locale = useStore((s) => s.locale);
  const t = useTranslations("dates");
  const words = { today: t("today"), yesterday: t("yesterday") };

  return {
    locale,
    money: (cents: number, opts?: { signed?: boolean; forceCents?: boolean }) =>
      formatMoney(cents, { ...opts, locale }),
    /** "Today" | "Yesterday" | "Jun 12" — transaction rows. */
    txnDate: (occurredAtIso: string) => relativeShortDate(new Date(occurredAtIso), words, locale),
    shortDate: (date: Date) => formatShortDate(date, locale),
    monthYear: (date: Date) => formatMonthYear(date, locale),
    /** "2026-07" → "July 2026". */
    monthKey: (key: string) => formatMonthKey(key, locale),
    shortMonthYear: (date: Date) => formatShortMonthYear(date, locale),
  };
}
