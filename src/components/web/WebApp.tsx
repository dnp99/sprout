"use client";

import type { WebView } from "@/lib/types";
import { activeTrendKey, monthKeyLabel, monthlyTrend } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { MonthStepper } from "@/components/shared/MonthStepper";
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
  const { webView, webAddOpen, webEditTxnId, transactions, trendMonthKey } = useStore(
    useShallow((s) => ({
      webView: s.webView,
      webAddOpen: s.webAddOpen,
      webEditTxnId: s.webEditTxnId,
      transactions: s.transactions,
      trendMonthKey: s.trendMonthKey,
    })),
  );
  const View = VIEWS[webView];

  // Transactions + Categories are month-scoped: the header shows a month stepper.
  // Trends follows its chart selection; other views show the current month.
  const monthScoped = webView === "transactions" || webView === "categories";
  const periodLabel =
    webView === "trends"
      ? monthKeyLabel(activeTrendKey(monthlyTrend(transactions), trendMonthKey))
      : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const title = webView === "overview" ? `Overview for ${periodLabel}` : TITLES[webView];

  return (
    <div className="relative flex h-screen bg-bg text-ink">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-5 flex items-center justify-between">
          <div className="text-2xl font-extrabold">{title}</div>
          <div className="flex items-center gap-2.5">
            {monthScoped ? (
              <MonthStepper />
            ) : (
              <span className="rounded-xl bg-card px-3.5 py-2 text-[12.5px] font-bold text-muted">
                📅 {periodLabel}
              </span>
            )}
          </div>
        </header>
        <View />
      </div>
      {webAddOpen && <AddModal />}
      {webEditTxnId && <EditTransactionModal />}
    </div>
  );
}
