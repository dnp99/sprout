"use client";
import { useMobilePageScroll } from "@/hooks/useMobilePageScroll";
import { abandonMobileHistoryLayers } from "@/lib/pwa/mobile-history";
import { usePageScrollReset } from "@/hooks/usePageScrollReset";
import { TransactionTools } from "@/components/shared/TransactionTools";
import { LoadingRegion } from "@/components/ui/LoadingIndicator";
import { GroupMobileNavigation } from "./GroupMobileNavigation";
import { ScrollRecordAction } from "@/components/shared/ScrollRecordAction";
import { DesktopAccountMenu } from "@/components/settings/DesktopAccountMenu";
import { GroupAccountHeader } from "./GroupAccountHeader";
import { BudgetGoalsSwitch } from "@/components/shared/BudgetGoalsSwitch";
import { GroupSectionTitle } from "./GroupHeaderTitle";
import { GroupPeriodPlanning } from "./GroupPeriodPlanning";

import { useSidebarCollapsed } from "@/components/shared/useSidebarCollapsed";
import { ChevronLeft, ChevronRight, Users, ArrowRightLeft } from "lucide-react";
import { Navigation, NavigationItem } from "@/components/ui/Navigation";
import { Sprout, Home, TrendingUp, LayoutGrid, FileUp, Target } from "lucide-react";
import { ledgerFilterParams, type GroupLedgerFilters } from "@/lib/groups/search";

import { Select } from "@/components/ui/Select";

import { groupContextPath } from "@/lib/groups/context-navigation";
import { groupToday } from "@/lib/groups/navigation";
import { GroupHeaderReportControls } from "./GroupHeaderReportControls";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDesktop } from "@/hooks/useDesktop";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { useStore } from "@/state/store";
import { ContextSwitch } from "./ContextSwitch";
import { GroupDirectory } from "./GroupDirectory";
import { GroupTransactions } from "./GroupLedger";
import { GroupOverview } from "./GroupOverview";
import { useSettlementLeaveGuard } from "./useSettlementLeaveGuard";
import { GroupSettlements } from "./GroupSettlements";
import { GroupTransactionsBack } from "./GroupTransactionsBack";
import { GroupImport } from "./GroupImport";
import { GroupSettings } from "./GroupSettings";
import { GroupSpendingInsights } from "./GroupSpendingInsights";
import type { TrendPeriod } from "@/lib/reports";
import { monthSearchBounds } from "@/lib/search-dates";
import { GroupEntryDialog } from "./GroupEntryDialog";
import { buttonClass, useGroupMutation } from "./ui";
import type { GroupEntry } from "@/lib/groups/dto";

function routeId(pathname: string): string | undefined {
  return pathname.split("/")[2] || undefined;
}

const emptyLedgerFilters: GroupLedgerFilters = { scope: "month" };

