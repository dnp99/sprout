"use client";

import type { WebView } from "@/lib/types";
import { useStore } from "@/state/store";
import { AddModal } from "./AddModal";
import { Sidebar } from "./Sidebar";
import { Bills } from "./views/Bills";
import { Categories } from "./views/Categories";
import { Goals } from "./views/Goals";
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
  settings: Settings,
};

const TITLES: Record<WebView, string> = {
  overview: "Overview",
  transactions: "Transactions",
  categories: "Categories & budgets",
  trends: "Trends & reports",
  goals: "Savings goals",
  bills: "Bills & recurring",
  settings: "Account settings",
};

/** Desktop web companion: sidebar + main content, with an add-transaction modal. */
export function WebApp() {
  const { webView, webAddOpen, set } = useStore();
  const View = VIEWS[webView];

  return (
    <div className="relative flex h-screen bg-bg text-ink">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <header className="mb-5 flex items-center justify-between">
          <div className="text-2xl font-extrabold">{TITLES[webView]}</div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl bg-card px-3.5 py-2 text-[12.5px] font-bold text-muted">
              📅 June 2026
            </span>
            <button
              type="button"
              onClick={() => set({ webAddOpen: true })}
              className="rounded-xl bg-primary px-4 py-2 text-[12.5px] font-extrabold text-white"
            >
              + Add
            </button>
          </div>
        </header>
        <View />
      </div>
      {webAddOpen && <AddModal />}
    </div>
  );
}
