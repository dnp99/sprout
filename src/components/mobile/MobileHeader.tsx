"use client";

import { Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Avatar } from "@/components/ui/Avatar";
import type { TrendPeriod } from "@/lib/reports";
import { useStore } from "@/state/store";
import type { MobileScreen } from "@/lib/types";

const PRIMARY_SCREENS = new Set<MobileScreen>(["home", "history", "categories", "trends", "bills"]);

/** Whether `MobileHeader` renders chrome for this screen (vs. returning null).
 *  The layout uses it to avoid double top-padding under the header. */
export function hasMobileHeader(screen: MobileScreen): boolean {
  return PRIMARY_SCREENS.has(screen);
}
const TREND_PERIODS: { value: TrendPeriod; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "6m", label: "6 mo" },
  { value: "12m", label: "12 mo" },
  { value: "ytd", label: "YTD" },
];

function shortMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return "Month";
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

/** Sticky top chrome for the mobile surface. Keeps the current section title
 *  visible and puts the primary action where users expect it. */
export function MobileHeader({ screen }: { screen: MobileScreen }) {
  const { user, trendPeriod, trendMonthKey, goMobile, set } = useStore(
    useShallow((s) => ({
      user: s.user,
      trendPeriod: s.trendPeriod,
      trendMonthKey: s.trendMonthKey,
      goMobile: s.goMobile,
      set: s.set,
    })),
  );

  if (!PRIMARY_SCREENS.has(screen)) return null;

  if (screen === "home") {
    const todayLabel = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    return (
      <header className="shrink-0 bg-bg/95 px-4 py-3.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold leading-none tracking-[-.02em] text-ink">
              Hey {user.greetingName}
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

  const title =
    screen === "history"
      ? "Transactions"
      : screen === "categories"
        ? "Budget"
        : screen === "trends"
          ? "Trends"
          : "Bills";

  const action =
    screen === "history" ? (
      <button
        type="button"
        onClick={() => goMobile("add")}
        className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary shadow-[0_10px_24px_rgba(217,113,78,0.22)]"
      >
        <Plus size={13} strokeWidth={2.6} />
        <span className="text-[11.5px] font-semibold">Add</span>
      </button>
    ) : screen === "categories" ? (
      <button
        type="button"
        onClick={() => goMobile("addCat")}
        className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary shadow-[0_10px_24px_rgba(217,113,78,0.22)]"
      >
        <Plus size={13} strokeWidth={2.6} />
        <span className="text-[11.5px] font-semibold">Add</span>
      </button>
    ) : screen === "bills" ? (
      <button
        type="button"
        onClick={() => goMobile("addBill")}
        className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary shadow-[0_10px_24px_rgba(217,113,78,0.22)]"
      >
        <Plus size={13} strokeWidth={2.6} />
        <span className="text-[11.5px] font-semibold">Add</span>
      </button>
    ) : screen === "trends" ? (
      <div className="flex rounded-pill bg-track p-1" aria-label="Trend period">
        {TREND_PERIODS.map((period) => {
          const active = trendPeriod === period.value;
          const label =
            period.value === "month" && active && trendMonthKey
              ? shortMonthLabel(trendMonthKey)
              : period.label;
          return (
            <button
              key={period.value}
              type="button"
              aria-pressed={active}
              onClick={() => set({ trendPeriod: period.value, trendMonthKey: "" })}
              className={`rounded-pill px-2.5 py-1 text-[10.5px] font-semibold transition ${
                active ? "bg-primary text-onprimary" : "text-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
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
