"use client";
import { GroupFeatures } from "./GroupFeatures";

import { useSidebarCollapsed } from "@/components/shared/useSidebarCollapsed";
import { ChevronLeft, ChevronRight, Users, ArrowRightLeft, Folder } from "lucide-react";
import { sidebarItemClass } from "@/components/shared/sidebar-style";
import { Sprout, Home, Target, TrendingUp, LayoutGrid, NotebookText } from "lucide-react";
import { FileUp } from "lucide-react";
import type { GroupLedgerFilters } from "@/lib/groups/search";

import { Select } from "@/components/ui/Select";

import { groupContextPath } from "@/lib/groups/context-navigation";
import { groupToday } from "@/lib/groups/navigation";
import { QuickAddButton } from "@/components/shared/QuickAddButton";
import { ReportDateControl } from "@/components/shared/ReportDateControl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Settings } from "lucide-react";
import { useStore } from "@/state/store";
import { ContextSwitch } from "./ContextSwitch";
import { GroupDirectory } from "./GroupDirectory";
import { GroupOverview, GroupTransactions } from "./GroupLedger";
import { GroupBudget } from "./GroupBudget";
import { GroupSettlements } from "./GroupSettlements";
import { GroupImport } from "./GroupImport";
import { GroupSettings } from "./GroupSettings";
import { GroupSpendingInsights } from "./GroupSpendingInsights";
import { GroupCalendar } from "./GroupCalendar";
import { EntryForm } from "./EntryForm";
import { buttonClass, GroupDialog, useGroupMutation } from "./ui";
import type { GroupEntry } from "@/lib/groups/dto";

function routeId(pathname: string): string | undefined {
  return pathname.split("/")[2] || undefined;
}

const emptyLedgerFilters: GroupLedgerFilters = {};