const tabs = [
  { id: "overview", icon: Home },
  { id: "transactions", icon: ArrowRightLeft },
  { id: "budget", icon: LayoutGrid },
  { id: "trends", icon: TrendingUp },
  { id: "goals", icon: Target },
  { id: "import", icon: FileUp },
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
  const activeTab = ["bills", "settlements"].includes(tab) ? "transactions" : tab;
  const load = useStore((s) => s.loadGroup),
    loadList = useStore((s) => s.loadGroupList);
  const rememberedMonth = useStore((s) => (id ? s.groupMonths[id] : undefined));
  const [ledgerSearch, setLedgerSearch] = useState<{
    groupId: string | undefined;
    filters: GroupLedgerFilters;
  }>({ groupId: id, filters: emptyLedgerFilters });
  // Payer identities belong to a group; never carry one into a different group.
  const desktop = useDesktop();
  const mobileHeaderHidden = ["overview", "trends", "settings", "settlements"].includes(tab);
  const viewportRef = usePageScrollReset(`${id ?? "directory"}:${tab}`, desktop);
  const storedFilters = ledgerSearch.groupId === id ? ledgerSearch.filters : emptyLedgerFilters;
  const ledgerFilters = storedFilters;
  const [ledgerDate, setLedgerDate] = useState<string | undefined>();
  // Match the reviewed landing layout on every fresh Group visit, rather than
  // relying on a temporary selection made while capturing its preview.
  const [trendView, setTrendView] = useState<"cashflow" | "spending">("spending");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("month");
  const [month, setMonth] = useState(() => rememberedMonth ?? groupToday().slice(0, 7)),
    [page, setPage] = useState(0),
    [editing, setEditing] = useState<GroupEntry | null | undefined>(undefined),
    [refund, setRefund] = useState<GroupEntry | null>(null);
  const mobileViewportRef = useMobilePageScroll(
    `${id ?? "directory"}:${tab}:${tab === "transactions" ? `${month}:${page}:${ledgerFilterParams(ledgerFilters)}` : ""}`,
    ["settlements", "import", "bills"].includes(tab),
    !desktop,
    (!loading && data?.group.id === id) || !id,
  );
  const refresh = useCallback(
    async (background = false) => {
      await Promise.all([
        id
          ? load(id, month, page, tab === "transactions" ? ledgerFilters : {}, background)
          : Promise.resolve(),
        loadList(),
      ]);
    },
    [id, load, loadList, month, page, tab, ledgerFilters],
  );
  const [importBusy, setImportBusy] = useState(false);
  const settlementGuard = useSettlementLeaveGuard(importBusy);
  const { run, busy: mutationBusy } = useGroupMutation(refresh);
  const busy = mutationBusy || importBusy;
  useEffect(() => {
    // Section changes need ledger data, not another membership-list request.
    // Mutations and resume refreshes still revalidate both in parallel.
    if (id) void load(id, month, page, tab === "transactions" ? ledgerFilters : {}).catch(() => {});
  }, [id, load, month, page, tab, ledgerFilters]);
  useEffect(() => {
    void loadList().catch(() => {});
  }, [loadList]);
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
        void refresh(true).catch(() => {});
    };
    window.addEventListener("sprout:resume", focus);
    const timer = setInterval(focus, 25000);
    return () => {
      window.removeEventListener("sprout:resume", focus);
      clearInterval(timer);
    };
  }, [refresh, editing, busy, tab]);
  const snapshot = data?.group.id === id ? data : null;
  const navigate = async (target: string) => {
    if (busy || !(await settlementGuard.beforeLeave())) return;
    settlementGuard.setDirty(false);
    if (!desktop) abandonMobileHistoryLayers();
    setEditing(undefined);
    setRefund(null);
    setPage(0);
    router.push(target, { scroll: false });
  };
  const openDirectory: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void navigate("/groups");
  };
  const changeMonth = async (value: string) => {
    if (busy) return;
    setEditing(undefined);
    setRefund(null);
    setLedgerDate(undefined);
    setMonth(value);
    if (tab === "transactions") {
      const bounds = monthSearchBounds(value);
      setLedgerSearch({
        groupId: id,
        filters: { ...ledgerFilters, scope: "all", dateFrom: bounds.from, dateTo: bounds.to },
      });
    }
    setPage(0);
  };
  return (
    <div
      data-ledger-context="group"
      className="mobile-app-frame mx-auto max-w-app bg-bg text-ink lg:fixed lg:inset-0 lg:mx-0 lg:flex lg:max-w-none lg:overflow-hidden"
    >
      <div ref={mobileViewportRef} data-mobile-scroll className="mobile-page-scroll lg:contents">
        <aside
          className={`group-sidebar relative border-b border-edge bg-bg p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:flex lg:shrink-0 lg:flex-col lg:bg-sidebar lg:border-b-0 lg:border-r lg:py-5 ${collapsed ? "lg:w-[68px] lg:px-2" : "lg:w-[232px] lg:px-[14px]"}`}
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
            onClick={openDirectory}
            className="mb-4 hidden items-center gap-2 px-2 pb-1 text-lg font-bold tracking-[-0.01em] text-primary lg:flex"
          >
            <Sprout size={22} strokeWidth={2} /> {!collapsed && "Sprout"}
          </Link>
          <div className="lg:hidden">
            <GroupAccountHeader
              section={tab}
              id={id}
              name={snapshot?.group.name}
              groups={list}
              disabled={busy}
              onChange={(next) => navigate(groupContextPath(next, tab))}
            />
          </div>
          <div
            className={`${tab !== "overview" ? "mobile-transactions-context" : ""} ${collapsed ? "lg:hidden" : ""}`}
          >
            <ContextSwitch group disabled={busy} beforeNavigate={settlementGuard.beforeLeave} />
          </div>
          {collapsed && (
            <Link
              href="/groups"
              onClick={openDirectory}
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
            <Navigation
              layout="rail"
              aria-label={t("groupNavigation")}
              className="mt-[22px] hidden lg:block"
            >
              {tabs.map((item) => (
                <NavigationItem
                  key={item.id}
                  disabled={busy}
                  active={activeTab === item.id}
                  collapsed={collapsed}
                  label={tabLabel(item.id)}
                  icon={<item.icon size={17} strokeWidth={2} />}
                  onClick={() =>
                    navigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
                  }
                />
              ))}
            </Navigation>
          )}
          <div className="mt-auto hidden border-t border-edge pt-3 lg:block">
            <DesktopAccountMenu compact={collapsed} />
          </div>
        </aside>
        <div
          ref={viewportRef}
          className="group-page-content min-w-0 flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0"
        >
          {id && (
            <header
              className={`${mobileHeaderHidden ? "" : "mobile-transaction-header"} sticky top-0 z-20 ${mobileHeaderHidden ? "hidden lg:flex" : "flex"} flex-wrap items-center justify-between gap-3 border-b border-edge bg-header px-4 py-3.5 backdrop-blur lg:h-16 lg:flex-nowrap lg:px-[30px] lg:py-0`}
            >
              <div
                className={`min-w-0 flex-1 hidden lg:block ${["overview", "trends", "budget", "goals"].includes(tab) ? "basis-full lg:basis-auto" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <GroupSectionTitle section={tab} />
                </div>
              </div>
              {tab === "transactions" && (
                <span className="order-last lg:hidden">
                  <TransactionTools mobile groupId={id} disabled={busy} />
                </span>
              )}
              <GroupHeaderReportControls
                tab={tab}
                month={month}
                date={ledgerDate}
                busy={busy}
                trends={{
                  view: trendView,
                  period: trendPeriod,
                  onViewChange: setTrendView,
                  onPeriodChange: setTrendPeriod,
                }}
                onMonthChange={changeMonth}
                onDateChange={setLedgerDate}
              />
            </header>
          )}
          {id && (tab === "overview" || (!desktop && tab === "transactions")) && (
            <ScrollRecordAction
              key={`${id}:${tab}`}
              disabled={!snapshot || busy || loading || !!snapshot.group.archivedAt}
              onClick={() => {
                setRefund(null);
                setEditing(null);
              }}
            />
          )}
          <main
            key={tab}
            data-workspace={tab}
            className="mobile-screen-enter space-y-4 p-4 lg:px-[30px] lg:pb-[26px] lg:pt-4"
          >
            {id && tab === "settlements" && (
              <GroupTransactionsBack
                busy={busy}
                onBack={() => void navigate(`/groups/${id}/transactions`)}
              />
            )}
            {id && !desktop && (tab === "budget" || tab === "goals") && (
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
              <LoadingRegion />
            ) : (
              <>
                {snapshot.group.archivedAt && (
                  <p className="rounded-[10px] bg-track p-3 text-sm">{t("archivedNotice")}</p>
                )}
                {tab === "overview" && (
                  <GroupOverview
                    key={id}
                    data={snapshot}
                    month={month}
                    onMonthChange={changeMonth}
                    loading={loading}
                    busy={busy}
                    onEdit={(entry) => {
                      setRefund(null);
                      setEditing(entry);
                    }}
                    onViewAll={() => navigate(`/groups/${id}/transactions`)}
                    onExplore={() => navigate(`/groups/${id}/trends`)}
                    onBudget={() => navigate(`/groups/${id}/budget`)}
                  />
                )}
                {tab === "transactions" && (
                  <GroupTransactions
                    key={`${id}:${month}`}
                    data={snapshot}
                    month={month}
                    refresh={refresh}
                    onBusyChange={setImportBusy}
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
                    onAdd={() => {
                      setRefund(null);
                      setEditing(null);
                    }}
                    onEdit={(e) => {
                      setRefund(null);
                      setEditing(e);
                    }}
                    onRefund={(e) => {
                      setRefund(e);
                      setEditing(null);
                    }}
                  />
                )}
                {tab === "trends" && (
                  <GroupSpendingInsights
                    mobileTrends={{
                      view: trendView,
                      period: trendPeriod,
                      onViewChange: setTrendView,
                      onPeriodChange: setTrendPeriod,
                    }}
                    data={snapshot}
                    month={month}
                    onMonthChange={changeMonth}
                  />
                )}
                {(tab === "goals" || tab === "bills" || tab === "budget") && (
                  <GroupPeriodPlanning
                    key={`${id}:${tab}:${month}:${desktop ? "desktop" : trendPeriod}`}
                    data={snapshot}
                    month={month}
                    tab={tab}
                    run={run}
                    busy={busy}
                    mobile={!desktop}
                    period={desktop ? "month" : trendPeriod}
                  />
                )}
                {tab === "settlements" && (
                  <GroupSettlements
                    onDirtyChange={settlementGuard.setDirty}
                    key={id}
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
      </div>
      {settlementGuard.confirmation}
      {id && <GroupMobileNavigation id={id} tab={tab} busy={busy} onNavigate={navigate} />}
      {editing !== undefined && snapshot && (
        <GroupEntryDialog
          data={snapshot}
          editing={editing}
          refund={refund}
          run={run}
          busy={busy}
          onClose={async () => {
            if (!busy) {
              setEditing(undefined);
              setRefund(null);
            }
          }}
          onRefund={(entry) => {
            setRefund(entry);
            setEditing(null);
          }}
          onDone={() => {
            setEditing(undefined);
            setRefund(null);
          }}
        />
      )}
    </div>
  );
}
