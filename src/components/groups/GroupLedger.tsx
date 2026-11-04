"use client";
import { useEffect, useRef, useState } from "react";
import { TransactionPagination } from "@/components/shared/TransactionPagination";
import {
  MobileTransactionTotals,
  MobileTransactionCount,
} from "@/components/shared/MobileTransactionSummary";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { useDesktop } from "@/hooks/useDesktop";
import { useStore } from "@/state/store";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { TransactionTools } from "@/components/shared/TransactionTools";
import { MobileSelectionBar } from "@/components/shared/MobileSelectionBar";
import { TransactionFilterRail } from "@/components/web/TransactionFilterRail";
import { TransactionTotals } from "@/components/web/TransactionTotals";
import { MAX_GROUP_BULK } from "@/lib/groups/bulk-validation";
import { searchLedger } from "@/lib/groups/search";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";
import { GroupSpendingInsights } from "./GroupSpendingInsights";
import { GroupCategorizeButton } from "./GroupCategorizeButton";
import { GroupSearch } from "./GroupSearch";
import { GroupTypeFilters, GroupPayerFilter, kindLabels } from "./GroupTransactionFilters";
import {
  GroupTransactionColumns,
  GroupTransactionRow,
  GroupTransactionDetail,
} from "./GroupTransactionRows";
import { GroupBulkActions } from "./GroupBulkActions";
import { Panel, buttonClass, primaryClass } from "./ui";
/** Monthly flows and all-time debt are labeled separately to avoid misleading totals. */
export function GroupOverview({
  data,
  month,
  onMonthChange,
}: {
  data: GroupSnapshot;
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters(),
    s = data.summary;
  const tiles = [
    {
      label: t("householdSpending"),
      amount: s.spendingCents,
      surface: "context-major",
    },
    {
      label: t("remaining"),
      amount: data.budget.poolCents - s.spendingCents,
      surface: "context-major-alt",
    },
    { label: t("income"), amount: s.incomeCents, surface: "context-minor" },
  ];
  return (
    <>
      <p className="text-xs text-muted">{t("dailySummaryHint")}</p>
      <div className="space-y-4">
        <div className="context-summary-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((x) => (
            <Panel
              key={x.label}
              tone={x.label === t("income") ? "mint" : "peach"}
              className={x.surface}
            >
              <p className="text-xs font-medium text-muted">{x.label}</p>
              <p className="mt-3 text-[26px] font-bold tabular-nums">
                {x.label === t("remaining") && !data.budget.exists
                  ? t("unset")
                  : fmt.money(x.amount)}
              </p>
            </Panel>
          ))}
        </div>
      </div>
      <GroupSpendingInsights data={data} month={month} onMonthChange={onMonthChange} />
    </>
  );
}

