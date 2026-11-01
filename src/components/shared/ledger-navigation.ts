import { ArrowRightLeft, Home, LayoutGrid, Settings, TrendingUp } from "lucide-react";

/** Shared functions keep the same mobile slot in both ledgers. Group-only
 * destinations belong in secondary navigation rather than shifting these. */
export const MOBILE_LEDGER_TABS = [
  { id: "overview", screen: "home", labelKey: "home", icon: Home },
  { id: "transactions", screen: "history", labelKey: "transactions", icon: ArrowRightLeft },
  { id: "budget", screen: "categories", labelKey: "budgetGoals", icon: LayoutGrid },
  { id: "trends", screen: "trends", labelKey: "trends", icon: TrendingUp },
  { id: "settings", screen: "settings", labelKey: "settings", icon: Settings },
] as const;

/** Shape and border stay at the call site; only geometry is shared. */
export const mobileLedgerTabClass =
  "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-[3px] py-1";
