"use client";

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
import { MobileHeader } from "./MobileHeader";

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
  const mobileScreen = useStore((s) => s.mobileScreen);
  const Screen = SCREENS[mobileScreen];
  const isAddScreen = mobileScreen === "add";

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
            : "no-scrollbar flex-1 overflow-y-auto pb-4 pt-4"
        }
      >
        <Screen />
      </main>
      {!isAddScreen && <TabBar />}
    </div>
  );
}
