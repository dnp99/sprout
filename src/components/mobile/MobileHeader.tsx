"use client";

import { TransactionTools } from "@/components/shared/TransactionTools";
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

/** Period and utility controls live below the shared page/account identity. */
export function MobileHeader({ screen }: { screen: MobileScreen }) {
  const { trendPeriod, trendView, set } = useStore(
    useShallow((s) => ({
      trendPeriod: s.trendPeriod,
      trendView: s.trendView,
      set: s.set,
    })),
  );

  if (!PRIMARY_SCREENS.has(screen)) return null;

  if (screen === "home") return null;

  // The Transactions title and space badge live beside the account avatar.
  // Keep the period and existing tools on their own bounded control row.
  if (screen === "history")
    return (
      <header className="mobile-transaction-header px-4">
        <MonthStepper compact />
        <TransactionTools mobile />
      </header>
    );

  // Transactions, Budget, and both Trends views put their scoped time control
  // in the same header position, keeping the view switch from shifting content.
  const action =
    screen === "categories" ? (
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
    <header className="mobile-transaction-header px-4 pb-3.5">
      <div className={`flex min-w-0 items-center gap-2 ${screen === "trends" ? "flex-1" : ""}`}>
        {action}
      </div>
    </header>
  );
}
