"use client";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

/** Both mobile ledgers keep totals balanced without repeating the month selector. */
export function MobileTransactionTotals({
  spentCents,
  incomeCents,
}: {
  spentCents: number;
  incomeCents: number;
}) {
  const t = useTranslations("txns");
  const fmt = useFormatters();
  return (
    <dl className="mobile-transaction-totals grid grid-cols-2 text-muted">
      <div className="min-w-0">
        <dt className="flex items-center gap-1.5 text-meta">
          <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
          {t("spentLabel")}
        </dt>
        <dd className="text-body font-semibold tabular-nums text-ink">{fmt.money(spentCents)}</dd>
      </div>
      <div className="min-w-0">
        <dt className="flex items-center gap-1.5 text-meta">
          <ArrowDownLeft size={14} strokeWidth={2} aria-hidden="true" />
          {t("chipIncome")}
        </dt>
        <dd className="text-body font-semibold tabular-nums text-green">
          {fmt.money(incomeCents)}
        </dd>
      </div>
    </dl>
  );
}

export function MobileTransactionCount({ count, total }: { count: number; total: number }) {
  const t = useTranslations("txns");
  return (
    <span>{count === total ? t("summaryCount", { count }) : t("matchingCount", { count })}</span>
  );
}
