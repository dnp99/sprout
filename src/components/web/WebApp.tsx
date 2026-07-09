"use client";

import { Calendar } from "lucide-react";
import type { WebView } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { TrendPeriodToggle } from "@/components/shared/TrendPeriodToggle";
import { AddModal } from "./AddModal";
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
  categories: "Categories & budgets",
  trends: "Trends & reports",
  goals: "Savings goals",
  bills: "Bills & recurring",
  import: "Import & export",
  settings: "Account settings",
};

/** Desktop web companion: sidebar + main content, with an add-transaction modal. */
export function WebApp() {
  const { webView, webAddOpen, webEditTxnId, trendPeriod, set } = useStore(
    useShallow((s) => ({
      webView: s.webView,
      webAddOpen: s.webAddOpen,
      webEditTxnId: s.webEditTxnId,
      trendPeriod: s.trendPeriod,
      set: s.set,
    })),
  );
  const View = VIEWS[webView];

  // Transactions + Categories are month-scoped: the header shows a month stepper.
  // Trends shows a reporting-period toggle; other views show the current month.
  const monthScoped = webView === "transactions" || webView === "categories";
  const periodLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const title = webView === "overview" ? `Overview for ${periodLabel}` : TITLES[webView];

  return (
    <div className="relative flex h-screen bg-bg text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto px-[30px] py-[26px]">
        <header className="flex items-start justify-between">
          <div className="text-[26px] font-bold tracking-[-0.025em]">{title}</div>
          {monthScoped ? (
            <MonthStepper />
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
        </header>
        <View />
      </div>
      {webAddOpen && <AddModal />}
      {webEditTxnId && <EditTransactionModal />}
    </div>
  );
}
