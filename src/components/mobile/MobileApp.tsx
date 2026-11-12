"use client";

import { useLayoutEffect, useRef } from "react";
import { useDesktop } from "@/hooks/useDesktop";
import { personalLedgerViewIdentity } from "@/lib/pwa/ledger-view";
import { useMobilePageScroll } from "@/hooks/useMobilePageScroll";
import { useMobileBackLayer } from "@/hooks/useMobileBackLayer";
import { sectionForMobileScreen } from "@/lib/nav";
import { LoadingRegion } from "@/components/ui/LoadingIndicator";

import { useMobileNavHeight } from "@/hooks/useMobileNavHeight";
import { MobileAccountHeader } from "./MobileAccountHeader";
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
  const { mobileScreen, addReturnTo, txnReturnTo, selectedCategoryId, goMobile } = useStore(
    useShallow((s) => ({
      mobileScreen: s.mobileScreen,
      addReturnTo: s.addReturnTo,
      txnReturnTo: s.txnReturnTo,
      selectedCategoryId: s.selectedCategoryId,
      goMobile: s.goMobile,
    })),
  );
  const resetAdd = useStore((s) => s.resetAdd);
  const isAddScreen = mobileScreen === "add";
  const isEditScreen = mobileScreen === "txnDetail";
  const backgroundScreen = isEditScreen
    ? txnReturnTo
    : isAddScreen
      ? addReturnTo === "add"
        ? "home"
        : addReturnTo
      : mobileScreen;
  const desktop = useDesktop();
  const detail = !sectionForMobileScreen(backgroundScreen);
  const previous = useRef(backgroundScreen);
  const parent = useRef<MobileScreen>("home");
  useLayoutEffect(() => {
    if (previous.current !== backgroundScreen && detail) parent.current = previous.current;
    previous.current = backgroundScreen;
  }, [backgroundScreen, detail]);
  useMobileBackLayer(detail, () => goMobile(parent.current));
  const ledgerView = useStore(personalLedgerViewIdentity);
  const viewportRef = useMobilePageScroll(
    `${backgroundScreen}:${backgroundScreen === "catDetail" ? selectedCategoryId : backgroundScreen === "history" ? ledgerView : ""}`,
    detail || backgroundScreen === "import" || backgroundScreen === "bills",
    !desktop,
    !loading,
  );
  const Screen = SCREENS[backgroundScreen];
  const showHeader = hasMobileHeader(backgroundScreen);

  return (
    <div
      data-ledger-context="personal"
      className="mobile-app-frame relative flex w-full max-w-app flex-col bg-bg"
    >
      <div ref={viewportRef} data-mobile-scroll className="mobile-page-scroll no-scrollbar">
        <div
          className={`${backgroundScreen !== "home" && sectionForMobileScreen(backgroundScreen) ? "mobile-transactions-context" : ""} px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]`}
        >
          <MobileAccountHeader screen={backgroundScreen} />
          <ContextSwitch />
        </div>
        <MobileHeader screen={backgroundScreen} />
        {!isAddScreen && (backgroundScreen === "home" || backgroundScreen === "history") && (
          <ScrollRecordAction
            key={`record:${backgroundScreen}`}
            disabled={loading}
            onClick={() => {
              resetAdd();
              goMobile("add");
            }}
          />
        )}
        <main
          key={backgroundScreen}
          data-mobile-page={backgroundScreen}
          className={`mobile-screen-enter pb-4 ${showHeader ? "" : "pt-4"}`}
        >
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
      </div>
      {/* Keep the originating ledger visible beneath the shared entry dialog. */}
      <div
        ref={navRef}
        className="mobile-bottom-nav relative z-40 shrink-0 border-t border-edge bg-bg pb-[env(safe-area-inset-bottom)]"
      >
        <TabBar screen={backgroundScreen} />
      </div>
      {isAddScreen && !loading && <Add />}
      {isEditScreen && !loading && <TransactionDetail />}
    </div>
  );
}
