"use client";

import { LoadingRegion } from "@/components/ui/LoadingIndicator";

import { useMobileNavHeight } from "@/hooks/useMobileNavHeight";
import { AccountHeader } from "@/components/shared/AccountHeader";
import { BudgetGoalsSwitch } from "@/components/shared/BudgetGoalsSwitch";
import { ContextSwitch } from "@/components/groups/ContextSwitch";

import { ScrollRecordAction } from "@/components/shared/ScrollRecordAction";
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
import { ConnectedAppsScreen } from "./screens/ConnectedAppsScreen";
import { RulesScreen } from "./screens/RulesScreen";
import { SecurityScreen } from "./screens/SecurityScreen";
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
  connectedApps: ConnectedAppsScreen,
  security: SecurityScreen,
  rules: RulesScreen,
  add: Add,
};

/** Mobile phone experience: the active screen over a sticky tab bar. */
export function MobileApp({ loading = false }: { loading?: boolean }) {
  const navRef = useMobileNavHeight();
  const { mobileScreen, addReturnTo, goMobile } = useStore(
    useShallow((s) => ({
      mobileScreen: s.mobileScreen,
      addReturnTo: s.addReturnTo,
      goMobile: s.goMobile,
    })),
  );
  const resetAdd = useStore((s) => s.resetAdd);
  const isAddScreen = mobileScreen === "add";
  const isEditScreen = mobileScreen === "txnDetail";
  const backgroundScreen = isEditScreen
    ? "history"
    : isAddScreen
      ? addReturnTo === "add"
        ? "home"
        : addReturnTo
      : mobileScreen;
  const Screen = SCREENS[backgroundScreen];
  const showHeader = hasMobileHeader(backgroundScreen);

  return (
    <div
      data-ledger-context="personal"
      className="relative flex min-h-screen w-full max-w-app flex-col bg-bg"
    >
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <AccountHeader />
        <ContextSwitch />
      </div>
      <MobileHeader screen={backgroundScreen} />
      {!isAddScreen && (backgroundScreen === "home" || backgroundScreen === "history") && (
        <ScrollRecordAction
          key={mobileScreen}
          disabled={loading}
          onClick={() => {
            resetAdd();
            goMobile("add");
          }}
        />
      )}
      <main className={`no-scrollbar flex-1 overflow-y-auto pb-4 ${showHeader ? "" : "pt-4"}`}>
        {(backgroundScreen === "categories" || backgroundScreen === "goals") && (
          <div className="px-4">
            <BudgetGoalsSwitch
              active={backgroundScreen === "goals" ? "goals" : "budget"}
              onChange={(value) => goMobile(value === "goals" ? "goals" : "categories")}
            />
          </div>
        )}
        {loading ? <LoadingRegion /> : <Screen />}
      </main>
      {/* Keep the originating ledger visible beneath the shared entry dialog. */}
      <div
        ref={navRef}
        className="sticky bottom-0 z-40 border-t border-edge bg-bg pb-[env(safe-area-inset-bottom)]"
      >
        <TabBar screen={backgroundScreen} />
      </div>
      {isAddScreen && !loading && <Add />}
      {isEditScreen && !loading && <TransactionDetail />}
    </div>
  );
}
