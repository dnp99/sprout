"use client";

import { LedgerMobileTabs } from "@/components/shared/LedgerMobileTabs";
import type { MobileScreen } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Which tab a given screen belongs under (for highlighting). */
function tabForScreen(screen: MobileScreen): string | null {
  if (screen === "home") return "overview";
  if (screen === "history" || screen === "search" || screen === "txnDetail") return "transactions";
  if (screen === "categories" || screen === "catDetail" || screen === "addCat") return "budget";
  if (screen === "trends") return "trends";
  if (screen === "goals" || screen === "budget") return "budget";
  if (["settings", "rules", "connectedApps"].includes(screen)) return "settings";
  if (["bills", "addBill", "recurring", "import"].includes(screen)) return "transactions";
  return null;
}

export function TabBar({ screen }: { screen?: MobileScreen }) {
  const { mobileScreen, goMobile } = useStore(
    useShallow((s) => ({ mobileScreen: s.mobileScreen, goMobile: s.goMobile })),
  );
  const activeTab = tabForScreen(screen ?? mobileScreen);

  return (
    // The sticky bottom region (and its top border) is provided by MobileApp so
    // an optional action bar can sit above this nav in the same pinned area.
    <nav className="grid grid-cols-5 items-stretch gap-1 px-2 pb-3.5 pt-2">
      <LedgerMobileTabs active={activeTab} onSelect={(tab) => goMobile(tab.screen)} />
    </nav>
  );
}
