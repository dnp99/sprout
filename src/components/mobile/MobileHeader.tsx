"use client";

import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { CashFlowMonthStepper } from "@/components/shared/CashFlowMonthStepper";
import { TrendPeriodToggle } from "@/components/shared/TrendPeriodToggle";
import { useStore } from "@/state/store";
import type { MobileScreen } from "@/lib/types";

const PRIMARY_SCREENS = new Set<MobileScreen>(["home", "history", "categories", "trends", "bills"]);

/** Whether `MobileHeader` renders chrome for this screen (vs. returning null).
 *  The layout uses it to avoid double top-padding under the header. */
export function hasMobileHeader(screen: MobileScreen): boolean {
  return PRIMARY_SCREENS.has(screen);
}

/** Sticky top chrome for the mobile surface. Keeps the current section title
 *  visible and puts the primary action where users expect it. */
export function MobileHeader({ screen }: { screen: MobileScreen }) {
  const { trendPeriod, trendView, set } = useStore(
    useShallow((s) => ({
      trendPeriod: s.trendPeriod,
      trendView: s.trendView,
      set: s.set,
    })),
  );
  const t = useTranslations();

  if (!PRIMARY_SCREENS.has(screen)) return null;

  if (screen === "home") return null;

  const title = t(
    screen === "history"
      ? "nav.transactions"
      : screen === "categories"
        ? "nav.budget"
        : screen === "trends"
          ? "nav.trends"
          : "nav.billsShort",
  );

  // Transactions, Budget, and both Trends views put their scoped time control
  // in the same header position, keeping the view switch from shifting content.
  const action =
    screen === "history" || screen === "categories" ? (
      <MonthStepper compact />
    ) : screen === "trends" && trendView === "cashflow" ? (
      <CashFlowMonthStepper compact />
    ) : screen === "trends" ? (
      <div className="w-full">
        <TrendPeriodToggle
          compact
          period={trendPeriod}
          onChange={(period) => set({ trendPeriod: period, trendMonthKey: "" })}
        />
      </div>
    ) : screen === "bills" ? (
      <MonthStepper compact showToday defaultToCurrent />
    ) : null;

  return (
    <header className="shrink-0 bg-bg/95 px-4 pb-3.5 pt-3.5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">{title}</h1>
        <div className="flex w-full flex-wrap items-center justify-start gap-2">{action}</div>
      </div>
    </header>
  );
}
