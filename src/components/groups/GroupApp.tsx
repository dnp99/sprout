"use client";
import { LedgerMobileTabs } from "@/components/shared/LedgerMobileTabs";
import { ScrollRecordAction } from "@/components/shared/ScrollRecordAction";
import { AccountHeader } from "@/components/shared/AccountHeader";
import { BudgetGoalsSwitch } from "@/components/shared/BudgetGoalsSwitch";
import { GroupHeaderTitle, GroupSectionTitle } from "./GroupHeaderTitle";
import { GroupFeatures } from "./GroupFeatures";

import { useSidebarCollapsed } from "@/components/shared/useSidebarCollapsed";
import { ChevronLeft, ChevronRight, Users, ArrowRightLeft, Folder } from "lucide-react";
import { sidebarItemClass } from "@/components/shared/sidebar-style";
import { Sprout, Home, TrendingUp, LayoutGrid, NotebookText } from "lucide-react";
import { GroupSecondaryNavigation } from "./GroupSecondaryNavigation";
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
import { Settings } from "lucide-react";
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
  { id: "bills", icon: NotebookText },
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
  const addFlow = useTranslations("addFlow");
  const t = useTranslations("groups"),
    data = useStore((s) => s.groupData),
    list = useStore((s) => s.groupList),
    error = useStore((s) => s.groupError),
    loading = useStore((s) => s.groupLoading);
  const tabLabel = (section: string) =>
    section === "settlements" ? t(section) : nav(section === "budget" ? "budgetGoals" : section);
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
        <AccountHeader compact={collapsed} responsiveCompact />
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
                aria-current={
                  tab === item.id || (item.id === "budget" && tab === "goals") ? "page" : undefined
                }
                className={sidebarItemClass(
                  tab === item.id || (item.id === "budget" && tab === "goals"),
                  collapsed,
                )}
              >
                <item.icon size={17} strokeWidth={2} />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{tabLabel(item.id)}</span>}
              </button>
            ))}
          </nav>
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
        <div className="hidden lg:block">
          <GroupSecondaryNavigation
            id={id}
            tab={tab}
            busy={busy}
            navigate={navigate}
            collapsed={collapsed}
          />
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
        {id && (
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-header px-4 py-3.5 backdrop-blur lg:h-16 lg:flex-nowrap lg:px-[30px] lg:py-0">
            <div className="min-w-0 flex-1">
              {tab === "overview" ? (
                <GroupHeaderTitle
                  id={id}
                  name={snapshot?.group.name ?? t("title")}
                  groups={list}
                  disabled={busy}
                  onChange={(next) => navigate(groupContextPath(next, tab))}
                />
              ) : (
                <GroupSectionTitle section={tab} name={snapshot?.group.name ?? t("title")} />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-2.5">
              <div className={tab === "overview" || tab === "transactions" ? "hidden" : ""}>
                <QuickAddButton
                  responsive
                  disabled={!snapshot || busy || loading || Boolean(snapshot.group.archivedAt)}
                  onClick={async () => {
                    setRefund(null);
                    setCalendarAddDate(undefined);
                    setEditing(null);
                  }}
                />
              </div>
              <div className="space-y-1">
                <span className="sr-only">{t("ledgerMonth")}</span>
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
        {id && (tab === "overview" || tab === "transactions") && (
          <ScrollRecordAction
            key={`${id}:${tab}`}
            disabled={!snapshot || busy || loading || !!snapshot.group.archivedAt}
            onClick={() => {
              setRefund(null);
              setCalendarAddDate(undefined);
              setEditing(null);
            }}
          />
        )}
        <div className="lg:hidden">
          <GroupSecondaryNavigation
            id={id}
            tab={tab}
            busy={busy}
            navigate={navigate}
            collapsed={collapsed}
          />
        </div>
        <main data-workspace={tab} className="space-y-4 p-4 lg:px-[30px] lg:pb-[26px] lg:pt-4">
          {id && (tab === "budget" || tab === "goals") && (
            <BudgetGoalsSwitch
              active={tab === "goals" ? "goals" : "budget"}
              disabled={busy}
              onChange={(value) => navigate(`/groups/${id}/${value}`)}
            />
          )}
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
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-app items-center justify-between border-t border-edge bg-card px-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-2 lg:hidden"
        >
          <LedgerMobileTabs
            active={tab}
            disabled={busy}
            onSelect={(item) =>
              navigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
            }
          />
        </nav>
      )}
      {editing !== undefined && snapshot && (
        <GroupDialog
          title={
            refund
              ? t("addRefund")
              : editing
                ? addFlow("editTransactionModal")
                : nav("addTransaction")
          }
          width={400}
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
