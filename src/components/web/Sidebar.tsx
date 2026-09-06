"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowRightLeft,
  ChevronsUpDown,
  Folder,
  Home,
  LayoutGrid,
  LogOut,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
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

const SIDEBAR_COLLAPSED_KEY = "sprout-sidebar-collapsed";

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeToSidebarPreference(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** The desktop rail remembers its compact state without making it part of the
 * app's server data. `useSyncExternalStore` keeps the server and hydration
 * snapshots aligned, then picks up a saved preference after the first paint. */
function useSidebarCollapsed() {
  const storedCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    readSidebarCollapsed,
    () => false,
  );
  const [sessionCollapsed, setSessionCollapsed] = useState<boolean | null>(null);
  const collapsed = sessionCollapsed ?? storedCollapsed;

  const toggle = () => {
    const next = !collapsed;
    // Keep the interaction responsive even when private browsing rejects storage.
    setSessionCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Private browsing can reject storage; the current interaction still works.
    }
    window.dispatchEvent(new Event("storage"));
  };

  return { collapsed, toggle };
}

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
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <div
      className={`relative flex flex-none flex-col bg-sidebar py-5 transition-[width] duration-200 ${
        collapsed ? "w-[68px] px-2" : "w-[232px] px-[14px]"
      }`}
    >
      <div className={`flex items-center pb-1 ${collapsed ? "justify-center" : "gap-2 px-2"}`}>
        <span className="text-lg">🌱</span>
        {!collapsed && <span className="text-lg font-bold tracking-[-0.01em] text-primary">Sprout</span>}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-track hover:text-ink ${
            collapsed ? "absolute left-[18px] top-[52px]" : "ml-auto"
          }`}
        >
          {collapsed ? <PanelLeftOpen size={16} strokeWidth={2} /> : <PanelLeftClose size={16} strokeWidth={2} />}
        </button>
      </div>

      <div className={`flex flex-col gap-0.5 ${collapsed ? "mt-12" : "mt-[22px]"}`}>
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
              aria-label={t(item.labelKey)}
              title={collapsed ? t(item.labelKey) : undefined}
              className={`relative flex items-center rounded-[10px] py-[9px] text-left text-[13.5px] transition ${
                collapsed ? "justify-center px-2" : "gap-[11px] px-[11px]"
              } ${
                active
                  ? "bg-primary-soft font-semibold text-primary"
                  : "font-medium text-muted hover:bg-track"
              }`}
            >
              <Icon size={17} strokeWidth={2} className="flex-none" />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>}
              {item.view === "bills" && <NeedsReviewBadge count={needsReviewCount} />}
            </button>
          );
        })}
      </div>

      <div className="relative mt-auto">
        {webUserMenuOpen && (
          <div
            className={`absolute bottom-[52px] left-0 z-10 rounded-[12px] border border-edge bg-card p-1.5 shadow-xl ${
              collapsed ? "w-[196px]" : "right-0"
            }`}
          >
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
          aria-label={user.name}
          title={collapsed ? user.name : undefined}
          className={`flex w-full items-center rounded-[10px] p-2 text-left hover:bg-track ${
            collapsed ? "justify-center" : "gap-2.5"
          }`}
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-[13px] font-bold text-onprimary">
            {(user.greetingName || user.name || "?").charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-semibold text-ink">{user.name}</div>
                <div className="text-[10.5px] text-muted">Personal</div>
              </div>
              <ChevronsUpDown size={15} strokeWidth={2} className="flex-none text-muted" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
