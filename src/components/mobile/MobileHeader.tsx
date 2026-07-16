"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { CashFlowMonthStepper } from "@/components/shared/CashFlowMonthStepper";
import { TrendPeriodToggle } from "@/components/shared/TrendPeriodToggle";
import { Avatar } from "@/components/ui/Avatar";
import { formatWeekdayDate } from "@/lib/format";
import { ALL_MONTHS_FILTERS } from "@/lib/search";
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
  const { user, searchType, trendPeriod, trendView, locale, set, goMobile } = useStore(
    useShallow((s) => ({
      user: s.user,
      searchType: s.searchType,
      trendPeriod: s.trendPeriod,
      trendView: s.trendView,
      locale: s.locale,
      set: s.set,
      goMobile: s.goMobile,
    })),
  );
  const t = useTranslations();

  if (!PRIMARY_SCREENS.has(screen)) return null;

  if (screen === "home") {
    const todayLabel = formatWeekdayDate(new Date(), locale);

    return (
      <header className="shrink-0 bg-bg/95 px-4 py-3.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold leading-none tracking-[-.02em] text-ink">
              {t("home.greeting", { name: user.greetingName })}
            </h1>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">{todayLabel}</p>
          </div>
          <button
            type="button"
            aria-label="Account & settings"
            onClick={() => goMobile("settings")}
          >
            <Avatar size={40} initial={user.greetingName.slice(0, 1)} />
          </button>
        </div>
      </header>
    );
  }

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
    screen === "history" ? (
      ALL_MONTHS_FILTERS.has(searchType) ? (
        <div className="flex h-11 items-center rounded-[10px] border border-edge px-3 text-[11px] font-semibold text-muted">
          All months
        </div>
      ) : (
        <MonthStepper compact />
      )
    ) : screen === "categories" ? (
      <MonthStepper compact />
    ) : screen === "trends" && trendView === "cashflow" ? (
      <CashFlowMonthStepper compact />
    ) : screen === "trends" ? (
      <div className="w-[min(66vw,264px)]">
        <TrendPeriodToggle
          compact
          period={trendPeriod}
          onChange={(period) => set({ trendPeriod: period, trendMonthKey: "" })}
        />
      </div>
    ) : screen === "bills" ? (
      <button
        type="button"
        onClick={() => goMobile("addBill")}
        className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary shadow-[0_10px_24px_rgba(217,113,78,0.22)]"
      >
        <Plus size={13} strokeWidth={2.6} />
        <span className="text-[11.5px] font-semibold">Add</span>
      </button>
    ) : null;

  return (
    <header className="shrink-0 bg-bg/95 px-4 py-3.5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">{title}</h1>
        {action}
      </div>
    </header>
  );
}
