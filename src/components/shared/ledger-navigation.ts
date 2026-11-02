import { ArrowRightLeft, Home, LayoutGrid, Settings, TrendingUp } from "lucide-react";

/** Shared functions keep the same mobile slot in both ledgers. Group-only
 * destinations belong in their related workspace rather than shifting these. */
export const MOBILE_LEDGER_TABS = [
  { id: "transactions", screen: "history", labelKey: "transactions", icon: ArrowRightLeft },
  { id: "budget", screen: "categories", labelKey: "budgetGoals", icon: LayoutGrid },
  { id: "overview", screen: "home", labelKey: "home", icon: Home },
  { id: "trends", screen: "trends", labelKey: "trends", icon: TrendingUp },
  { id: "settings", screen: "settings", labelKey: "settings", icon: Settings },
] as const;

/** Shape and border stay at the call site; only geometry is shared. */
export const mobileLedgerTabClass =
  "flex min-h-14 min-w-0 w-full flex-col items-center justify-start gap-[3px] px-0.5 py-1";
