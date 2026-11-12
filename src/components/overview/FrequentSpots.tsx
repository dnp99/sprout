"use client";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import type { MerchantSpend } from "@/lib/trends";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

/** Preserve the existing rolling merchant window; presentation never re-aggregates it. */
export function FrequentSpots({
  rows,
  loading,
  onOpen,
}: {
  rows: MerchantSpend[];
  loading: boolean;
  onOpen?: () => void;
}) {
  const t = useTranslations("overview"),
    fmt = useFormatters();
  return (
    <DashboardCard title={t("frequentSpots")} subtitle={t("last30")}>
      {loading ? (
        <SkeletonRows rows={3} />
      ) : !rows.length ? (
        <p className="py-2 text-body text-muted">{t("emptyFrequent")}</p>
      ) : (
        <ul className="divide-y divide-edge">
          {rows.slice(0, 3).map((row) => (
            <li key={row.name}>
              <button
                type="button"
                disabled={!onOpen}
                onClick={onOpen}
                className="dashboard-merchant-row flex min-h-11 w-full items-center gap-2 rounded-[8px] py-2 text-left disabled:cursor-default"
                title={row.name}
              >
                <EntitySymbol emoji={row.emoji} size={16} />
                <span className="min-w-0 flex-1 truncate text-body font-medium">{row.name}</span>
                <span className="shrink-0 text-right">
                  <span className="block text-body font-semibold tabular-nums">
                    {fmt.money(row.cents)}
                  </span>
                  <span className="block text-meta text-muted">
                    {t("visits", { count: row.count })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
