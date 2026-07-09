"use client";

import { Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { MobileScreen } from "@/lib/types";
import { useStore } from "@/state/store";
import { TabBar } from "./TabBar";
import { Add } from "./screens/Add";
import { AddBill } from "./screens/AddBill";
import { AddCategory } from "./screens/AddCategory";
import { Activity } from "./screens/Activity";
import { Bills } from "./screens/Bills";
import { BudgetSetup } from "./screens/BudgetSetup";
import { Categories } from "./screens/Categories";
import { CategoryDetail } from "./screens/CategoryDetail";
import { Goals } from "./screens/Goals";
import { Home } from "./screens/Home";
import { Import } from "./screens/Import";
import { ManageRecurring } from "./screens/ManageRecurring";
import { Search } from "./screens/Search";
import { Settings } from "./screens/Settings";
import { Trends } from "./screens/Trends";
import { TransactionDetail } from "./screens/TransactionDetail";
import { MobileHeader, hasMobileHeader } from "./MobileHeader";

const SCREENS: Record<MobileScreen, () => React.ReactNode> = {
  home: Home,
  categories: Categories,
  catDetail: CategoryDetail,
  addCat: AddCategory,
  budget: BudgetSetup,
  settings: Settings,
  search: Search,
  trends: Trends,
  goals: Goals,
  bills: Bills,
  addBill: AddBill,
  recurring: ManageRecurring,
  history: Activity,
  txnDetail: TransactionDetail,
  import: Import,
  add: Add,
};

/** Mobile phone experience: the active screen over a sticky tab bar. */
export function MobileApp() {
  const { mobileScreen, goMobile } = useStore(
    useShallow((s) => ({ mobileScreen: s.mobileScreen, goMobile: s.goMobile })),
  );
  const Screen = SCREENS[mobileScreen];
  const isAddScreen = mobileScreen === "add";
  const showHeader = hasMobileHeader(mobileScreen);

  return (
    <div
      className={
        // The Add screen is a fixed, non-scrolling pinned-footer layout, so it
        // needs a definite height equal to the *visible* viewport. `svh` (small
        // viewport height) keeps the footer button clear of mobile Safari's
        // bottom toolbar; plain `min-h-screen` (100vh) is taller than the
        // visible area and pushes the "Add expense" button below the fold.
        // Other screens scroll, so min-height + page scroll is correct for them.
        isAddScreen
          ? "relative flex h-[100svh] w-full max-w-app flex-col overflow-hidden bg-bg"
          : "relative flex min-h-screen w-full max-w-app flex-col bg-bg"
      }
    >
      <MobileHeader screen={mobileScreen} />
      <main
        className={
          isAddScreen
            ? "min-h-0 flex-1 overflow-hidden"
            : // Screens with a MobileHeader already get their top gap from it +
              // their own padding; adding pt-4 here stacked a third gap. Headerless
              // screens (Settings, detail views) still need it for breathing room.
              `no-scrollbar flex-1 overflow-y-auto pb-4 ${showHeader ? "" : "pt-4"}`
        }
      >
        <Screen />
      </main>
      {!isAddScreen && (
        // Pinned bottom region: an optional per-screen action bar sits above the
        // tab bar so all the bottom actions live together. (Sticky here — not
        // inside `main` — because the page, not `main`, is the scroll container.)
        <div className="sticky bottom-0 z-40 border-t border-edge bg-bg">
          {mobileScreen === "history" && (
            <div className="px-4 pt-2.5">
              <button
                type="button"
                onClick={() => goMobile("add")}
                className="flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-primary py-3 text-[14px] font-semibold text-onprimary"
              >
                <Plus size={16} strokeWidth={2.6} />
                Add transaction
              </button>
            </div>
          )}
          <TabBar />
        </div>
      )}
    </div>
  );
}
