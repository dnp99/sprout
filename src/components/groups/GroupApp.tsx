"use client";

import { groupToday, shiftGroupMonth } from "@/lib/groups/navigation";
import { MonthSelector } from "@/components/shared/MonthSelector";
import { useFormatters } from "@/i18n/useFormatters";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Wallet, ChartPie, ArrowLeftRight, Settings, Plus } from "lucide-react";
import { useStore } from "@/state/store";
import { ContextSwitch } from "./ContextSwitch";
import { GroupDirectory } from "./GroupDirectory";
import { GroupOverview, GroupTransactions } from "./GroupLedger";
import { GroupBudget } from "./GroupBudget";
import { GroupSettlements } from "./GroupSettlements";
import { GroupSettings } from "./GroupSettings";
import { EntryForm } from "./EntryForm";
import { buttonClass, primaryClass, GroupDialog, useGroupMutation } from "./ui";
import type { GroupEntry } from "@/lib/groups/dto";

function routeId(pathname: string): string | undefined {
  return pathname.split("/")[2] || undefined;
}

const tabs = [
  { id: "overview", icon: LayoutDashboard },
  { id: "transactions", icon: Wallet },
  { id: "budget", icon: ChartPie },
  { id: "settlements", icon: ArrowLeftRight },
  { id: "settings", icon: Settings },
] as const;
/** One responsive household shell avoids parallel desktop/mobile data requests. */
export function GroupApp() {
  const pathname = usePathname(),
    router = useRouter(),
    id = routeId(pathname),
    tab = pathname.split("/")[3] || "overview";
  const fmt = useFormatters();
  const t = useTranslations("groups"),
    data = useStore((s) => s.groupData),
    list = useStore((s) => s.groupList),
    error = useStore((s) => s.groupError),
    loading = useStore((s) => s.groupLoading);
  const load = useStore((s) => s.loadGroup),
    loadList = useStore((s) => s.loadGroupList);
  const rememberedMonth = useStore((s) => (id ? s.groupMonths[id] : undefined));
  const [month, setMonth] = useState(() => rememberedMonth ?? groupToday().slice(0, 7)),
    [page, setPage] = useState(0),
    [editing, setEditing] = useState<GroupEntry | null | undefined>(undefined),
    [refund, setRefund] = useState<GroupEntry | null>(null);
  const refresh = useCallback(async () => {
    if (id) await load(id, month, page);
    await loadList();
  }, [id, load, loadList, month, page]);
  const { run, busy } = useGroupMutation(refresh);
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
        !["budget", "settlements", "settings"].includes(tab)
      )
        void refresh().catch(() => {});
    };
    window.addEventListener("focus", focus);
    const timer = setInterval(focus, 25000);
    return () => {
      window.removeEventListener("focus", focus);
      clearInterval(timer);
    };
  }, [refresh, editing, busy, tab]);
  useEffect(() => {
    if (editing === undefined) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing]);
  const snapshot = data?.group.id === id ? data : null;
  const navigate = (target: string) => {
    if (busy) return;
    if (editing !== undefined && !window.confirm(t("discard"))) return;
    setEditing(undefined);
    setRefund(null);
    setPage(0);
    router.push(target);
  };
  const changeMonth = (value: string) => {
    if (busy) return;
    if (editing !== undefined && !window.confirm(t("discard"))) return;
    setEditing(undefined);
    setRefund(null);
    setMonth(value);
    setPage(0);
  };
  return (
    <div className="mx-auto min-h-[100svh] max-w-app bg-bg text-ink lg:fixed lg:inset-0 lg:mx-0 lg:flex lg:max-w-none lg:overflow-hidden">
      <aside className="border-b border-edge bg-sidebar p-3 lg:flex lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:p-4">
        <Link href="/groups" className="mb-4 hidden text-xl font-bold text-primary lg:block">
          Sprout
        </Link>
        <ContextSwitch
          group
          disabled={busy}
          beforeNavigate={() => editing === undefined || window.confirm(t("discard"))}
        />
        <div className="mt-3">
          <label className="sr-only" htmlFor="group-picker">
            {t("chooseGroup")}
          </label>
          <select
            id="group-picker"
            disabled={busy}
            value={id ?? ""}
            onChange={(e) => navigate(e.target.value ? `/groups/${e.target.value}` : "/groups")}
            className="min-h-11 w-full rounded-[10px] border border-edge bg-card px-2 text-sm font-semibold"
          >
            <option value="">{t("allGroups")}</option>
            {list.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        {id && (
          <nav aria-label={t("groupNavigation")} className="mt-4 hidden space-y-1 lg:block">
            {tabs.map((item) => (
              <button
                key={item.id}
                disabled={busy}
                onClick={() =>
                  navigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
                }
                className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm ${tab === item.id ? "bg-primary-soft font-semibold text-primary" : "text-muted hover:bg-track"}`}
              >
                <item.icon size={17} strokeWidth={2} />
                {t(item.id)}
              </button>
            ))}
          </nav>
        )}
        <button onClick={() => navigate("/groups")} className={`${buttonClass} mt-4 w-full`}>
          {t("manageGroups")}
        </button>
        <Link
          href="/settings"
          className="mt-4 hidden min-h-11 items-center text-sm text-muted lg:flex"
        >
          {t("accountSettings")}
        </Link>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
        {id && (
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-header px-4 py-3 backdrop-blur lg:px-7">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold">{snapshot?.group.name ?? t("title")}</h1>
              <p className="text-xs text-muted">
                {t(tabs.some((i) => i.id === tab) ? tab : "overview")}
              </p>
            </div>
            <MonthSelector
              label={fmt.monthKey(month)}
              ariaLabel={t("month")}
              onPrevious={() => changeMonth(shiftGroupMonth(month, -1))}
              onNext={() => changeMonth(shiftGroupMonth(month, 1))}
              previousTitle={t("previous")}
              nextTitle={t("next")}
            />
          </header>
        )}
        <main className="space-y-4 p-4 lg:p-7">
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
              {!snapshot.group.archivedAt && (tab === "overview" || tab === "transactions") && (
                <button
                  disabled={busy || loading}
                  onClick={() => {
                    setRefund(null);
                    setEditing(null);
                  }}
                  className={primaryClass}
                >
                  <Plus size={16} />
                  {t("addEntry")}
                </button>
              )}
              {tab === "overview" && <GroupOverview data={snapshot} />}
              {tab === "transactions" && (
                <GroupTransactions
                  data={snapshot}
                  page={page}
                  setPage={setPage}
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
                <GroupSettlements key={id} data={snapshot} run={run} busy={busy} />
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
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-app justify-around border-t border-edge bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              disabled={busy}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() =>
                navigate(`/groups/${id}${item.id === "overview" ? "" : `/${item.id}`}`)
              }
              className={`flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] ${tab === item.id ? "text-primary" : "text-muted"}`}
            >
              <item.icon size={18} />
              <span>{t(item.id)}</span>
            </button>
          ))}
        </nav>
      )}
      {editing !== undefined && snapshot && (
        <GroupDialog
          title={t(refund ? "addRefund" : editing ? "editEntry" : "addEntry")}
          onClose={() => {
            if (!busy && window.confirm(t("discard"))) {
              setEditing(undefined);
              setRefund(null);
            }
          }}
        >
          <EntryForm
            data={snapshot}
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
