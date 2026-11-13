"use client";
import type { ReactNode } from "react";
import type { CalendarCardLayout } from "@/components/shared/EverydayCalendar";
import { OverviewCardLayout } from "./OverviewCardLayout";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { SkeletonRows } from "@/components/ui/Skeleton";

export interface DashboardMetric {
  label: string;
  cents: number | null;
  tone?: "positive" | "negative";
}
/** Presentation only: each adapter supplies authorized, already-calculated cents. */
export function OverviewDashboard({
  period,
  metrics,
  loading,
  calendar,
  budget,
  merchants,
  insights,
  actions,
}: {
  period: string;
  metrics: DashboardMetric[];
  loading: boolean;
  calendar: (layout: CalendarCardLayout) => ReactNode;
  budget: ReactNode;
  merchants: ReactNode;
  insights: ReactNode;
  actions?: ReactNode;
}) {
  const t = useTranslations("dashboard"),
    fmt = useFormatters();
  return (
    <div data-overview-dashboard className="overview-dashboard">
      <p className="text-meta text-muted">{t("snapshot", { period })}</p>
      <div className="dashboard-metrics">
        {metrics.map((metric) => (
          <section
            key={metric.label}
            className="dashboard-card dashboard-metric"
            aria-label={metric.label}
          >
            <h2 className="text-label font-medium text-muted">{metric.label}</h2>
            {loading ? (
              <SkeletonRows rows={1} className="mt-3" />
            ) : (
              <p
                className={`dashboard-metric-value ${metric.tone === "positive" ? "text-green" : metric.tone === "negative" ? "text-danger" : "text-ink"}`}
              >
                {metric.cents === null ? t("notSet") : fmt.money(metric.cents)}
              </p>
            )}
          </section>
        ))}
      </div>
      {calendar(({ calendar: dates, recent }) => (
        <OverviewCardLayout
          calendar={dates}
          recent={recent}
          budget={budget}
          merchants={merchants}
          insights={insights}
        />
      ))}
      {actions && <div className="dashboard-actions">{actions}</div>}
    </div>
  );
}