/** Personal's table/card hierarchy with Group accounting and versioned selection. */
export function GroupTransactions({
  data,
  page,
  setPage,
  selectedDate,
  onClearDate,
  filters,
  onFiltersChange,
  loading,
  month,
  refresh,
  onBusyChange,
  onEdit,
  onRefund,
  onAdd,
}: {
  data: GroupSnapshot;
  page: number;
  setPage: (page: number) => void;
  selectedDate?: string;
  onClearDate?: () => void;
  filters: GroupLedgerFilters;
  onFiltersChange: (filters: GroupLedgerFilters) => void;
  loading: boolean;
  month: string;
  refresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onEdit: (entry: GroupEntry) => void;
  onRefund: (entry: GroupEntry) => void;
  onAdd?: () => void;
}) {
  const g = useTranslations("groups"),
    t = useTranslations("txns"),
    nav = useTranslations("nav"),
    fmt = useFormatters();
  const desktop = useDesktop(),
    editedHighlight = useStore((s) => s.editedHighlight);
  const [collapsed, setCollapsed] = useState(false),
    [selection, setSelection] = useState<Record<string, number>>({});
  const [selecting, setSelecting] = useState(false),
    [bulkBusy, setBulkBusy] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null),
    [now, setNow] = useState(0);
  const selected = Object.entries(selection).map(([id, version]) => ({ id, version }));
  const source = data.reportEntries ?? data.entries;
  const labels = { categories: data.categories, members: data.members };
  const searched = searchLedger(source, month, filters, labels);
  const matches = selectedDate
    ? searched.filter((entry) => entry.occurredOn === selectedDate)
    : searched;
  const displayed = selectedDate
    ? matches
    : data.reportEntries
      ? matches.slice(page * 50, (page + 1) * 50)
      : data.entries;
  const count = data.reportEntries || selectedDate ? matches.length : data.totalEntries;
  const allPageSelected = displayed.length > 0 && displayed.every((entry) => entry.id in selection);
  const clear = () => setSelection({});
  const changeFilters = (next: GroupLedgerFilters) => {
    clear();
    setSelecting(false);
    onFiltersChange(next);
  };
  const chooseRows = (rows: GroupEntry[]) =>
    setSelection((current) => {
      const next = { ...current };
      for (const entry of rows)
        if (!(entry.id in next) && Object.keys(next).length < MAX_GROUP_BULK)
          next[entry.id] = entry.version;
      return next;
    });
  const toggle = (entry: GroupEntry) => {
    if (loading || bulkBusy) return;
    setSelection((current) => {
      const next = { ...current };
      if (entry.id in next) delete next[entry.id];
      else if (Object.keys(next).length < MAX_GROUP_BULK) next[entry.id] = entry.version;
      return next;
    });
  };
  const togglePage = () => {
    if (allPageSelected)
      setSelection((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => !displayed.some((entry) => entry.id === id)),
        ),
      );
    else chooseRows(displayed);
  };
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const scopeRows = searchLedger(source, month, { ...filters, category: undefined }, labels);
  const counts = new Map<string, number>();
  for (const entry of scopeRows)
    if (entry.categoryId) counts.set(entry.categoryId, (counts.get(entry.categoryId) ?? 0) + 1);
  const totalCents = matches.reduce((sum, entry) => sum + entry.amountCents, 0);
  const spentCents = -matches
    .filter((entry) => entry.kind === "expense" || entry.kind === "refund")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const incomeCents = matches
    .filter((entry) => entry.kind === "income")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const busy = bulkBusy || loading;
  const filterProps = { data, filters, disabled: bulkBusy, onChange: changeFilters };
  const detail = source.find((entry) => entry.id === detailId);
  const bulk = selected.length > 0 && (
    <GroupBulkActions
      data={data}
      selection={selected}
      refresh={refresh}
      onClear={clear}
      onBusyChange={(value) => {
        setBulkBusy(value);
        onBusyChange(value);
      }}
    />
  );
  const listRef = useRef<HTMLDivElement>(null);
  const monthlyCount = searchLedger(source, month, { scope: "month" }).length;
  const paginate = !selectedDate && (
    <TransactionPagination
      page={page}
      count={count}
      showLabels={!desktop}
      disabled={busy}
      onChange={(next) => {
        setPage(next);
        const list = listRef.current;
        if (list) {
          if (desktop) list.scrollTop = 0;
          else {
            // Body and nested Group scrolling both honour scrollIntoView;
            // measured header clearance keeps the first record visible.
            const header = list.closest(".group-page-content")?.querySelector("header");
            list.style.scrollMarginTop = `${(header?.getBoundingClientRect().height ?? 0) + 8}px`;
            list.scrollIntoView?.({ block: "start", behavior: "auto" });
          }
        }
      }}
    />
  );
  return (
    <div
      className={`group-transactions desktop-transactions min-h-0 min-w-0 lg:grid lg:h-full lg:flex-1 lg:gap-[14px] ${collapsed ? "lg:grid-cols-[44px_minmax(0,1fr)]" : "lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]"}`}
    >
      {desktop && (
        <TransactionFilterRail
          title={t("categoriesLabel")}
          description={t("chooseCategory")}
          allLabel={t("allCategories")}
          items={orderGroupCategories(data.categories)
            .filter((row) => !row.archived || counts.has(row.id))
            .map((row) => ({
              id: row.id,
              label: groupCategoryLabel(data.categories, row.id),
              icon: <EntitySymbol emoji={row.emoji} color={row.color} size={16} />,
            }))}
          activeId={filters.category ?? "all"}
          totalCount={scopeRows.length}
          counts={counts}
          onSelect={(category) =>
            changeFilters({ ...filters, category: category === "all" ? undefined : category })
          }
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(!collapsed)}
          collapseLabel={t("collapseCategories")}
          expandLabel={t("expandCategories")}
        />
      )}
      <section className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <GroupTypeFilters {...filterProps} mobile={!desktop} />
          {desktop && <GroupPayerFilter {...filterProps} />}
        </div>
        <div className="desktop-ledger-toolbar flex flex-wrap items-start justify-between gap-2">
          <div className="desktop-transaction-tools flex flex-wrap items-center gap-2">
            {desktop && <TransactionTools groupId={data.group.id} disabled={busy} />}
            <GroupCategorizeButton
              data={data}
              refresh={refresh}
              disabled={busy}
              onBusyChange={(value) => {
                setBulkBusy(value);
                onBusyChange(value);
              }}
            />
          </div>
          {desktop && <GroupSearch {...filterProps} month={month} />}
          {desktop && (
            <button
              type="button"
              className={`${primaryClass} gap-2`}
              disabled={busy || !!data.group.archivedAt || !onAdd}
              onClick={onAdd}
            >
              <Plus size={16} />
              {nav("addTransaction")}
            </button>
          )}
        </div>
        {!desktop && <GroupSearch {...filterProps} month={month} />}
        {!desktop && (filters.kind === "refund" || filters.kind === "uncategorized") && (
          <button
            type="button"
            className="self-start rounded-full bg-primary-soft px-3 py-2 text-xs text-primary"
            onClick={() => changeFilters({ ...filters, kind: "all" })}
          >
            {t(kindLabels[filters.kind])} ×
          </button>
        )}
        {selectedDate && (
          <button type="button" className={`${buttonClass} self-start`} onClick={onClearDate}>
            {selectedDate} · {g("showFullMonth")}
          </button>
        )}
        {!desktop && (
          <div className="mobile-transaction-summary">
            <MobileTransactionTotals spentCents={spentCents} incomeCents={incomeCents} />
            <MobileSelectionBar
              summary={<MobileTransactionCount count={count} total={monthlyCount} />}
              actions={bulk}
              count={count}
              selectedCount={selected.length}
              active={selecting}
              disabled={busy}
              onStart={() => setSelecting(true)}
              onDone={() => {
                clear();
                setSelecting(false);
              }}
              onSelectAll={() => chooseRows(matches)}
            />
          </div>
        )}
        <div
          className={
            desktop
              ? "cozy-transaction-table flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto rounded-[14px] border border-edge bg-card"
              : "min-w-0"
          }
        >
          <div className={desktop ? "flex min-h-0 min-w-[760px] flex-1 flex-col" : ""}>
            {desktop && (
              <div className="cozy-transaction-head shrink-0 border-b border-edge bg-card">
                {selected.length ? (
                  <div className="max-h-[40dvh] overflow-y-auto">
                    <div className="flex flex-wrap items-center gap-2 px-3 pt-2">
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={busy}
                        onClick={() => chooseRows(matches)}
                      >
                        {g("bulkSelectMatches")}
                      </button>
                      <span className="text-xs text-muted">
                        {g("bulkLimit", { count: MAX_GROUP_BULK })}
                      </span>
                    </div>
                    {bulk}
                  </div>
                ) : (
                  <GroupTransactionColumns
                    allSelected={allPageSelected}
                    toggleAll={togglePage}
                    filters={filters}
                    disabled={busy}
                    onSort={(sort) =>
                      changeFilters({
                        ...filters,
                        sort,
                        direction:
                          filters.sort === sort && filters.direction === "asc" ? "desc" : "asc",
                      })
                    }
                  />
                )}
              </div>
            )}
            <div
              className={`group-record-viewport relative min-h-0 ${desktop ? "flex flex-1 flex-col overflow-hidden" : loading && !displayed.length ? "min-h-24" : ""}`}
            >
              <div
                className={`record-list ${desktop ? "min-h-0 flex-1 overflow-y-auto overscroll-contain" : "record-list-connected flex flex-col"}`}
                ref={listRef}
                inert={loading || undefined}
                aria-busy={loading}
              >
                {displayed.map((entry) => (
                  <GroupTransactionRow
                    key={entry.id}
                    entry={entry}
                    data={data}
                    desktop={desktop}
                    selected={entry.id in selection}
                    selecting={selecting}
                    selectionDisabled={
                      selected.length >= MAX_GROUP_BULK && !(entry.id in selection)
                    }
                    disabled={busy}
                    onToggle={() => toggle(entry)}
                    onOpen={() => setDetailId(entry.id)}
                    onEdit={() => onEdit(entry)}
                    onRefund={() => onRefund(entry)}
                    recentlyEdited={
                      !!editedHighlight &&
                      entry.version > 0 &&
                      !!entry.updatedAt &&
                      now >= Date.parse(entry.updatedAt) &&
                      now - Date.parse(entry.updatedAt) < 3 * 24 * 60 * 60 * 1000
                    }
                  />
                ))}
                {!displayed.length && !loading && (
                  <p className="p-6 text-center text-sm text-muted">{g("noEntries")}</p>
                )}
              </div>
              {loading && (
                <div
                  className="record-loading-veil absolute inset-0 z-30 flex items-start justify-center pt-6 lg:items-center lg:pt-0"
                  data-record-loading
                >
                  <span className="flex h-14 w-14 items-center justify-center text-primary">
                    <LoadingIndicator size={28} label={g("loading")} />
                  </span>
                </div>
              )}
            </div>
            {desktop && (
              <TransactionTotals
                count={count}
                month={month}
                monthlyCount={monthlyCount}
                pagination={paginate}
                excludedCount={0}
                reimbursementCount={0}
                totalCents={totalCents}
              />
            )}
            {!desktop && !selectedDate && count > 50 && (
              <div className="mobile-transaction-pagination">{paginate}</div>
            )}
          </div>
        </div>
      </section>
      {detail && (
        <GroupTransactionDetail
          entry={detail}
          data={data}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            onEdit(detail);
          }}
          onRefund={() => {
            setDetailId(null);
            onRefund(detail);
          }}
        />
      )}
    </div>
  );
}
