"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  ChevronsUpDown,
  Folder,
  Home,
  LayoutGrid,
  LogOut,
  NotebookText,
  Plus,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { WebView } from "@/lib/types";
import { currentMonthKey } from "@/lib/trends";
import { useRecurringNeedsReviewCount } from "@/components/shared/useRecurringNeedsReviewCount";
import { NeedsReviewBadge } from "@/components/ui/NeedsReviewBadge";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Lucide (stroked) icons mirror the design's sidebar glyphs — the app no longer
// uses emoji for navigation. Labels come from the `nav` catalog namespace.
const NAV: { view: WebView; icon: LucideIcon; labelKey: string }[] = [
  { view: "overview", icon: Home, labelKey: "overview" },
  { view: "transactions", icon: ArrowRightLeft, labelKey: "transactions" },
  { view: "categories", icon: LayoutGrid, labelKey: "budget" },
  { view: "trends", icon: TrendingUp, labelKey: "trends" },
  { view: "goals", icon: Target, labelKey: "goals" },
  { view: "bills", icon: NotebookText, labelKey: "bills" },
  { view: "import", icon: Folder, labelKey: "import" },
  { view: "settings", icon: SettingsIcon, labelKey: "settings" },
];

export function Sidebar() {
  const { user, webView, webUserMenuOpen, set } = useStore(
    useShallow((s) => ({
      user: s.user,
      webView: s.webView,
      webUserMenuOpen: s.webUserMenuOpen,
      set: s.set,
    })),
  );
  const router = useRouter();
  const needsReviewCount = useRecurringNeedsReviewCount();
  const t = useTranslations("nav");

  return (
    <div className="flex w-[232px] flex-none flex-col border-r border-edge bg-sidebar px-[14px] py-5">
      <div className="flex items-center gap-2 px-2 pb-1">
        <span className="text-lg">🌱</span>
        <span className="text-lg font-bold tracking-[-0.01em] text-primary">Sprout</span>
      </div>

      <div className="mt-[22px] flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = webView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() =>
                set(
                  item.view === "bills"
                    ? { webView: "bills", viewMonthKey: currentMonthKey() }
                    : { webView: item.view },
                )
              }
              className={`flex items-center gap-[11px] rounded-[10px] px-[11px] py-[9px] text-left text-[13.5px] transition ${
                active
                  ? "bg-primary-soft font-semibold text-primary"
                  : "font-medium text-muted hover:bg-track"
              }`}
            >
              <Icon size={17} strokeWidth={2} className="flex-none" />
              <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
              {item.view === "bills" && <NeedsReviewBadge count={needsReviewCount} />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => set({ webAddOpen: true })}
        className="mt-5 flex items-center justify-center gap-[7px] rounded-[10px] bg-primary py-2.5 text-[13px] font-semibold text-onprimary"
      >
        <Plus size={16} strokeWidth={2.6} />
        {t("addTransaction")}
      </button>

      <div className="relative mt-auto">
        {webUserMenuOpen && (
          <div className="absolute bottom-[52px] left-0 right-0 z-10 rounded-[12px] border border-edge bg-card p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => set({ webView: "settings", webUserMenuOpen: false })}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium text-ink hover:bg-track"
            >
              <SettingsIcon size={15} strokeWidth={2} /> Settings
            </button>
            <button
              type="button"
              onClick={() => router.push("/logout")}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-semibold text-primary hover:bg-track"
            >
              <LogOut size={15} strokeWidth={2} /> Log out
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => set({ webUserMenuOpen: !webUserMenuOpen })}
          className="flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left hover:bg-track"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-[13px] font-bold text-onprimary">
            {(user.greetingName || user.name || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-semibold text-ink">{user.name}</div>
            <div className="text-[10.5px] text-muted">Personal</div>
          </div>
          <ChevronsUpDown size={15} strokeWidth={2} className="flex-none text-muted" />
        </button>
      </div>
    </div>
  );
}
