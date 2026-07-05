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
import { ManageRecurring } from "./screens/ManageRecurring";
import { Search } from "./screens/Search";
import { Settings } from "./screens/Settings";
import { Trends } from "./screens/Trends";
import { TransactionDetail } from "./screens/TransactionDetail";

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
  add: Add,
};

/** Mobile phone experience: the active screen over a sticky tab bar. */
export function MobileApp() {
  const { mobileScreen } = useStore();
  const Screen = SCREENS[mobileScreen];

  return (
    <div className="relative flex min-h-screen w-full max-w-app flex-col bg-bg">
      <main className="no-scrollbar flex-1 overflow-y-auto pb-4 pt-4">
        <Screen />
      </main>
      <TabBar />
    </div>
  );
}
