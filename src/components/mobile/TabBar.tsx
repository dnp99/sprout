"use client";

import {
  ArrowRightLeft,
  Home,
  LayoutGrid,
  NotebookText,
  Plus,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { MobileScreen } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Turn-4 mobile nav: a full-width "Add transaction" button above a 5-icon tab
// row (Home, Transactions, Categories, Goals, Bills) with stroked lucide icons.
type TabId = "home" | "transactions" | "categories" | "goals" | "bills";
const TABS: { id: TabId; icon: LucideIcon; label: string; screen: MobileScreen }[] = [
  { id: "home", icon: Home, label: "Home", screen: "home" },
  { id: "transactions", icon: ArrowRightLeft, label: "Transactions", screen: "history" },
  { id: "categories", icon: LayoutGrid, label: "Categories", screen: "categories" },
  { id: "goals", icon: Target, label: "Goals", screen: "goals" },
  { id: "bills", icon: NotebookText, label: "Bills", screen: "bills" },
];

/** Which tab a given screen belongs under (for highlighting). */
function tabForScreen(screen: MobileScreen): TabId | null {
  if (screen === "home") return "home";
  if (screen === "history" || screen === "search" || screen === "txnDetail") return "transactions";
  if (screen === "categories" || screen === "catDetail" || screen === "addCat") return "categories";
  if (screen === "goals") return "goals";
  if (screen === "bills" || screen === "addBill" || screen === "recurring") return "bills";
  return null;
}

export function TabBar() {
  const { mobileScreen, goMobile } = useStore(
    useShallow((s) => ({ mobileScreen: s.mobileScreen, goMobile: s.goMobile })),
  );
  const activeTab = tabForScreen(mobileScreen);

  return (
    <div className="sticky bottom-0 z-40 bg-bg">
      <div className="px-3.5 pt-2.5">
        <button
          type="button"
          onClick={() => goMobile("add")}
          className="flex w-full items-center justify-center gap-[7px] rounded-[12px] bg-primary py-3 text-[12.5px] font-semibold text-onprimary transition active:scale-[.99]"
        >
          <Plus size={16} strokeWidth={2.6} />
          Add transaction
        </button>
      </div>
      <nav className="mt-2.5 flex items-center justify-between border-t border-edge px-3.5 pb-3.5 pt-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => goMobile(tab.screen)}
              className="flex flex-1 flex-col items-center gap-[3px] py-1"
            >
              <Icon size={18} strokeWidth={2} className={active ? "text-primary" : "text-muted"} />
              <span
                className={`text-[8.5px] ${active ? "font-semibold text-primary" : "font-medium text-muted"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
