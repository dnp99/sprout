"use client";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DashboardCard } from "./DashboardCard";

/** The adapter owns available-to-spend definitions; this only displays progress. */
export function BudgetOverview({
  title,
  label,
  value,
  spent,
  budget,
  configured,
  loading = false,
  action,
  children,
}: {
  title: string;
  label: string;
  value: string;
  spent: number;
  budget: number;
  configured: boolean;
  loading?: boolean;
  action: ReactNode;
  children?: ReactNode;
}) {
  const t = useTranslations("dashboard"),
    fmt = useFormatters();
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  return (
    <DashboardCard title={title} action={action}>
      <p className="text-label text-muted">{label}</p>
      <p
        className={`dashboard-budget-value ${configured && spent > budget ? "text-danger" : "text-ink"}`}
      >
        {loading ? "—" : configured ? value : t("notSet")}
      </p>
      {configured && !loading ? (
        <>
          <ProgressBar
            percent={percent}
            color={spent > budget ? "var(--danger)" : "var(--pos)"}
            height={8}
          />
          <p className="mt-2 text-meta text-muted">
            {t("budgetProgress", { spent: fmt.money(spent), budget: fmt.money(budget) })}
          </p>
        </>
      ) : (
        !loading && <p className="text-body text-muted">{t("budgetNotSet")}</p>
      )}
      {!loading && children}
    </DashboardCard>
  );
}
