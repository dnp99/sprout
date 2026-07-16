"use client";

import {
  ArrowRightLeft,
  Home,
  LayoutGrid,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { MobileScreen } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Turn-4 mobile nav: a 5-icon tab row (Home, Transactions, Categories,
// Trends, Goals) with stroked lucide icons.
type TabId = "home" | "transactions" | "categories" | "trends" | "goals";
const TABS: { id: TabId; icon: LucideIcon; labelKey: string; screen: MobileScreen }[] = [
  { id: "home", icon: Home, labelKey: "home", screen: "home" },
  { id: "transactions", icon: ArrowRightLeft, labelKey: "transactions", screen: "history" },
  { id: "categories", icon: LayoutGrid, labelKey: "budget", screen: "categories" },
  { id: "trends", icon: TrendingUp, labelKey: "trends", screen: "trends" },
  { id: "goals", icon: Target, labelKey: "goals", screen: "goals" },
];

/** Which tab a given screen belongs under (for highlighting). */
function tabForScreen(screen: MobileScreen): TabId | null {
  if (screen === "home") return "home";
  if (screen === "history" || screen === "search" || screen === "txnDetail") return "transactions";
  if (screen === "categories" || screen === "catDetail" || screen === "addCat") return "categories";
  if (screen === "trends") return "trends";
  if (screen === "goals") return "goals";
  if (screen === "bills" || screen === "addBill" || screen === "recurring") return "home";
  return null;
}

export function TabBar() {
  const { mobileScreen, goMobile } = useStore(
    useShallow((s) => ({ mobileScreen: s.mobileScreen, goMobile: s.goMobile })),
  );
  const activeTab = tabForScreen(mobileScreen);
  const t = useTranslations("nav");

  return (
    // The sticky bottom region (and its top border) is provided by MobileApp so
    // an optional action bar can sit above this nav in the same pinned area.
    <nav className="flex items-center justify-between px-3.5 pb-3.5 pt-2">
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
              {t(tab.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
