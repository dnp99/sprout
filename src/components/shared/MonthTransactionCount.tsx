"use client";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
/** Month context stays explicit even when search results span other dates. */
export function MonthTransactionCount({ month, count }: { month: string; count: number }) {
  const t = useTranslations("txns"),
    fmt = useFormatters();
  return <span>{t("monthCount", { month: fmt.monthKey(month), count })}</span>;
}
