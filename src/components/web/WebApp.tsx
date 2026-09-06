"use client";

import { useTranslations } from "next-intl";
import { formatMonthYear } from "@/lib/format";
import type { WebView } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { MonthSelector } from "@/components/shared/MonthSelector";
import { CashFlowMonthStepper } from "@/components/shared/CashFlowMonthStepper";
import { TrendPeriodToggle } from "@/components/shared/TrendPeriodToggle";
import { AddModal } from "./AddModal";
import { AddCategoryModal } from "./AddCategoryModal";
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

/** Desktop web companion: sidebar + main content, with an add-transaction modal. */
export function WebApp() {
  const {
    webView,
    webAddOpen,
    webAddCategoryOpen,
    webEditBudgetOpen,
    webEditTxnId,
    trendPeriod,
    trendView,
    webTxnQuery,
    locale,
    set,
  } = useStore(
    useShallow((s) => ({
      webView: s.webView,
      webAddOpen: s.webAddOpen,
      webAddCategoryOpen: s.webAddCategoryOpen,
      webEditBudgetOpen: s.webEditBudgetOpen,
      webEditTxnId: s.webEditTxnId,
      trendPeriod: s.trendPeriod,
      trendView: s.trendView,
      webTxnQuery: s.webTxnQuery,
      locale: s.locale,
      set: s.set,
    })),
  );
  const t = useTranslations("titles");
  const tTxns = useTranslations("txns");
  const View = VIEWS[webView];

  // Transactions, Budget, and Bills are month-scoped: the header shows a month stepper.
  // Spending Trends shows a reporting-period toggle; Cash flow has its own
  // fixed six-month window, so it deliberately does not expose this control.
  const monthScoped = webView === "transactions" || webView === "categories" || webView === "bills";
  const periodLabel = formatMonthYear(new Date(), locale);

  const title = t(webView);

  const scrollRowsWithinView = webView === "transactions";
  const searchingAllDates = webView === "transactions" && webTxnQuery.trim().length > 0;

  return (
    <div className="relative flex h-[100dvh] min-h-0 overflow-hidden bg-bg text-ink">
      <Sidebar />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header overlays the top of the scroll area (absolute) so content
            scrolls behind it — that's what makes the translucent bg-header +
            backdrop-blur read as frosted glass, matching the marketing header.
            `main` pads down by the header height (h-16) to compensate. */}
        <header className="absolute inset-x-0 top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-edge bg-header px-[30px] backdrop-blur">
          <div className="text-[26px] font-bold tracking-[-0.025em]">{title}</div>
          <div className="flex items-center gap-2.5">
            {monthScoped ? (
              <MonthStepper
                showToday={webView === "bills"}
                defaultToCurrent={webView === "bills"}
                disabled={searchingAllDates}
                disabledLabel={searchingAllDates ? tTxns("searchingAllDates") : undefined}
              />
            ) : webView === "trends" ? (
              trendView === "cashflow" ? (
                <CashFlowMonthStepper />
              ) : (
                <TrendPeriodToggle
                  period={trendPeriod}
                  onChange={(p) => set({ trendPeriod: p, trendMonthKey: "" })}
                />
              )
            ) : (
              <MonthSelector label={periodLabel} />
            )}
          </div>
        </header>
        <main
          className={`flex min-h-0 flex-1 flex-col px-[30px] pb-[26px] pt-16 ${
            scrollRowsWithinView ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <View />
        </main>
      </div>
      {webAddOpen && <AddModal />}
      {webAddCategoryOpen && <AddCategoryModal />}
      {webEditBudgetOpen && <EditBudgetModal />}
      {webEditTxnId && <EditTransactionModal />}
    </div>
  );
}
