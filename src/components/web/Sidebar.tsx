"use client";

import { DesktopAccountMenu } from "@/components/settings/DesktopAccountMenu";
import { sidebarItemClass } from "@/components/shared/sidebar-style";
import { Users } from "lucide-react";
import { ContextSwitch } from "@/components/groups/ContextSwitch";

import Link from "next/link";
import { useSidebarCollapsed } from "@/components/shared/useSidebarCollapsed";
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Sprout,
  Settings as SettingsIcon,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { WebView } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

// Lucide (stroked) icons mirror the design's sidebar glyphs — the app no longer
// uses emoji for navigation. Labels come from the `nav` catalog namespace.
const NAV: { view: WebView; icon: LucideIcon; labelKey: string }[] = [
  { view: "overview", icon: Home, labelKey: "overview" },
  { view: "transactions", icon: ArrowRightLeft, labelKey: "transactions" },
  { view: "categories", icon: LayoutGrid, labelKey: "budgetGoals" },
  { view: "trends", icon: TrendingUp, labelKey: "trends" },
  { view: "settings", icon: SettingsIcon, labelKey: "settings" },
];

export function Sidebar() {
  const { webView, set } = useStore(
    useShallow((s) => ({
      webView: s.webView,
      set: s.set,
    })),
  );
  const t = useTranslations("nav");
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <div
      className={`relative z-30 flex flex-none flex-col border-r border-edge bg-sidebar py-5 transition-[width] duration-200 ${
        collapsed ? "w-[68px] px-2" : "w-[232px] px-[14px]"
      }`}
    >
      <div className={`flex items-center pb-1 ${collapsed ? "justify-center" : "gap-2 px-2"}`}>
        <Link
          href="/home"
          onClick={() => set({ webView: "overview" })}
          aria-label="Sprout home"
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}
        >
          <Sprout size={22} strokeWidth={2} className="text-primary" aria-hidden="true" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-[-0.01em] text-primary">Sprout</span>
          )}
        </Link>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
        title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
        className="absolute -right-[15px] top-1/2 z-40 flex h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-card text-muted shadow-sm transition hover:bg-track hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
      >
        {collapsed ? (
          <ChevronRight size={16} strokeWidth={2} />
        ) : (
          <ChevronLeft size={16} strokeWidth={2} />
        )}
      </button>

      <div className="mt-4">
        {collapsed ? (
          <Link
            href="/groups"
            aria-label="Groups"
            className="flex min-h-11 items-center justify-center text-primary"
          >
            <Users size={17} />
          </Link>
        ) : (
          <ContextSwitch />
        )}
      </div>
      <div className="mt-[22px] flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active =
            webView === item.view ||
            (item.view === "categories" && webView === "goals") ||
            (item.view === "transactions" && ["bills", "import"].includes(webView));
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => set({ webView: item.view })}
              aria-label={t(item.labelKey)}
              title={collapsed ? t(item.labelKey) : undefined}
              aria-current={active ? "page" : undefined}
              className={sidebarItemClass(active, collapsed)}
            >
              <Icon size={17} strokeWidth={2} className="flex-none" />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-auto border-t border-edge pt-3">
        <DesktopAccountMenu compact={collapsed} />
      </div>
    </div>
  );
}
