"use client";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { MobileSelectionBar } from "@/components/shared/MobileSelectionBar";
import { IconAction } from "@/components/ui/IconAction";
import { TransactionTools } from "@/components/shared/TransactionTools";
import { GroupSearch } from "./GroupSearch";
import { useDesktop } from "@/hooks/useDesktop";

import { TransactionScopeSwitch } from "@/components/shared/TransactionScopeSwitch";
import { GroupCategorizeButton } from "./GroupCategorizeButton";
import { GroupEntryDetails } from "./GroupEntryDetails";
import { RecordSummary } from "@/components/shared/RecordSummary";
import { SplitBadge } from "./SplitBadge";
import { useStore } from "@/state/store";
import { MAX_GROUP_BULK } from "@/lib/groups/bulk-validation";
import { searchLedger } from "@/lib/groups/search";
import { GroupBulkActions } from "./GroupBulkActions";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import { GroupSpendingInsights } from "./GroupSpendingInsights";
import { Select } from "@/components/ui/Select";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { Panel, buttonClass, inputClass } from "./ui";

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
/** A paged ledger prioritizes payment details, with recording metadata available on demand. */
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
}: {
  data: GroupSnapshot;
  selectedDate?: string;
  onClearDate?: () => void;
  page: number;
  setPage: (n: number) => void;
  filters: GroupLedgerFilters;
  onFiltersChange: (filters: GroupLedgerFilters) => void;
  loading: boolean;
  month: string;
  refresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onEdit: (e: GroupEntry) => void;
  onRefund: (e: GroupEntry) => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters();
  const desktop = useDesktop();
  const editedHighlight = useStore((s) => s.editedHighlight);
  const [now, setNow] = useState(0);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [mobileSelecting, setSelecting] = useState(false),
    [bulkBusy, setBulkBusy] = useState(false);
  const selecting = desktop || mobileSelecting;
  const selected = Object.entries(selection).map(([id, version]) => ({ id, version }));
  const matches = searchLedger(data.reportEntries ?? data.entries, month, filters);
  const clear = () => setSelection({});
  const changeFilters = (next: GroupLedgerFilters) => {
    clear();
    onFiltersChange(next);
  };
  const chooseRows = (rows: GroupEntry[]) =>
    setSelection((current) => {
      const next = { ...current };
      for (const entry of rows) {
        if (!(entry.id in next) && Object.keys(next).length < MAX_GROUP_BULK)
          next[entry.id] = entry.version;
      }
      return next;
    });
  const toggle = (entry: GroupEntry) =>
    setSelection((current) => {
      const next = { ...current };
      if (entry.id in next) delete next[entry.id];
      else if (Object.keys(next).length < MAX_GROUP_BULK) next[entry.id] = entry.version;
      return next;
    });
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const name = (id: string | null) =>
    data.members.find((m) => m.id === id)?.name ?? t("sharedFunds");
  const displayedEntries = selectedDate
    ? searchLedger(data.reportEntries ?? data.entries, month, filters).filter(
        (e) => e.occurredOn === selectedDate,
      )
    : data.entries;
  const categorizeAction = (
    <GroupCategorizeButton
      data={data}
      refresh={refresh}
      disabled={bulkBusy || loading}
      onBusyChange={(busy) => {
        setBulkBusy(busy);
        onBusyChange(busy);
      }}
    />
  );
  return (
    <Panel className="group-ledger-panel">
      <TransactionTools mobile={!desktop} groupId={data.group.id} disabled={bulkBusy || loading}>
        {!desktop && categorizeAction}
      </TransactionTools>
      <div className="lg:hidden">
        <TransactionScopeSwitch
          value={filters.kind ?? "all"}
          disabled={bulkBusy || loading}
          onChange={(kind) => {
            setSelecting(false);
            changeFilters({ ...filters, kind });
          }}
        />
      </div>
      {selectedDate && (
        <button className={`${buttonClass} mb-3`} onClick={onClearDate}>
          {selectedDate} · {t("showFullMonth")}
        </button>
      )}
      <div className="mb-3 hidden flex-wrap gap-2 lg:flex">{desktop && categorizeAction}</div>
      <div className="group-ledger-search mt-3 flex items-start justify-end gap-2">
        <GroupSearch
          data={data}
          filters={filters}
          month={month}
          disabled={bulkBusy}
          onChange={(next) => {
            onClearDate?.();
            changeFilters(next);
          }}
        />
      </div>
      {!desktop && (
        <MobileSelectionBar
          count={matches.length}
          selectedCount={selected.length}
          active={mobileSelecting}
          disabled={bulkBusy || loading}
          onStart={() => setSelecting(true)}
          onDone={() => {
            clear();
            setSelecting(false);
          }}
          onSelectAll={() => chooseRows(matches)}
        />
      )}
      {desktop && (
        <div className="my-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading || bulkBusy}
            className={`${buttonClass} selection-action`}
            onClick={() => chooseRows(data.entries)}
          >
            {t("bulkSelectPage")}
          </button>
          <button
            type="button"
            disabled={loading || bulkBusy}
            className={`${buttonClass} selection-action`}
            onClick={() => chooseRows(matches)}
          >
            {t("bulkSelectMatches")}
          </button>
          <p className="text-xs text-muted">{t("bulkLimit", { count: MAX_GROUP_BULK })}</p>
        </div>
      )}
      {!!selected.length && (
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
      )}
      <p className="my-3 text-xs text-muted" role="status">
        {loading ? (
          <>
            <LoadingIndicator size={16} /> {t("loading")}
          </>
        ) : (
          t("searchResults", { count: data.totalEntries })
        )}
      </p>
      <div className="record-list record-list-connected space-y-1" aria-busy={loading}>
        {displayedEntries.map((e) => {
          const c = data.categories.find((c) => c.id === e.categoryId);
          const recentlyEdited =
            editedHighlight &&
            e.version > 0 &&
            !!e.updatedAt &&
            now >= Date.parse(e.updatedAt) &&
            now - Date.parse(e.updatedAt) < 3 * 24 * 60 * 60 * 1000;
          return (
            <article
              key={e.id}
              tabIndex={
                !desktop && !selecting && !data.group.archivedAt && !bulkBusy ? 0 : undefined
              }
              aria-label={!desktop ? `${t("edit")}: ${e.merchant || t(e.kind)}` : undefined}
              onClick={(event) => {
                // Nested disclosures and selection controls own their clicks; only the mobile row opens editing.
                if (desktop || selecting || bulkBusy || data.group.archivedAt) return;
                if (
                  (event.target as HTMLElement).closest(
                    "details, button, input, label, a, select, textarea",
                  )
                )
                  return;
                onEdit(e);
              }}
              onKeyDown={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  desktop ||
                  selecting ||
                  bulkBusy ||
                  data.group.archivedAt
                )
                  return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onEdit(e);
                }
              }}
              data-highlight={recentlyEdited}
              className={`record-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[14px] px-3 py-1.5 sm:flex sm:flex-wrap sm:items-center ${recentlyEdited ? "bg-[color-mix(in_srgb,var(--primary)_6%,var(--card))]" : ""}`}
            >
              <div className="flex items-center gap-2">
                {selecting && (
                  <label className="flex min-h-11 min-w-11 items-center justify-center">
                    <input
                      type="checkbox"
                      aria-label={t("bulkSelectRecord", { name: e.merchant || t(e.kind) })}
                      checked={e.id in selection}
                      disabled={
                        loading ||
                        bulkBusy ||
                        (!(e.id in selection) && selected.length >= MAX_GROUP_BULK)
                      }
                      onChange={() => toggle(e)}
                      className="record-selection-checkbox h-4 w-4 accent-primary"
                    />
                  </label>
                )}
                <EntitySymbol emoji={c?.emoji ?? "🏷️"} color={c?.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="break-words text-sm font-semibold">{e.merchant || t(e.kind)}</h3>
                  <SplitBadge entry={e} />
                  {recentlyEdited && (
                    <span className="inline-flex shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                      {t("recentlyEdited")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t(e.kind)} · {e.occurredOn} · {name(e.payerId)}
                </p>

                <RecordSummary category={c?.name ?? t("uncategorized")} note={e.note} />
                <div className="hidden lg:block">
                  <GroupEntryDetails entry={e} author={name(e.authorId)} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <strong className="text-sm tabular-nums">
                  {fmt.money(e.amountCents, { signed: true })}
                </strong>
                <div className="lg:hidden">
                  <GroupEntryDetails entry={e} author={name(e.authorId)} compact />
                </div>
              </div>
              {!data.group.archivedAt && (
                <div className="col-span-2 col-start-2 hidden flex-wrap gap-2 lg:flex">
                  <IconAction
                    action="edit"
                    className="rounded-[10px] border border-edge bg-card text-ink hover:bg-track"
                    label={t("edit")}
                    disabled={bulkBusy}
                    onClick={() => onEdit(e)}
                  />
                  {e.kind === "expense" && (
                    <button
                      className={`${buttonClass} hidden lg:inline-flex`}
                      disabled={bulkBusy}
                      onClick={() => onRefund(e)}
                    >
                      {t("refund")}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {!displayedEntries.length && <p className="py-6 text-sm text-muted">{t("noEntries")}</p>}
      </div>
      {!selectedDate && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            disabled={loading || bulkBusy || page === 0}
            className={buttonClass}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </button>
          <span className="text-xs text-muted">
            {page + 1} / {Math.max(1, Math.ceil(data.totalEntries / 50))}
          </span>
          <button
            disabled={loading || bulkBusy || (page + 1) * 50 >= data.totalEntries}
            className={buttonClass}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </button>
        </div>
      )}
    </Panel>
  );
}
