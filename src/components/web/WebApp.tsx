"use client";

import { Calendar, Plus, SlidersHorizontal } from "lucide-react";
import type { WebView } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { TrendPeriodToggle } from "@/components/shared/TrendPeriodToggle";
import { AddModal } from "./AddModal";
import { EditBudgetModal } from "./EditBudgetModal";
import { EditTransactionModal } from "./EditTransactionModal";
import { Sidebar } from "./Sidebar";
import { Bills } from "./views/Bills";
import { Categories } from "./views/Categories";
import { Goals } from "./views/Goals";
import { Import } from "./views/Import";
import { Overview } from "./views/Overview";
import { Settings } from "./views/Settings";
import { Transactions } from "./views/Transactions";
import { Trends } from "./views/Trends";

const VIEWS: Record<WebView, () => React.ReactNode> = {
  overview: Overview,
  transactions: Transactions,
  categories: Categories,
  trends: Trends,
  goals: Goals,
  bills: Bills,
  import: Import,
  settings: Settings,
};

const TITLES: Record<WebView, string> = {
  overview: "Overview",
  transactions: "Transactions",
  categories: "Budget",
  trends: "Trends & reports",
  goals: "Savings goals",
  bills: "Bills & recurring",
  import: "Import & export",
  settings: "Account settings",
};

/** Desktop web companion: sidebar + main content, with an add-transaction modal. */
export function WebApp() {
  const { webView, webAddOpen, webEditBudgetOpen, webEditTxnId, trendPeriod, set } = useStore(
    useShallow((s) => ({
      webView: s.webView,
      webAddOpen: s.webAddOpen,
      webEditBudgetOpen: s.webEditBudgetOpen,
      webEditTxnId: s.webEditTxnId,
      trendPeriod: s.trendPeriod,
      set: s.set,
    })),
  );
  const View = VIEWS[webView];

  // Transactions, Budget, and Bills are month-scoped: the header shows a month stepper.
  // Trends shows a reporting-period toggle; other views show the current month.
  const monthScoped = webView === "transactions" || webView === "categories" || webView === "bills";
  const periodLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const title = TITLES[webView];

  return (
    <div className="relative flex h-screen bg-bg text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto px-[30px] py-[26px]">
        <header className="flex items-start justify-between">
          <div className="text-[26px] font-bold tracking-[-0.025em]">{title}</div>
          <div className="flex items-center gap-2.5">
            {/* View action sits to the LEFT of the period control so the month
                selector stays rightmost. Quick add from the transactions list
                mirrors the design's header CTA (the sidebar keeps its own Add
                button too); Budget opens the all-in-one Edit budget modal. */}
            {webView === "transactions" && (
              <button
                type="button"
                onClick={() => set({ webAddOpen: true })}
                className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
              >
                <Plus size={14} strokeWidth={2.6} />
                Add transaction
              </button>
            )}
            {webView === "categories" && (
              <button
                type="button"
                onClick={() => set({ webEditBudgetOpen: true })}
                className="flex items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-onprimary"
              >
                <SlidersHorizontal size={14} strokeWidth={2.4} />
                Edit allocations
              </button>
            )}
            {monthScoped ? (
              <MonthStepper
                showToday={webView === "bills"}
                defaultToCurrent={webView === "bills"}
              />
            ) : webView === "trends" ? (
              <TrendPeriodToggle
                period={trendPeriod}
                onChange={(p) => set({ trendPeriod: p, trendMonthKey: "" })}
              />
            ) : (
              <span className="flex items-center gap-[7px] rounded-[9px] border border-edge px-3 py-[7px] text-[12.5px] font-semibold">
                <Calendar size={14} strokeWidth={2} className="text-muted" />
                {periodLabel}
              </span>
            )}
          </div>
        </header>
        <View />
      </div>
      {webAddOpen && <AddModal />}
      {webEditBudgetOpen && <EditBudgetModal />}
      {webEditTxnId && <EditTransactionModal />}
    </div>
  );
}