const tabs = [
  { id: "overview", icon: Home },
  { id: "transactions", icon: ArrowRightLeft },
  { id: "budget", icon: LayoutGrid },
  { id: "trends", icon: TrendingUp },
  { id: "goals", icon: Target },
  { id: "bills", icon: NotebookText },
  { id: "settlements", icon: ArrowLeftRight },
  { id: "import", icon: Folder },
  { id: "settings", icon: Settings },
] as const;
/** One responsive household shell avoids parallel desktop/mobile data requests. */
export function GroupApp() {
  const pathname = usePathname(),
    router = useRouter(),
    id = routeId(pathname),
    tab = pathname.split("/")[3] || "overview";
  const { collapsed, toggle } = useSidebarCollapsed();
  const nav = useTranslations("nav");
  const t = useTranslations("groups"),
    data = useStore((s) => s.groupData),
    list = useStore((s) => s.groupList),
    error = useStore((s) => s.groupError),
    loading = useStore((s) => s.groupLoading);
  const tabLabel = (section: string) => (section === "settlements" ? t(section) : nav(section));
  const load = useStore((s) => s.loadGroup),
    loadList = useStore((s) => s.loadGroupList);
  const rememberedMonth = useStore((s) => (id ? s.groupMonths[id] : undefined));
  const [ledgerSearch, setLedgerSearch] = useState<{
    groupId: string | undefined;
    filters: GroupLedgerFilters;
  }>({ groupId: id, filters: {} });
  // Payer identities belong to a group; never carry one into a different group.
  const ledgerFilters = ledgerSearch.groupId === id ? ledgerSearch.filters : emptyLedgerFilters;
  const [ledgerDate, setLedgerDate] = useState<string | undefined>();
  const [calendarAddDate, setCalendarAddDate] = useState<string | undefined>();
  const [month, setMonth] = useState(() => rememberedMonth ?? groupToday().slice(0, 7)),
    [page, setPage] = useState(0),
    [editing, setEditing] = useState<GroupEntry | null | undefined>(undefined),
    [refund, setRefund] = useState<GroupEntry | null>(null);
  const refresh = useCallback(async () => {
    if (id) await load(id, month, page, tab === "transactions" ? ledgerFilters : {});
    await loadList();
  }, [id, load, loadList, month, page, tab, ledgerFilters]);
  const [importBusy, setImportBusy] = useState(false);
  const { run, busy: mutationBusy } = useGroupMutation(refresh);
  const busy = mutationBusy || importBusy;
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  useEffect(() => {
    const focus = () => {
      // Editable screens retain their loaded revision until save/review; polling
      // must not silently advance a draft's concurrency baseline.
      if (
        !document.hidden &&
        editing === undefined &&
        !busy &&
        !document.querySelector('[role="dialog"],input:focus,textarea:focus,select:focus') &&
        !["budget", "settlements", "settings", "import"].includes(tab)
      )
        void refresh().catch(() => {});
    };
    window.addEventListener("sprout:resume", focus);
    const timer = setInterval(focus, 25000);
    return () => {
      window.removeEventListener("sprout:resume", focus);
      clearInterval(timer);
    };
  }, [refresh, editing, busy, tab]);
  useEffect(() => {
    if (!importBusy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [importBusy]);
  const snapshot = data?.group.id === id ? data : null;
  const navigate = async (target: string) => {
    if (busy) return;
    setEditing(undefined);
    setRefund(null);
    setPage(0);
    router.push(target);
  };
  const changeMonth = async (value: string) => {
    if (busy) return;
    setEditing(undefined);
    setRefund(null);
    setLedgerDate(undefined);
    setMonth(value);
    setPage(0);
  };
  return (
    <div
      data-ledger-context="group"
      className="mx-auto min-h-[100svh] max-w-app bg-bg text-ink lg:fixed lg:inset-0 lg:mx-0 lg:flex lg:max-w-none lg:overflow-hidden"
    >
      <aside
        className={`group-sidebar relative border-b border-edge bg-sidebar p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:flex lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:py-5 ${collapsed ? "lg:w-[68px] lg:px-2" : "lg:w-[232px] lg:px-[14px]"}`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={nav(collapsed ? "expandSidebar" : "collapseSidebar")}
          className="absolute -right-[15px] top-1/2 z-40 hidden h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-card text-muted shadow-sm hover:bg-track lg:flex"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <Link
          href="/groups"
          className="mb-4 hidden items-center gap-2 px-2 text-lg font-bold tracking-[-0.01em] text-primary lg:flex"
        >
          <Sprout size={22} strokeWidth={2} /> {!collapsed && "Sprout"}
        </Link>
        <div className={collapsed ? "lg:hidden" : ""}>
          <ContextSwitch group disabled={busy} />
        </div>
        {collapsed && (
          <Link
            href="/groups"
            aria-label={t("title")}
            className="hidden min-h-11 items-center justify-center text-primary lg:flex"
          >
            <Users size={17} />
          </Link>
        )}
        {/* The mobile header owns the group title; keep the picker in the desktop rail. */}
        <div className={`mt-3 hidden ${collapsed ? "" : "lg:block"}`}>
          <label className="sr-only" htmlFor="group-picker">
            {t("chooseGroup")}
          </label>
          <Select
            id="group-picker"
            variant="group-picker"
            aria-label={t("chooseGroup")}
            disabled={busy}
            value={id ?? ""}
            onChange={(e) =>
              navigate(
                e.target.value
                  ? groupContextPath(e.target.value, tab)
                  : `/groups?manage=1&section=${encodeURIComponent(tab)}`,
              )
            }
            className="min-h-11 w-full rounded-[10px] border border-edge bg-card px-2 text-sm font-bold"
          >
            <option value="">{t("allGroups")}</option>
            {list.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        {id && (
          <nav aria-label={t("groupNavigation")} className="mt-[22px] hidden space-y-0.5 lg:block">
            {tabs.map((item) => (
              <button
                key={item.id}
                disabled={busy}
                onClick={() =>
                  navigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
                }
                aria-label={tabLabel(item.id)}
                title={collapsed ? tabLabel(item.id) : undefined}
                aria-current={tab === item.id ? "page" : undefined}
                className={sidebarItemClass(tab === item.id, collapsed)}
              >
                <item.icon size={17} strokeWidth={2} />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{tabLabel(item.id)}</span>}
              </button>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-3 lg:block">
          <button
            onClick={() => navigate(`/groups?manage=1&section=${encodeURIComponent(tab)}`)}
            className="mt-2 flex min-h-11 items-center gap-2 px-1 text-sm font-medium text-muted hover:text-ink lg:mt-4 lg:w-full lg:rounded-[10px] lg:border lg:border-edge lg:bg-card lg:px-3"
          >
            <ArrowLeftRight size={15} strokeWidth={2} />
            <span className={collapsed ? "lg:hidden" : ""}>{t("manageGroups")}</span>
          </button>
          {id && (
            <button
              disabled={busy}
              onClick={() => navigate(`/groups/${id}/import`)}
              aria-current={tab === "import" ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 px-1 text-sm font-medium lg:hidden ${tab === "import" ? "text-primary" : "text-muted"}`}
            >
              <FileUp size={15} strokeWidth={2} />
              {t("import")}
            </button>
          )}
        </div>
        <Link
          href="/settings"
          className={`mt-auto hidden min-h-11 items-center rounded-[10px] text-[13.5px] font-medium text-muted ${collapsed ? "justify-center" : "gap-[11px] px-[11px]"} lg:flex`}
          aria-label={t("accountSettings")}
        >
          <Settings size={17} /> {!collapsed && t("accountSettings")}
        </Link>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
        {id && (
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-edge bg-header px-4 py-5 backdrop-blur lg:px-7 lg:py-3">
            <div className="min-w-0 w-full lg:w-auto">
              <h1 className="break-words text-[26px] font-bold leading-tight lg:text-xl">
                {snapshot?.group.name ?? t("title")}
              </h1>
              <p className="mt-1 text-sm text-muted lg:text-xs">
                {t(tabs.some((i) => i.id === tab) ? tab : "overview")}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <QuickAddButton
                disabled={!snapshot || busy || loading || Boolean(snapshot.group.archivedAt)}
                onClick={async () => {
                  setRefund(null);
                  setCalendarAddDate(undefined);
                  setEditing(null);
                }}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted">{t("ledgerMonth")}</p>
                <ReportDateControl
                  month={month}
                  date={tab === "transactions" ? ledgerDate : undefined}
                  yearly={false}
                  directMonthPick
                  disabled={busy}
                  onMonthChange={changeMonth}
                  onSelect={(value, date) => {
                    changeMonth(value);
                    setLedgerDate(date);
                  }}
                />
              </div>
            </div>
          </header>
        )}
        <main data-workspace={tab} className="space-y-4 p-4 lg:p-7">
          {!id ? (
            <GroupDirectory />
          ) : error ? (
            <div role="alert" className="rounded-[14px] border border-edge bg-card p-5">
              <p>{error}</p>
              <button onClick={() => void refresh()} className={`${buttonClass} mt-3`}>
                {t("reload")}
              </button>
            </div>
          ) : !snapshot ? (
            <p role="status">{t("loading")}</p>
          ) : (
            <>
              {snapshot.group.archivedAt && (
                <p className="rounded-[10px] bg-track p-3 text-sm">{t("archivedNotice")}</p>
              )}
              {tab === "overview" && (
                <div className="home-composition flex flex-col gap-4">
                  <GroupOverview data={snapshot} month={month} onMonthChange={changeMonth} />
                  <div className="home-calendar">
                    <GroupCalendar
                      data={snapshot}
                      loading={loading}
                      busy={busy}
                      month={month}
                      onMonthChange={changeMonth}
                      onAdd={(date) => {
                        setCalendarAddDate(date);
                        setRefund(null);
                        setEditing(null);
                      }}
                      onEdit={(entry) => {
                        setRefund(null);
                        setEditing(entry);
                      }}
                      onViewAll={() => navigate(`/groups/${id}/transactions`)}
                    />
                  </div>
                </div>
              )}
              {tab === "transactions" && (
                <GroupTransactions
                  key={`${id}:${month}`}
                  data={snapshot}
                  month={month}
                  refresh={refresh}
                  onBusyChange={setImportBusy}
                  onImport={() => navigate(`/groups/${id}/import`)}
                  selectedDate={ledgerDate}
                  onClearDate={() => setLedgerDate(undefined)}
                  page={page}
                  setPage={setPage}
                  filters={ledgerFilters}
                  loading={loading}
                  onFiltersChange={(filters) => {
                    setLedgerSearch({ groupId: id, filters });
                    setPage(0);
                  }}
                  onEdit={(e) => {
                    setRefund(null);
                    setEditing(e);
                  }}
                  onRefund={(e) => {
                    setRefund(e);
                    setCalendarAddDate(undefined);
                    setEditing(null);
                  }}
                />
              )}
              {tab === "trends" && (
                <GroupSpendingInsights data={snapshot} month={month} onMonthChange={changeMonth} />
              )}
              {(tab === "goals" || tab === "bills") && (
                <GroupFeatures
                  key={`${id}:${tab}`}
                  data={snapshot}
                  month={month}
                  tab={tab}
                  run={run}
                />
              )}
              {tab === "budget" && (
                <GroupBudget
                  key={`${id}:${month}`}
                  data={snapshot}
                  month={month}
                  run={run}
                  busy={busy}
                />
              )}
              {tab === "settlements" && (
                <GroupSettlements
                  key={`${id}:${month}`}
                  data={snapshot}
                  month={month}
                  run={run}
                  busy={busy}
                />
              )}
              {tab === "import" && (
                <GroupImport
                  key={id}
                  data={snapshot}
                  refresh={refresh}
                  onBusyChange={setImportBusy}
                  onViewTransactions={() => navigate(`/groups/${id}/transactions`)}
                />
              )}
              {tab === "settings" && (
                <GroupSettings
                  key={id}
                  data={snapshot}
                  run={run}
                  busy={busy}
                  onLeave={() => navigate("/groups")}
                />
              )}
            </>
          )}
        </main>
      </div>
      {id && (
        <nav
          aria-label={t("groupNavigation")}
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-app overflow-x-auto border-t border-edge bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {tabs
            .filter((item) => item.id !== "import")
            .map((item) => (
              <button
                key={item.id}
                disabled={busy}
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() =>
                  navigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
                }
                className={`flex min-h-16 min-w-[72px] shrink-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] ${tab === item.id ? "text-primary" : "text-muted"}`}
              >
                <item.icon size={18} />
                <span>{tabLabel(item.id)}</span>
              </button>
            ))}
        </nav>
      )}
      {editing !== undefined && snapshot && (
        <GroupDialog
          title={t(refund ? "addRefund" : editing ? "editEntry" : "addEntry")}
          width={440}
          onClose={async () => {
            if (!busy) {
              setEditing(undefined);
              setRefund(null);
            }
          }}
        >
          <EntryForm
            data={snapshot}
            initialDate={calendarAddDate}
            existing={editing}
            refund={refund}
            run={run}
            busy={busy}
            onDone={() => {
              setEditing(undefined);
              setRefund(null);
            }}
          />
        </GroupDialog>
      )}
    </div>
  );
}
